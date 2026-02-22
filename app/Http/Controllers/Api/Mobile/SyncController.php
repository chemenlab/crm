<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Http\Resources\Mobile\AppointmentResource;
use App\Http\Resources\Mobile\ClientResource;
use App\Http\Resources\Mobile\ServiceResource;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class SyncController extends Controller
{
    #[OA\Get(
        path: '/mobile/sync',
        summary: 'Дельта-синхронизация',
        description: 'Возвращает все записи, клиентов и услуги, изменённые после указанной даты. Используйте sync_timestamp из предыдущего ответа как updated_after для следующего запроса. Timestamp фиксируется ДО выполнения запросов, чтобы не пропустить записи.',
        security: [['BearerAuth' => []]],
        tags: ['Sync'],
        parameters: [
            new OA\Parameter(
                name: 'updated_after',
                in: 'query',
                required: true,
                description: 'ISO 8601 дата-время в UTC. Возвращает только записи с updated_at > этого значения.',
                schema: new OA\Schema(type: 'string', format: 'date-time', example: '2026-02-22T10:00:00Z')
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Изменённые данные с момента updated_after',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'success', type: 'boolean', example: true),
                    new OA\Property(
                        property: 'data',
                        type: 'object',
                        properties: [
                            new OA\Property(property: 'appointments', type: 'array', items: new OA\Items(ref: '#/components/schemas/Appointment')),
                            new OA\Property(property: 'clients', type: 'array', items: new OA\Items(ref: '#/components/schemas/Client')),
                            new OA\Property(property: 'services', type: 'array', items: new OA\Items(ref: '#/components/schemas/Service')),
                        ]
                    ),
                    new OA\Property(
                        property: 'counts',
                        type: 'object',
                        properties: [
                            new OA\Property(property: 'appointments', type: 'integer', example: 3),
                            new OA\Property(property: 'clients', type: 'integer', example: 1),
                            new OA\Property(property: 'services', type: 'integer', example: 0),
                        ]
                    ),
                    new OA\Property(property: 'sync_timestamp', type: 'string', format: 'date-time', example: '2026-02-22T10:05:00Z', description: 'Используйте это значение как updated_after в следующем запросе'),
                ]),
            ),
            new OA\Response(response: 401, description: 'Не авторизован'),
            new OA\Response(response: 422, description: 'updated_after обязателен'),
        ],
    )]
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'updated_after' => ['required', 'date'],
        ]);

        // Capture timestamp BEFORE queries to avoid missing records written during query execution
        $syncTimestamp = now()->toIso8601ZuluString();

        $user  = $request->user();
        $since = Carbon::parse($request->updated_after)->utc();

        $appointments = $user->appointments()
            ->with(['client', 'service'])
            ->where('updated_at', '>', $since)
            ->orderBy('updated_at')
            ->get();

        $clients = $user->clients()
            ->where('updated_at', '>', $since)
            ->orderBy('updated_at')
            ->get();

        $services = $user->services()
            ->where('updated_at', '>', $since)
            ->orderBy('updated_at')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'appointments' => AppointmentResource::collection($appointments),
                'clients'      => ClientResource::collection($clients),
                'services'     => ServiceResource::collection($services),
            ],
            'counts' => [
                'appointments' => $appointments->count(),
                'clients'      => $clients->count(),
                'services'     => $services->count(),
            ],
            'sync_timestamp' => $syncTimestamp,
        ]);
    }
}
