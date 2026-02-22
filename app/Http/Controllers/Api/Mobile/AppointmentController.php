<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Http\Resources\Mobile\AppointmentResource;
use App\Models\Appointment;
use App\Models\ServiceOption;
use App\Services\Subscription\UsageLimitService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Appointment',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 42),
        new OA\Property(property: 'client_id', type: 'integer', example: 7),
        new OA\Property(property: 'service_id', type: 'integer', example: 3),
        new OA\Property(property: 'start_time', type: 'string', format: 'date-time', example: '2026-02-22T09:00:00Z', description: 'UTC ISO 8601'),
        new OA\Property(property: 'end_time', type: 'string', format: 'date-time', example: '2026-02-22T10:00:00Z', description: 'UTC ISO 8601'),
        new OA\Property(property: 'status', type: 'string', enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'], example: 'scheduled'),
        new OA\Property(property: 'payment_method', type: 'string', nullable: true, enum: ['cash', 'card'], example: 'cash'),
        new OA\Property(property: 'price', type: 'number', format: 'float', example: 2500.00),
        new OA\Property(property: 'notes', type: 'string', nullable: true, example: 'Клиент предпочитает без звонков'),
        new OA\Property(property: 'client', nullable: true, properties: [
            new OA\Property(property: 'id', type: 'integer'),
            new OA\Property(property: 'name', type: 'string', example: 'Анна Петрова'),
            new OA\Property(property: 'phone', type: 'string', example: '+79991234567'),
            new OA\Property(property: 'email', type: 'string', nullable: true),
        ]),
        new OA\Property(property: 'service', nullable: true, properties: [
            new OA\Property(property: 'id', type: 'integer'),
            new OA\Property(property: 'name', type: 'string', example: 'Стрижка'),
            new OA\Property(property: 'duration', type: 'integer', example: 60),
            new OA\Property(property: 'color', type: 'string', example: '#6366f1'),
        ]),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time', example: '2026-02-20T08:30:00Z'),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time', example: '2026-02-18T12:00:00Z'),
    ]
)]
#[OA\Schema(
    schema: 'PaginationMeta',
    properties: [
        new OA\Property(property: 'current_page', type: 'integer', example: 1),
        new OA\Property(property: 'last_page', type: 'integer', example: 5),
        new OA\Property(property: 'per_page', type: 'integer', example: 50),
        new OA\Property(property: 'total', type: 'integer', example: 230),
    ]
)]
class AppointmentController extends Controller
{
    #[OA\Get(
        path: '/mobile/appointments',
        summary: 'Список записей',
        description: 'Возвращает записи с пагинацией. Поддерживает фильтрацию и дельта-синхронизацию через updated_after.',
        security: [['BearerAuth' => []]],
        tags: ['Appointments'],
        parameters: [
            new OA\Parameter(name: 'date_from', in: 'query', required: false, schema: new OA\Schema(type: 'string', format: 'date', example: '2026-02-01')),
            new OA\Parameter(name: 'date_to', in: 'query', required: false, schema: new OA\Schema(type: 'string', format: 'date', example: '2026-02-28')),
            new OA\Parameter(name: 'status', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'])),
            new OA\Parameter(name: 'updated_after', in: 'query', required: false, description: 'Дельта-синхронизация: вернуть записи изменённые после этой даты', schema: new OA\Schema(type: 'string', format: 'date-time', example: '2026-02-20T00:00:00Z')),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 50, minimum: 1, maximum: 100)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Список записей',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'success', type: 'boolean', example: true),
                    new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Appointment')),
                    new OA\Property(property: 'meta', ref: '#/components/schemas/PaginationMeta'),
                    new OA\Property(property: 'sync_timestamp', type: 'string', format: 'date-time', example: '2026-02-22T10:00:00Z', description: 'Сохрани для следующего updated_after'),
                ]),
            ),
            new OA\Response(response: 401, description: 'Не авторизован'),
        ],
    )]
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'date_from'     => ['nullable', 'date'],
            'date_to'       => ['nullable', 'date', 'after_or_equal:date_from'],
            'status'        => ['nullable', 'in:scheduled,confirmed,completed,cancelled,no_show'],
            'updated_after' => ['nullable', 'date'],
            'per_page'      => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $user = $request->user();
        $query = $user->appointments()
            ->with(['client', 'service'])
            ->orderBy('start_time', 'desc');

        if ($request->filled('date_from')) {
            $query->where('start_time', '>=', Carbon::parse($request->date_from)->startOfDay()->utc());
        }
        if ($request->filled('date_to')) {
            $query->where('start_time', '<=', Carbon::parse($request->date_to)->endOfDay()->utc());
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('updated_after')) {
            $query->where('updated_at', '>', Carbon::parse($request->updated_after)->utc());
        }

        $appointments = $query->paginate($request->integer('per_page', 50));

        return response()->json([
            'success'        => true,
            'data'           => AppointmentResource::collection($appointments),
            'meta'           => [
                'current_page' => $appointments->currentPage(),
                'last_page'    => $appointments->lastPage(),
                'per_page'     => $appointments->perPage(),
                'total'        => $appointments->total(),
            ],
            'sync_timestamp' => now()->toIso8601ZuluString(),
        ]);
    }

    #[OA\Post(
        path: '/mobile/appointments',
        summary: 'Создать запись',
        description: 'Время start_time передаётся в UTC ISO 8601. end_time вычисляется автоматически из длительности услуги.',
        security: [['BearerAuth' => []]],
        tags: ['Appointments'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['client_id', 'service_id', 'start_time'],
                properties: [
                    new OA\Property(property: 'client_id', type: 'integer', example: 7),
                    new OA\Property(property: 'service_id', type: 'integer', example: 3),
                    new OA\Property(property: 'start_time', type: 'string', format: 'date-time', example: '2026-02-22T09:00:00Z', description: 'UTC ISO 8601'),
                    new OA\Property(property: 'notes', type: 'string', nullable: true, example: 'Клиент предпочитает без звонков'),
                    new OA\Property(property: 'price', type: 'number', nullable: true, example: 2500, description: 'Если не указана — берётся из услуги'),
                    new OA\Property(property: 'option_ids', type: 'array', nullable: true, items: new OA\Items(type: 'integer'), example: [1, 2]),
                ],
            ),
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Запись создана',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'success', type: 'boolean', example: true),
                    new OA\Property(property: 'data', ref: '#/components/schemas/Appointment'),
                ]),
            ),
            new OA\Response(response: 401, description: 'Не авторизован'),
            new OA\Response(response: 403, description: 'Клиент или услуга не принадлежат мастеру'),
            new OA\Response(response: 422, description: 'Ошибка валидации или лимит записей достигнут'),
        ],
    )]
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'client_id'    => ['required', 'integer', 'exists:clients,id'],
            'service_id'   => ['required', 'integer', 'exists:services,id'],
            'start_time'   => ['required', 'date'],
            'notes'        => ['nullable', 'string', 'max:2000'],
            'price'        => ['nullable', 'numeric', 'min:0'],
            'option_ids'   => ['nullable', 'array'],
            'option_ids.*' => ['integer', 'exists:service_options,id'],
        ]);

        $user = $request->user();

        if (
            $user->clients()->where('id', $validated['client_id'])->doesntExist() ||
            $user->services()->where('id', $validated['service_id'])->doesntExist()
        ) {
            abort(403, 'Доступ запрещён');
        }

        /** @var \App\Services\Subscription\UsageLimitService $usageService */
        $usageService = app(UsageLimitService::class);
        if ($user->hasReachedLimit('appointments')) {
            return response()->json([
                'success' => false,
                'message' => 'Лимит записей достигнут. Обновите тариф.',
            ], 422);
        }

        $service = $user->services()->find($validated['service_id']);
        $startTime = Carbon::parse($validated['start_time'])->utc();

        $totalDuration = $service->duration;
        $options = collect();
        if (!empty($validated['option_ids'])) {
            $options = ServiceOption::whereIn('id', $validated['option_ids'])
                ->where('service_id', $service->id)
                ->get();
            foreach ($options as $option) {
                $totalDuration += $option->duration_change;
            }
        }

        $endTime = $startTime->copy()->addMinutes($totalDuration);

        $totalPrice = $validated['price'] ?? $service->price;
        if ($options->isNotEmpty() && !isset($validated['price'])) {
            foreach ($options as $option) {
                $totalPrice += $option->price_change;
            }
        }

        $appointment = $user->appointments()->create([
            'client_id'  => $validated['client_id'],
            'service_id' => $validated['service_id'],
            'start_time' => $startTime,
            'end_time'   => $endTime,
            'price'      => $totalPrice,
            'status'     => 'scheduled',
            'notes'      => $validated['notes'] ?? null,
        ]);

        if ($options->isNotEmpty()) {
            $optionsData = [];
            foreach ($options as $option) {
                $optionsData[$option->id] = [
                    'price_change'    => $option->price_change,
                    'duration_change' => $option->duration_change,
                ];
            }
            $appointment->options()->attach($optionsData);
        }

        $usageService->trackUsage($user, 'appointments');

        return response()->json([
            'success' => true,
            'data'    => new AppointmentResource($appointment->load('client', 'service')),
        ], 201);
    }

    #[OA\Put(
        path: '/mobile/appointments/{id}',
        summary: 'Обновить запись',
        security: [['BearerAuth' => []]],
        tags: ['Appointments'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer', example: 42)),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['client_id', 'service_id', 'start_time', 'status', 'price'],
                properties: [
                    new OA\Property(property: 'client_id', type: 'integer', example: 7),
                    new OA\Property(property: 'service_id', type: 'integer', example: 3),
                    new OA\Property(property: 'start_time', type: 'string', format: 'date-time', example: '2026-02-22T09:00:00Z'),
                    new OA\Property(property: 'status', type: 'string', enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']),
                    new OA\Property(property: 'price', type: 'number', example: 2500),
                    new OA\Property(property: 'notes', type: 'string', nullable: true),
                    new OA\Property(property: 'payment_method', type: 'string', nullable: true, enum: ['cash', 'card']),
                    new OA\Property(property: 'option_ids', type: 'array', nullable: true, items: new OA\Items(type: 'integer')),
                ],
            ),
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Запись обновлена',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'success', type: 'boolean', example: true),
                    new OA\Property(property: 'data', ref: '#/components/schemas/Appointment'),
                ]),
            ),
            new OA\Response(response: 401, description: 'Не авторизован'),
            new OA\Response(response: 403, description: 'Нет доступа к записи'),
            new OA\Response(response: 404, description: 'Запись не найдена'),
        ],
    )]
    public function update(Request $request, Appointment $appointment): JsonResponse
    {
        $this->authorize('update', $appointment);

        $validated = $request->validate([
            'client_id'      => ['required', 'integer', 'exists:clients,id'],
            'service_id'     => ['required', 'integer', 'exists:services,id'],
            'start_time'     => ['required', 'date'],
            'status'         => ['required', 'in:scheduled,confirmed,completed,cancelled,no_show'],
            'notes'          => ['nullable', 'string', 'max:2000'],
            'price'          => ['required', 'numeric', 'min:0'],
            'payment_method' => ['nullable', 'in:cash,card'],
            'option_ids'     => ['nullable', 'array'],
            'option_ids.*'   => ['integer', 'exists:service_options,id'],
        ]);

        $user = $request->user();
        $service = $user->services()->find($validated['service_id']);
        if (!$service) {
            abort(403, 'Доступ запрещён');
        }

        $startTime = Carbon::parse($validated['start_time'])->utc();

        $totalDuration = $service->duration;
        $options = collect();
        if (!empty($validated['option_ids'])) {
            $options = ServiceOption::whereIn('id', $validated['option_ids'])
                ->where('service_id', $service->id)
                ->get();
            foreach ($options as $option) {
                $totalDuration += $option->duration_change;
            }
        }

        $updateData = [
            'client_id'  => $validated['client_id'],
            'service_id' => $validated['service_id'],
            'start_time' => $startTime,
            'end_time'   => $startTime->copy()->addMinutes($totalDuration),
            'price'      => $validated['price'],
            'status'     => $validated['status'],
            'notes'      => $validated['notes'] ?? null,
        ];

        if ($validated['status'] === 'completed' && isset($validated['payment_method'])) {
            $updateData['payment_method'] = $validated['payment_method'];
        }

        $appointment->update($updateData);

        if (isset($validated['option_ids'])) {
            if ($options->isNotEmpty()) {
                $optionsData = [];
                foreach ($options as $option) {
                    $optionsData[$option->id] = [
                        'price_change'    => $option->price_change,
                        'duration_change' => $option->duration_change,
                    ];
                }
                $appointment->options()->sync($optionsData);
            } else {
                $appointment->options()->detach();
            }
        }

        return response()->json([
            'success' => true,
            'data'    => new AppointmentResource($appointment->fresh(['client', 'service'])),
        ]);
    }

    #[OA\Delete(
        path: '/mobile/appointments/{id}',
        summary: 'Удалить запись',
        security: [['BearerAuth' => []]],
        tags: ['Appointments'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer', example: 42)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Запись удалена',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'success', type: 'boolean', example: true),
                    new OA\Property(property: 'message', type: 'string', example: 'Запись удалена'),
                ]),
            ),
            new OA\Response(response: 403, description: 'Нет доступа'),
            new OA\Response(response: 404, description: 'Запись не найдена'),
        ],
    )]
    public function destroy(Request $request, Appointment $appointment): JsonResponse
    {
        $this->authorize('delete', $appointment);

        $appointment->delete();
        app(UsageLimitService::class)->decreaseUsage($request->user(), 'appointments');

        return response()->json([
            'success' => true,
            'message' => 'Запись удалена',
        ]);
    }

    #[OA\Patch(
        path: '/mobile/appointments/{id}/status',
        summary: 'Сменить статус записи',
        description: 'При статусе completed можно указать payment_method.',
        security: [['BearerAuth' => []]],
        tags: ['Appointments'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer', example: 42)),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['status'],
                properties: [
                    new OA\Property(property: 'status', type: 'string', enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'], example: 'completed'),
                    new OA\Property(property: 'payment_method', type: 'string', nullable: true, enum: ['cash', 'card'], example: 'cash'),
                ],
            ),
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Статус обновлён',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'success', type: 'boolean', example: true),
                    new OA\Property(property: 'message', type: 'string', example: 'Статус обновлён'),
                    new OA\Property(property: 'data', ref: '#/components/schemas/Appointment'),
                ]),
            ),
            new OA\Response(response: 403, description: 'Нет доступа'),
            new OA\Response(response: 404, description: 'Запись не найдена'),
        ],
    )]
    public function updateStatus(Request $request, Appointment $appointment): JsonResponse
    {
        $this->authorize('update', $appointment);

        $validated = $request->validate([
            'status'         => ['required', 'in:scheduled,confirmed,completed,cancelled,no_show'],
            'payment_method' => ['nullable', 'in:cash,card'],
        ]);

        $updateData = ['status' => $validated['status']];
        if ($validated['status'] === 'completed' && isset($validated['payment_method'])) {
            $updateData['payment_method'] = $validated['payment_method'];
        }

        $appointment->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Статус обновлён',
            'data'    => new AppointmentResource($appointment->fresh(['client', 'service'])),
        ]);
    }
}
