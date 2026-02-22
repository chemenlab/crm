<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
        ]);

        // Register middleware aliases
        $middleware->alias([
            'verified' => \App\Http\Middleware\EnsureEmailIsVerified::class,
            'subscription' => \App\Http\Middleware\CheckSubscription::class,
            'usage.limit' => \App\Http\Middleware\CheckUsageLimit::class,
            'admin.auth' => \App\Http\Middleware\AdminAuthenticate::class,
            'admin.permission' => \App\Http\Middleware\AdminCheckPermission::class,
        ]);

        // Exclude check-slug from CSRF (already protected by auth middleware)
        // Exclude webhooks from CSRF (external services)
        $middleware->validateCsrfTokens(except: [
            'app/onboarding/check-slug',
            'webhooks/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Use custom exception handler for consistent error responses
        $exceptions->render(function (\Illuminate\Validation\ValidationException $e, $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ошибка валидации',
                    'errors' => $e->errors(),
                ], 422);
            }
        });

        $exceptions->render(function (\Illuminate\Database\Eloquent\ModelNotFoundException $e, $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                $model = class_basename($e->getModel());
                $modelNames = [
                    'User' => 'Пользователь',
                    'Client' => 'Клиент',
                    'Service' => 'Услуга',
                    'Appointment' => 'Запись',
                    'Transaction' => 'Транзакция',
                    'Subscription' => 'Подписка',
                    'SubscriptionPlan' => 'Тарифный план',
                ];
                $name = $modelNames[$model] ?? 'Запись';

                return response()->json([
                    'success' => false,
                    'message' => "{$name} не найден(а)",
                ], 404);
            }
        });

        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e, $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Страница не найдена',
                ], 404);
            }
        });

        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Необходима авторизация',
                ], 401);
            }
        });

        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\HttpException $e, $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                $messages = [
                    400 => 'Неверный запрос',
                    401 => 'Необходима авторизация',
                    403 => 'Доступ запрещён',
                    404 => 'Не найдено',
                    405 => 'Метод не разрешён',
                    419 => 'Сессия истекла. Обновите страницу',
                    422 => 'Ошибка валидации',
                    429 => 'Слишком много запросов. Подождите немного',
                    500 => 'Внутренняя ошибка сервера',
                    503 => 'Сервис временно недоступен',
                ];

                $statusCode = $e->getStatusCode();
                $message = $messages[$statusCode] ?? $e->getMessage() ?: 'Произошла ошибка';

                return response()->json([
                    'success' => false,
                    'message' => $message,
                ], $statusCode);
            }
        });

        // Log all exceptions with context
        // IMPORTANT: The entire body is wrapped in try-catch because during early boot
        // or CLI context, facades (Log::), auth(), request() may not be available.
        // A failure here would mask the original exception with exit 255.
        $exceptions->report(function (\Throwable $e) {
            try {
                $userId = null;
                try {
                    $userId = auth()->id();
                } catch (\Throwable) {
                }

                $url = php_sapi_name() === 'cli' ? 'CLI' : 'unknown';
                $method = php_sapi_name() === 'cli' ? 'CLI' : 'unknown';
                try {
                    $url = request()->fullUrl();
                    $method = request()->method();
                } catch (\Throwable) {
                }

                \Illuminate\Support\Facades\Log::error('Exception occurred', [
                    'exception' => get_class($e),
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'user_id' => $userId,
                    'url' => $url,
                    'method' => $method,
                ]);
            } catch (\Throwable) {
                // Facades not available (early boot) — use PHP built-in logging
                error_log(sprintf(
                    "[Laravel] %s: %s in %s:%d",
                    get_class($e),
                    $e->getMessage(),
                    $e->getFile(),
                    $e->getLine()
                ));
            }
        });
    })->create();
