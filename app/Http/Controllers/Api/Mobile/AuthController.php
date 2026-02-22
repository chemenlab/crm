<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Http\Resources\Mobile\UserResource;
use App\Models\User;
use App\Services\EmailVerificationService;
use App\Services\Subscription\SubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'User',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'name', type: 'string', example: 'Иван Мастер'),
        new OA\Property(property: 'email', type: 'string', format: 'email', example: 'master@example.com'),
        new OA\Property(property: 'phone', type: 'string', example: '+79991234567'),
        new OA\Property(property: 'timezone', type: 'string', example: 'Europe/Moscow', description: 'Используется клиентом для конвертации UTC дат'),
        new OA\Property(property: 'slot_step', type: 'integer', example: 30),
        new OA\Property(property: 'buffer_time', type: 'integer', example: 0),
        new OA\Property(property: 'avatar_url', type: 'string', nullable: true, example: 'https://example.com/storage/avatars/1.jpg'),
        new OA\Property(property: 'slug', type: 'string', example: 'ivan-master'),
        new OA\Property(property: 'currency', type: 'string', example: 'RUB'),
    ]
)]
class AuthController extends Controller
{
    #[OA\Post(
        path: '/mobile/register',
        summary: 'Регистрация нового мастера',
        description: 'Создаёт аккаунт, активирует 14-дневный пробный период плана Maximum и отправляет 6-значный код верификации на email. **Токен не выдаётся** — используйте /verify-email после подтверждения почты. Лимит: 5 попыток в минуту с одного IP.',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name', 'email', 'phone', 'password', 'password_confirmation'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'Иван Мастер'),
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'master@example.com'),
                    new OA\Property(property: 'phone', type: 'string', example: '+79991234567'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', example: 'secret123', minLength: 8),
                    new OA\Property(property: 'password_confirmation', type: 'string', format: 'password', example: 'secret123'),
                    new OA\Property(property: 'device_name', type: 'string', example: 'iPhone 15 Pro', description: 'Имя устройства для токена (опционально)'),
                ],
            ),
        ),
        tags: ['Auth'],
        responses: [
            new OA\Response(
                response: 201,
                description: 'Аккаунт создан, код отправлен на email',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'success', type: 'boolean', example: true),
                    new OA\Property(property: 'message', type: 'string', example: 'Регистрация выполнена. Код подтверждения отправлен на master@example.com.'),
                ]),
            ),
            new OA\Response(response: 422, description: 'Ошибки валидации (email/phone не уникальны, пароль слабый и т.д.)'),
            new OA\Response(response: 429, description: 'Слишком много попыток'),
        ],
    )]
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone'    => ['required', 'string', 'max:20', 'unique:users,phone'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'device_name' => ['nullable', 'string', 'max:255'],
        ], [
            'name.required'     => 'Имя обязательно.',
            'email.required'    => 'Email обязателен.',
            'email.email'       => 'Некорректный формат email.',
            'email.unique'      => 'Пользователь с таким email уже зарегистрирован.',
            'phone.required'    => 'Телефон обязателен.',
            'phone.unique'      => 'Пользователь с таким телефоном уже зарегистрирован.',
            'password.required' => 'Пароль обязателен.',
            'password.min'      => 'Пароль должен содержать минимум 8 символов.',
            'password.confirmed' => 'Пароли не совпадают.',
        ]);

        $user = User::create([
            'name'                 => $request->name,
            'email'                => $request->email,
            'phone'                => $request->phone,
            'password'             => Hash::make($request->password),
            'onboarding_completed' => false,
        ]);

        // Activate 14-day trial on the "maximum" plan + init UsageTracking
        app(SubscriptionService::class)->activateTrial($user);

        // Send 6-digit email verification code (expires in 15 min)
        app(EmailVerificationService::class)->generateCode($user, $user->email);

        return response()->json([
            'success' => true,
            'message' => "Регистрация выполнена. Код подтверждения отправлен на {$user->email}.",
        ], 201);
    }

    #[OA\Post(
        path: '/mobile/verify-email',
        summary: 'Подтверждение email и получение токена',
        description: 'Принимает 6-значный код из письма. При успехе выдаёт Bearer-токен — после этого можно работать с API. Код действует 15 минут. Лимит: 5 попыток в минуту с одного IP.',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['email', 'code'],
                properties: [
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'master@example.com'),
                    new OA\Property(property: 'code', type: 'string', example: '048271', description: '6-значный код из письма'),
                    new OA\Property(property: 'device_name', type: 'string', example: 'iPhone 15 Pro', description: 'Имя устройства для токена (опционально)'),
                ],
            ),
        ),
        tags: ['Auth'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Email подтверждён, токен выдан',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'success', type: 'boolean', example: true),
                    new OA\Property(property: 'token', type: 'string', example: '1|abc123xyz...'),
                    new OA\Property(property: 'token_type', type: 'string', example: 'Bearer'),
                    new OA\Property(property: 'user', ref: '#/components/schemas/User'),
                ]),
            ),
            new OA\Response(response: 422, description: 'Неверный или истёкший код'),
            new OA\Response(response: 429, description: 'Слишком много попыток'),
        ],
    )]
    public function verifyEmail(Request $request): JsonResponse
    {
        $request->validate([
            'email'       => ['required', 'email'],
            'code'        => ['required', 'string', 'size:6'],
            'device_name' => ['nullable', 'string', 'max:255'],
        ]);

        $verified = app(EmailVerificationService::class)
            ->verifyCode($request->email, $request->code);

        if (!$verified) {
            return response()->json([
                'success' => false,
                'message' => 'Неверный или истёкший код подтверждения.',
            ], 422);
        }

        $user = User::where('email', $request->email)->firstOrFail();

        $deviceName = $request->input('device_name', 'mobile-app');
        $token = $user->createToken($deviceName, ['mobile']);

        return response()->json([
            'success'    => true,
            'token'      => $token->plainTextToken,
            'token_type' => 'Bearer',
            'user'       => new UserResource($user),
        ]);
    }

    #[OA\Post(
        path: '/mobile/login',
        summary: 'Авторизация мастера',
        description: 'Возвращает Bearer-токен. Лимит: 5 попыток в минуту с одного IP.',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['email', 'password'],
                properties: [
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'master@example.com'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', example: 'secret123'),
                    new OA\Property(property: 'device_name', type: 'string', example: 'iPhone 15 Pro'),
                ],
            ),
        ),
        tags: ['Auth'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Успешный вход',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'success', type: 'boolean', example: true),
                    new OA\Property(property: 'token', type: 'string', example: '1|abc123xyz...'),
                    new OA\Property(property: 'token_type', type: 'string', example: 'Bearer'),
                    new OA\Property(property: 'user', ref: '#/components/schemas/User'),
                ]),
            ),
            new OA\Response(response: 401, description: 'Неверный email или пароль'),
            new OA\Response(response: 422, description: 'Ошибка валидации'),
            new OA\Response(response: 429, description: 'Слишком много попыток'),
        ],
    )]
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'       => ['required', 'email'],
            'password'    => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:255'],
        ]);

        if (!Auth::attempt(['email' => $request->email, 'password' => $request->password])) {
            return response()->json([
                'success' => false,
                'message' => 'Неверный email или пароль',
            ], 401);
        }

        $user = Auth::user();
        $token = $user->createToken(
            $request->input('device_name', 'mobile-app'),
            ['mobile'],
        );

        return response()->json([
            'success'    => true,
            'token'      => $token->plainTextToken,
            'token_type' => 'Bearer',
            'user'       => new UserResource($user),
        ]);
    }

    #[OA\Post(
        path: '/mobile/logout',
        summary: 'Выход из системы',
        description: 'Отзывает текущий токен. Токены других устройств остаются активными.',
        security: [['BearerAuth' => []]],
        tags: ['Auth'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Выход выполнен',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'success', type: 'boolean', example: true),
                    new OA\Property(property: 'message', type: 'string', example: 'Выход выполнен'),
                ]),
            ),
            new OA\Response(response: 401, description: 'Не авторизован'),
        ],
    )]
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Выход выполнен',
        ]);
    }

    #[OA\Get(
        path: '/mobile/me',
        summary: 'Данные текущего пользователя',
        description: 'Профиль мастера. Timezone используется клиентом для конвертации UTC→локальное время.',
        security: [['BearerAuth' => []]],
        tags: ['Auth'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Данные пользователя',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'success', type: 'boolean', example: true),
                    new OA\Property(property: 'data', ref: '#/components/schemas/User'),
                ]),
            ),
            new OA\Response(response: 401, description: 'Не авторизован'),
        ],
    )]
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => new UserResource($request->user()),
        ]);
    }
}
