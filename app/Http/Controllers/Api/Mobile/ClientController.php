<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Http\Resources\Mobile\ClientResource;
use App\Models\Client;
use App\Services\Subscription\UsageLimitService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Client',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 7),
        new OA\Property(property: 'name', type: 'string', example: 'Анна Петрова'),
        new OA\Property(property: 'phone', type: 'string', nullable: true, example: '+79991234567'),
        new OA\Property(property: 'email', type: 'string', nullable: true, example: 'anna@example.com'),
        new OA\Property(property: 'notes', type: 'string', nullable: true, example: 'Предпочитает утренние записи'),
        new OA\Property(property: 'total_visits', type: 'integer', example: 12),
        new OA\Property(property: 'total_spent', type: 'number', format: 'float', example: 18500.00),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time', example: '2026-02-20T08:30:00Z'),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time', example: '2025-10-01T10:00:00Z'),
    ]
)]
class ClientController extends Controller
{
    #[OA\Get(
        path: '/mobile/clients',
        summary: 'Список клиентов',
        description: 'Поиск по имени, телефону, email. Поддерживает дельта-синхронизацию через updated_after.',
        security: [['BearerAuth' => []]],
        tags: ['Clients'],
        parameters: [
            new OA\Parameter(name: 'search', in: 'query', required: false, description: 'Поиск по имени, телефону или email', schema: new OA\Schema(type: 'string', example: 'Анна')),
            new OA\Parameter(name: 'updated_after', in: 'query', required: false, schema: new OA\Schema(type: 'string', format: 'date-time', example: '2026-02-20T00:00:00Z')),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 50, minimum: 1, maximum: 100)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Список клиентов',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'success', type: 'boolean', example: true),
                    new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Client')),
                    new OA\Property(property: 'meta', ref: '#/components/schemas/PaginationMeta'),
                    new OA\Property(property: 'sync_timestamp', type: 'string', format: 'date-time', example: '2026-02-22T10:00:00Z'),
                ]),
            ),
            new OA\Response(response: 401, description: 'Не авторизован'),
        ],
    )]
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'search'        => ['nullable', 'string', 'max:100'],
            'updated_after' => ['nullable', 'date'],
            'per_page'      => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = $request->user()->clients()->orderBy('name');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('updated_after')) {
            $query->where('updated_at', '>', Carbon::parse($request->updated_after)->utc());
        }

        $clients = $query->paginate($request->integer('per_page', 50));

        return response()->json([
            'success'        => true,
            'data'           => ClientResource::collection($clients),
            'meta'           => [
                'current_page' => $clients->currentPage(),
                'last_page'    => $clients->lastPage(),
                'per_page'     => $clients->perPage(),
                'total'        => $clients->total(),
            ],
            'sync_timestamp' => now()->toIso8601ZuluString(),
        ]);
    }

    #[OA\Post(
        path: '/mobile/clients',
        summary: 'Создать клиента',
        security: [['BearerAuth' => []]],
        tags: ['Clients'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'Анна Петрова'),
                    new OA\Property(property: 'phone', type: 'string', nullable: true, example: '+79991234567'),
                    new OA\Property(property: 'email', type: 'string', nullable: true, format: 'email', example: 'anna@example.com'),
                    new OA\Property(property: 'notes', type: 'string', nullable: true, example: 'Предпочитает утренние записи'),
                ],
            ),
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Клиент создан',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'success', type: 'boolean', example: true),
                    new OA\Property(property: 'data', ref: '#/components/schemas/Client'),
                ]),
            ),
            new OA\Response(response: 422, description: 'Ошибка валидации или лимит клиентов достигнут'),
        ],
    )]
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'  => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $user = $request->user();

        if ($user->hasReachedLimit('clients')) {
            return response()->json([
                'success' => false,
                'message' => 'Лимит клиентов достигнут. Обновите тариф.',
            ], 422);
        }

        $client = $user->clients()->create($validated);
        app(UsageLimitService::class)->trackUsage($user, 'clients');

        return response()->json([
            'success' => true,
            'data'    => new ClientResource($client),
        ], 201);
    }

    #[OA\Put(
        path: '/mobile/clients/{id}',
        summary: 'Обновить клиента',
        security: [['BearerAuth' => []]],
        tags: ['Clients'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer', example: 7)),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'Анна Петрова'),
                    new OA\Property(property: 'phone', type: 'string', nullable: true, example: '+79991234567'),
                    new OA\Property(property: 'email', type: 'string', nullable: true, format: 'email'),
                    new OA\Property(property: 'notes', type: 'string', nullable: true),
                ],
            ),
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Клиент обновлён',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'success', type: 'boolean', example: true),
                    new OA\Property(property: 'data', ref: '#/components/schemas/Client'),
                ]),
            ),
            new OA\Response(response: 403, description: 'Нет доступа'),
            new OA\Response(response: 404, description: 'Клиент не найден'),
        ],
    )]
    public function update(Request $request, Client $client): JsonResponse
    {
        $this->authorize('update', $client);

        $validated = $request->validate([
            'name'  => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $client->update($validated);

        return response()->json([
            'success' => true,
            'data'    => new ClientResource($client->fresh()),
        ]);
    }
}
