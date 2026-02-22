<?php

namespace App\Services\Telegram;

use App\Models\TelegramIntegration;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Telegram\Bot\Api;
use Telegram\Bot\Exceptions\TelegramSDKException;

class TelegramBotService
{
    protected ?Api $telegram = null;

    /**
     * Get Telegram API instance (lazy initialization)
     */
    protected function getTelegram(): Api
    {
        if ($this->telegram === null) {
            $token = config('services.telegram.bot_token');
            
            if (empty($token)) {
                throw new \Exception('Telegram bot token is not configured');
            }
            
            $this->telegram = new Api($token);
        }
        
        return $this->telegram;
    }

    /**
     * Generate linking code for account
     */
    public function generateLinkingCode(User $master): string
    {
        $code = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
        
        // Store code in cache for 10 minutes
        Cache::put("telegram_link_code:{$code}", $master->id, now()->addMinutes(10));
        
        return $code;
    }

    /**
     * Link Telegram account to MasterPlan account
     */
    public function linkAccount(string $code, int $telegramId, string $chatId, array $userData = []): bool
    {
        $userId = Cache::get("telegram_link_code:{$code}");
        
        if (!$userId) {
            return false;
        }

        $user = User::find($userId);
        
        if (!$user) {
            return false;
        }

        // Create or update integration
        TelegramIntegration::updateOrCreate(
            ['user_id' => $user->id],
            [
                'telegram_id' => (string) $telegramId,
                'username' => $userData['username'] ?? null,
                'first_name' => $userData['first_name'] ?? null,
                'chat_id' => $chatId,
                'is_active' => true,
                'linked_at' => now(),
                'last_activity_at' => now(),
            ]
        );

        // Remove code from cache
        Cache::forget("telegram_link_code:{$code}");
        
        return true;
    }

    /**
     * Send message to master
     */
    public function sendMessage(User $master, string $message): void
    {
        $integration = TelegramIntegration::where('user_id', $master->id)
            ->where('is_active', true)
            ->first();

        if (!$integration) {
            throw new \Exception('Telegram integration not found for user');
        }

        try {
            $this->getTelegram()->sendMessage([
                'chat_id' => $integration->chat_id,
                'text' => $message,
                'parse_mode' => 'HTML',
            ]);

            $integration->updateActivity();
        } catch (TelegramSDKException $e) {
            Log::error('Telegram Send Message Error', [
                'error' => $e->getMessage(),
                'user_id' => $master->id,
            ]);

            throw $e;
        }
    }

    /**
     * Handle bot command
     */
    public function handleCommand(string $command, int $telegramId, array $params = []): string
    {
        $integration = TelegramIntegration::where('telegram_id', (string) $telegramId)
            ->where('is_active', true)
            ->first();

        if (!$integration && $command !== '/start' && $command !== '/link') {
            return "Пожалуйста, сначала привяжите аккаунт командой /start";
        }

        return match ($command) {
            '/start' => $this->handleStart(),
            '/link' => $this->handleLink($telegramId, $params),
            '/today' => $this->getTodayAppointments($integration->user),
            '/tomorrow' => $this->getTomorrowAppointments($integration->user),
            '/stats' => $this->getStats($integration->user),
            '/help' => $this->handleHelp(),
            default => "Неизвестная команда. Используйте /help для списка команд.",
        };
    }

    /**
     * Get today's appointments formatted
     */
    public function getTodayAppointments(User $master): string
    {
        $timezone = $master->timezone ?? 'UTC';
        $todayStart = now($timezone)->startOfDay()->utc();
        $todayEnd = now($timezone)->endOfDay()->utc();
        
        $appointments = $master->appointments()
            ->whereBetween('start_time', [$todayStart, $todayEnd])
            ->orderBy('start_time')
            ->with('client', 'service')
            ->get();

        if ($appointments->isEmpty()) {
            return "📅 На сегодня записей нет";
        }

        $message = "📅 <b>Записи на сегодня:</b>\n\n";
        
        foreach ($appointments as $appointment) {
            // Use local_start_time to display in user's timezone
            $time = $appointment->local_start_time->format('H:i');
            $client = $appointment->client->name;
            $service = $appointment->service->name ?? 'Услуга';
            
            $message .= "⏰ {$time} - {$client}\n";
            $message .= "   {$service}\n\n";
        }

        return $message;
    }

    /**
     * Get tomorrow's appointments formatted
     */
    public function getTomorrowAppointments(User $master): string
    {
        $timezone = $master->timezone ?? 'UTC';
        $tomorrowStart = now($timezone)->addDay()->startOfDay()->utc();
        $tomorrowEnd = now($timezone)->addDay()->endOfDay()->utc();
        
        $appointments = $master->appointments()
            ->whereBetween('start_time', [$tomorrowStart, $tomorrowEnd])
            ->orderBy('start_time')
            ->with('client', 'service')
            ->get();

        if ($appointments->isEmpty()) {
            return "📅 На завтра записей нет";
        }

        $message = "📅 <b>Записи на завтра:</b>\n\n";
        
        foreach ($appointments as $appointment) {
            // Use local_start_time to display in user's timezone
            $time = $appointment->local_start_time->format('H:i');
            $client = $appointment->client->name;
            $service = $appointment->service->name ?? 'Услуга';
            
            $message .= "⏰ {$time} - {$client}\n";
            $message .= "   {$service}\n\n";
        }

        return $message;
    }

    /**
     * Get statistics formatted
     */
    public function getStats(User $master): string
    {
        $today = $master->appointments()->whereDate('start_time', today())->count();
        $week = $master->appointments()
            ->whereBetween('start_time', [now()->startOfWeek(), now()->endOfWeek()])
            ->count();
        $month = $master->appointments()
            ->whereMonth('start_time', now()->month)
            ->count();

        return "📊 <b>Статистика:</b>\n\n" .
               "Сегодня: {$today} записей\n" .
               "На этой неделе: {$week} записей\n" .
               "В этом месяце: {$month} записей";
    }

    /**
     * Send daily summary to master
     */
    public function sendDailySummary(User $master): void
    {
        $message = $this->getTodayAppointments($master);
        $this->sendMessage($master, $message);
    }

    /**
     * Handle /start command
     */
    protected function handleStart(): string
    {
        return "👋 Добро пожаловать в MasterPlan бот!\n\n" .
               "Для привязки аккаунта:\n" .
               "1. Зайдите в настройки на сайте\n" .
               "2. Сгенерируйте код привязки\n" .
               "3. Отправьте команду: /link КОД\n\n" .
               "Используйте /help для списка команд";
    }

    /**
     * Handle /link command
     */
    protected function handleLink(int $telegramId, array $params): string
    {
        if (empty($params[0])) {
            return "Использование: /link КОД\n\nПолучите код в настройках на сайте";
        }

        $code = $params[0];
        
        // This will be handled by webhook controller with full user data
        return "Проверяю код...";
    }

    /**
     * Handle /help command
     */
    protected function handleHelp(): string
    {
        return "📋 <b>Доступные команды:</b>\n\n" .
               "/start - Начало работы\n" .
               "/link КОД - Привязать аккаунт\n" .
               "/today - Записи на сегодня\n" .
               "/tomorrow - Записи на завтра\n" .
               "/stats - Статистика\n" .
               "/help - Эта справка";
    }
}
