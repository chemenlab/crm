<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * A list of exception types with their corresponding custom log levels.
     */
    protected $levels = [
        //
    ];

    /**
     * A list of the exception types that are not reported.
     */
    protected $dontReport = [
        //
    ];

    /**
     * A list of the inputs that are never flashed to the session on validation exceptions.
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            // Log all exceptions with context
            if (!$this->shouldntReport($e)) {
                Log::error('Exception occurred', [
                    'exception' => get_class($e),
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'user_id' => auth()->id(),
                    'url' => request()->fullUrl(),
                    'method' => request()->method(),
                ]);
            }
        });
    }

    /**
     * Render an exception into an HTTP response.
     */
    public function render($request, Throwable $e)
    {
        // Handle API/AJAX requests
        if ($request->expectsJson() || $request->is('api/*')) {
            return $this->handleApiException($request, $e);
        }

        return parent::render($request, $e);
    }

    /**
     * Handle API exceptions with consistent JSON responses.
     */
    protected function handleApiException(Request $request, Throwable $e): JsonResponse
    {
        // Validation errors
        if ($e instanceof ValidationException) {
            return response()->json([
                'success' => false,
                'message' => 'Ошибка валидации',
                'errors' => $e->errors(),
            ], 422);
        }

        // Model not found
        if ($e instanceof ModelNotFoundException) {
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

        // Route not found
        if ($e instanceof NotFoundHttpException) {
            return response()->json([
                'success' => false,
                'message' => 'Страница не найдена',
            ], 404);
        }

        // Authentication error
        if ($e instanceof AuthenticationException) {
            return response()->json([
                'success' => false,
                'message' => 'Необходима авторизация',
            ], 401);
        }

        // HTTP exceptions (403, 404, 500, etc.)
        if ($e instanceof HttpException) {
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

        // Generic server error (don't expose details in production)
        $message = config('app.debug') 
            ? $e->getMessage() 
            : 'Произошла ошибка. Попробуйте позже';

        return response()->json([
            'success' => false,
            'message' => $message,
        ], 500);
    }
}
