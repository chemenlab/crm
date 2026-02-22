<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Services\Booking\TimeSlotGenerator;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class SlotController extends Controller
{
    #[OA\Get(
        path: '/mobile/slots',
        summary: 'Доступные временные слоты',
        description: 'Возвращает список доступных слотов на указанную дату для выбранной услуги. Учитывает расписание мастера, существующие записи и буферное время. Слоты в формате HH:MM в timezone мастера.',
        security: [['BearerAuth' => []]],
        tags: ['Slots'],
        parameters: [
            new OA\Parameter(name: 'date', in: 'query', required: true, description: 'Дата в формате YYYY-MM-DD (в timezone мастера)', schema: new OA\Schema(type: 'string', format: 'date', example: '2026-02-23')),
            new OA\Parameter(name: 'service_id', in: 'query', required: true, description: 'ID услуги для расчёта длительности и буфера', schema: new OA\Schema(type: 'integer', example: 3)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Список доступных слотов',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'success', type: 'boolean', example: true),
                    new OA\Property(property: 'date', type: 'string', example: '2026-02-23'),
                    new OA\Property(property: 'data', type: 'array', items: new OA\Items(type: 'string', example: '09:00'), description: 'Массив слотов в формате HH:MM в timezone мастера'),
                    new OA\Property(property: 'sync_timestamp', type: 'string', format: 'date-time', example: '2026-02-22T10:00:00Z'),
                ]),
            ),
            new OA\Response(response: 401, description: 'Не авторизован'),
            new OA\Response(response: 404, description: 'Услуга не найдена'),
            new OA\Response(response: 422, description: 'Ошибка валидации'),
        ],
    )]
    public function index(Request $request, TimeSlotGenerator $slotGenerator): JsonResponse
    {
        $request->validate([
            'date'       => ['required', 'date_format:Y-m-d'],
            'service_id' => ['required', 'integer', 'exists:services,id'],
        ]);

        $user = $request->user();
        $userTimezone = $user->timezone ?? 'UTC';

        $service = $user->services()->findOrFail($request->service_id);
        $date = Carbon::parse($request->date, $userTimezone)->startOfDay();

        $schedule = $user->userSchedules()
            ->where('day_of_week', $date->dayOfWeek)
            ->first();

        if (!$schedule || !$schedule->is_working) {
            return response()->json([
                'success'        => true,
                'date'           => $request->date,
                'data'           => [],
                'sync_timestamp' => now()->toIso8601ZuluString(),
            ]);
        }

        $slotStep   = $slotGenerator->getEffectiveSlotStep($service, $user);
        $bufferTime = $slotGenerator->getEffectiveBufferTime($service, $user);
        $duration   = $service->duration;

        $workStart = $date->copy()->setTimeFromTimeString($schedule->start_time);
        $workEnd   = $date->copy()->setTimeFromTimeString($schedule->end_time);

        $dateStartUtc = $date->copy()->startOfDay()->utc();
        $dateEndUtc   = $date->copy()->endOfDay()->utc();

        $busyIntervals = $user->appointments()
            ->whereBetween('start_time', [$dateStartUtc, $dateEndUtc])
            ->whereIn('status', ['scheduled', 'confirmed'])
            ->with('service')
            ->get()
            ->map(function ($app) use ($userTimezone, $slotGenerator, $user) {
                $apptBuffer = $app->service
                    ? $slotGenerator->getEffectiveBufferTime($app->service, $user)
                    : 0;
                return [
                    'start' => Carbon::parse($app->start_time)->setTimezone($userTimezone),
                    'end'   => Carbon::parse($app->end_time)->setTimezone($userTimezone)->addMinutes($apptBuffer),
                ];
            })
            ->sortBy('start')
            ->values();

        if ($schedule->break_start && $schedule->break_end) {
            $busyIntervals->push([
                'start' => $date->copy()->setTimeFromTimeString($schedule->break_start),
                'end'   => $date->copy()->setTimeFromTimeString($schedule->break_end),
            ]);
        }

        $candidateTimes = collect();
        $current = $workStart->copy();
        while ($current->lt($workEnd)) {
            $candidateTimes->push($current->copy());
            $current->addMinutes($slotStep);
        }
        foreach ($busyIntervals as $interval) {
            $candidateTimes->push($interval['end']->copy());
        }

        $now = Carbon::now($userTimezone);
        $validSlots = $candidateTimes
            ->unique(fn ($dt) => $dt->format('H:i'))
            ->sort(fn ($a, $b) => $a->timestamp <=> $b->timestamp)
            ->filter(function ($slotStart) use ($workStart, $workEnd, $duration, $bufferTime, $busyIntervals, $date, $now) {
                $slotEnd = $slotStart->copy()->addMinutes($duration);
                $slotEndWithBuffer = $slotEnd->copy()->addMinutes($bufferTime);

                if ($slotStart->lt($workStart)) {
                    return false;
                }
                if ($slotEnd->gt($workEnd)) {
                    return false;
                }
                if ($date->isToday() && $slotStart->lte($now)) {
                    return false;
                }
                foreach ($busyIntervals as $interval) {
                    if ($slotStart->lt($interval['end']) && $slotEndWithBuffer->gt($interval['start'])) {
                        return false;
                    }
                }
                return true;
            })
            ->values()
            ->map(fn ($dt) => $dt->format('H:i'));

        return response()->json([
            'success'        => true,
            'date'           => $request->date,
            'data'           => $validSlots->values(),
            'sync_timestamp' => now()->toIso8601ZuluString(),
        ]);
    }
}
