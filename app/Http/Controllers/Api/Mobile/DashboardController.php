<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Http\Resources\Mobile\AppointmentResource;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class DashboardController extends Controller
{
    #[OA\Get(
        path: '/mobile/dashboard',
        summary: 'Сводка для главного экрана',
        description: 'Возвращает статистику за сегодня, за текущий месяц и ближайшие 5 записей. Все даты в UTC, today — в timezone мастера.',
        security: [['BearerAuth' => []]],
        tags: ['Dashboard'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Сводная статистика',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'success', type: 'boolean', example: true),
                    new OA\Property(
                        property: 'data',
                        type: 'object',
                        properties: [
                            new OA\Property(
                                property: 'today',
                                type: 'object',
                                properties: [
                                    new OA\Property(property: 'date', type: 'string', example: '2026-02-22'),
                                    new OA\Property(property: 'appointments_count', type: 'integer', example: 5),
                                    new OA\Property(property: 'completed_count', type: 'integer', example: 3),
                                    new OA\Property(property: 'revenue', type: 'number', format: 'float', example: 4500.00),
                                ]
                            ),
                            new OA\Property(
                                property: 'month',
                                type: 'object',
                                properties: [
                                    new OA\Property(property: 'appointments_count', type: 'integer', example: 48),
                                    new OA\Property(property: 'revenue', type: 'number', format: 'float', example: 72000.00),
                                ]
                            ),
                            new OA\Property(
                                property: 'upcoming_appointments',
                                type: 'array',
                                items: new OA\Items(ref: '#/components/schemas/Appointment'),
                                description: 'Ближайшие 5 записей со статусом scheduled или confirmed'
                            ),
                        ]
                    ),
                    new OA\Property(property: 'sync_timestamp', type: 'string', format: 'date-time', example: '2026-02-22T10:00:00Z'),
                ]),
            ),
            new OA\Response(response: 401, description: 'Не авторизован'),
        ],
    )]
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $userTimezone = $user->timezone ?? 'UTC';
        $today = Carbon::now($userTimezone)->toDateString();

        $todayStart = Carbon::parse($today, $userTimezone)->startOfDay()->utc();
        $todayEnd   = Carbon::parse($today, $userTimezone)->endOfDay()->utc();

        $appointmentsToday = $user->appointments()
            ->whereBetween('start_time', [$todayStart, $todayEnd])
            ->count();

        $completedToday = $user->appointments()
            ->whereBetween('start_time', [$todayStart, $todayEnd])
            ->where('status', 'completed')
            ->count();

        $revenueToday = $user->appointments()
            ->whereBetween('start_time', [$todayStart, $todayEnd])
            ->where('status', 'completed')
            ->sum('price');

        $startOfMonth = Carbon::now($userTimezone)->startOfMonth()->utc();
        $endOfMonth   = Carbon::now($userTimezone)->endOfMonth()->utc();

        $appointmentsMonth = $user->appointments()
            ->whereBetween('start_time', [$startOfMonth, $endOfMonth])
            ->count();

        $revenueMonth = $user->appointments()
            ->whereBetween('start_time', [$startOfMonth, $endOfMonth])
            ->where('status', 'completed')
            ->sum('price');

        $upcoming = $user->appointments()
            ->with(['client', 'service'])
            ->where('start_time', '>', now())
            ->whereIn('status', ['scheduled', 'confirmed'])
            ->orderBy('start_time')
            ->take(5)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'today' => [
                    'date'               => $today,
                    'appointments_count' => $appointmentsToday,
                    'completed_count'    => $completedToday,
                    'revenue'            => (float) $revenueToday,
                ],
                'month' => [
                    'appointments_count' => $appointmentsMonth,
                    'revenue'            => (float) $revenueMonth,
                ],
                'upcoming_appointments' => AppointmentResource::collection($upcoming),
            ],
            'sync_timestamp' => now()->toIso8601ZuluString(),
        ]);
    }
}
