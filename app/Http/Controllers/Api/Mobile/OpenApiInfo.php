<?php

namespace App\Http\Controllers\Api\Mobile;

use OpenApi\Attributes as OA;

#[OA\Info(
    version: '1.0.0',
    title: 'Booking CRM — Mobile API',
    description: 'REST API для мобильного приложения мастера/сотрудника. Поддерживает офлайн-режим с дельта-синхронизацией. Авторизация через Bearer-токен (Sanctum).',
    contact: new OA\Contact(name: 'Booking CRM Support'),
)]
#[OA\Server(
    url: '/api',
    description: 'Production / Dev сервер',
)]
#[OA\SecurityScheme(
    securityScheme: 'BearerAuth',
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'Sanctum',
    description: 'Токен из POST /api/mobile/login. Пример: Bearer 1|abc123...',
)]
#[OA\Tag(name: 'Auth', description: 'Авторизация')]
#[OA\Tag(name: 'Appointments', description: 'Записи клиентов')]
#[OA\Tag(name: 'Clients', description: 'База клиентов')]
#[OA\Tag(name: 'Services', description: 'Услуги (только чтение)')]
#[OA\Tag(name: 'Slots', description: 'Доступные временные слоты')]
#[OA\Tag(name: 'Dashboard', description: 'Сводная информация')]
#[OA\Tag(name: 'Schedule', description: 'Расписание мастера')]
#[OA\Tag(name: 'Sync', description: 'Дельта-синхронизация для офлайн-режима')]
class OpenApiInfo
{
    // Этот класс содержит только глобальные OpenAPI-аннотации.
    // Логики нет.
}
