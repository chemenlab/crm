<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Http\Resources\Mobile\ServiceResource;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Service',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 3),
        new OA\Property(property: 'name', type: 'string', example: 'Стрижка мужская'),
        new OA\Property(property: 'description', type: 'string', nullable: true, example: 'Классическая мужская стрижка'),
        new OA\Property(property: 'price', type: 'number', format: 'float', example: 1500.00),
        new OA\Property(property: 'duration', type: 'integer', example: 60, description: 'Длительность в минутах'),
        new OA\Property(property: 'color', type: 'string', example: '#6366f1', description: 'Цвет для отображения в календаре'),
        new OA\Property(property: 'is_active', type: 'boolean', example: true),
        new OA\Property(property: 'custom_slot_step', type: 'integer', nullable: true, example: 30, description: 'Шаг слота для этой услуги'),
        new OA\Property(property: 'custom_buffer_time', type: 'integer', nullable: true, example: 15, description: 'Буферное время после записи'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time', example: '2026-01-15T10:00:00Z'),
    ]
)]
class ServiceController extends Controller
{
    #[OA\Get(
        path: '/mobile/services',
        summary: 'Список услуг',
        description: 'Только чтение. Редактирование услуг доступно только через веб-интерфейс.',
        security: [['BearerAuth' => []]],
        tags: ['Services'],
        parameters: [
            new OA\Parameter(name: 'updated_after', in: 'query', required: false, schema: new OA\Schema(type: 'string', format: 'date-time', example: '2026-02-20T00:00:00Z')),
            new OA\Parameter(name: 'active_only', in: 'query', required: false, schema: new OA\Schema(type: 'boolean', example: true)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Список услуг',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'success', type: 'boolean', example: true),
                    new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Service')),
                    new OA\Property(property: 'sync_timestamp', type: 'string', format: 'date-time', example: '2026-02-22T10:00:00Z'),
                ]),
            ),
            new OA\Response(response: 401, description: 'Не авторизован'),
        ],
    )]
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'updated_after' => ['nullable', 'date'],
            'active_only'   => ['nullable', 'boolean'],
        ]);

        $query = $request->user()->services()->orderBy('name');

        if ($request->boolean('active_only', false)) {
            $query->where('is_active', true);
        }

        if ($request->filled('updated_after')) {
            $query->where('updated_at', '>', Carbon::parse($request->updated_after)->utc());
        }

        $services = $query->get();

        return response()->json([
            'success'        => true,
            'data'           => ServiceResource::collection($services),
            'sync_timestamp' => now()->toIso8601ZuluString(),
        ]);
    }
}
