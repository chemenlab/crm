<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Http\Resources\Mobile\ScheduleResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Schedule',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'day_of_week', type: 'integer', example: 1, description: '0 = воскресенье, 1 = понедельник, ..., 6 = суббота (Carbon)'),
        new OA\Property(property: 'is_working', type: 'boolean', example: true),
        new OA\Property(property: 'start_time', type: 'string', example: '09:00', nullable: true, description: 'Время начала работы HH:MM'),
        new OA\Property(property: 'end_time', type: 'string', example: '18:00', nullable: true, description: 'Время окончания работы HH:MM'),
        new OA\Property(property: 'break_start', type: 'string', example: '13:00', nullable: true, description: 'Начало перерыва HH:MM'),
        new OA\Property(property: 'break_end', type: 'string', example: '14:00', nullable: true, description: 'Конец перерыва HH:MM'),
    ]
)]
class ScheduleController extends Controller
{
    #[OA\Get(
        path: '/mobile/schedule',
        summary: 'Расписание мастера',
        description: 'Возвращает рабочее расписание по дням недели (7 записей). Время в timezone мастера.',
        security: [['BearerAuth' => []]],
        tags: ['Schedule'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Расписание по дням недели',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'success', type: 'boolean', example: true),
                    new OA\Property(
                        property: 'data',
                        type: 'array',
                        items: new OA\Items(ref: '#/components/schemas/Schedule'),
                        description: 'Массив из 7 элементов (один на каждый день недели)'
                    ),
                    new OA\Property(property: 'sync_timestamp', type: 'string', format: 'date-time', example: '2026-02-22T10:00:00Z'),
                ]),
            ),
            new OA\Response(response: 401, description: 'Не авторизован'),
        ],
    )]
    public function index(Request $request): JsonResponse
    {
        $schedule = $request->user()
            ->userSchedules()
            ->orderBy('day_of_week')
            ->get();

        return response()->json([
            'success'        => true,
            'data'           => ScheduleResource::collection($schedule),
            'sync_timestamp' => now()->toIso8601ZuluString(),
        ]);
    }
}
