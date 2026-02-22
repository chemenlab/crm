<?php

namespace App\Telegram\Commands;

use App\Models\User;
use App\Models\Administrator;
use Telegram\Bot\Commands\Command;

class StartCommand extends Command
{
    protected string $name = 'start';
    protected string $description = 'Начать работу с ботом и связать аккаунт';

    public function handle()
    {
        $chatId = $this->getUpdate()->getMessage()->getChat()->getId();
        $username = $this->getUpdate()->getMessage()->getFrom()->getUsername();
        $firstName = $this->getUpdate()->getMessage()->getFrom()->getFirstName();
        $text = $this->getUpdate()->getMessage()->getText();
        
        // Парсим код из текста команды: /start CODE
        $parts = explode(' ', $text, 2);
        $code = isset($parts[1]) ? trim($parts[1]) : null;
        
        \Illuminate\Support\Facades\Log::info('Telegram Start Command', [
            'text' => $text,
            'code' => $code,
            'chat_id' => $chatId,
            'username' => $username,
        ]);
        
        // Если передан код верификации
        if ($code) {
            // Ищем пользователя с таким кодом
            $user = User::where('telegram_verification_code', $code)->first();
            $admin = Administrator::where('telegram_verification_code', $code)->first();
            
            if ($user) {
                $user->update([
                    'telegram_id' => $chatId,
                    'telegram_username' => $username,
                    'telegram_verified_at' => now(),
                    'telegram_verification_code' => null,
                ]);
                
                $this->replyWithMessage([
                    'text' => "🎉 <b>Отлично, {$firstName}!</b>\n\n✅ Ваш аккаунт успешно подключен к Telegram.\n\n<b>Теперь вы будете получать уведомления о:</b>\n• 📅 Новых записях\n• ✏️ Изменениях в записях\n• 💬 Ответах на тикеты поддержки\n• ⏰ Напоминаниях о предстоящих записях\n\n<i>Вы можете настроить типы уведомлений в настройках вашего профиля.</i>",
                    'parse_mode' => 'HTML',
                ]);
                
                return;
            }
            
            if ($admin) {
                $admin->update([
                    'telegram_id' => $chatId,
                    'telegram_username' => $username,
                    'telegram_verified_at' => now(),
                    'telegram_verification_code' => null,
                ]);
                
                $this->replyWithMessage([
                    'text' => "🎉 <b>Отлично, {$firstName}!</b>\n\n✅ Ваш аккаунт администратора успешно подключен к Telegram.\n\n<b>Теперь вы будете получать уведомления о:</b>\n• 📅 Новых записях клиентов\n• 🎫 Новых тикетах поддержки\n• 💬 Новых сообщениях в тикетах\n\n<i>Вы можете настроить типы уведомлений в настройках вашего профиля.</i>",
                    'parse_mode' => 'HTML',
                ]);
                
                return;
            }
            
            $this->replyWithMessage([
                'text' => "❌ <b>Ошибка подключения</b>\n\nКод не найден или уже использован.\n\nПожалуйста, вернитесь в настройки профиля и нажмите кнопку \"Подключить Telegram\" еще раз.",
                'parse_mode' => 'HTML',
            ]);
            
            return;
        }
        
        // Приветственное сообщение без кода
        $this->replyWithMessage([
            'text' => "👋 <b>Добро пожаловать в бот CRM системы!</b>\n\n<b>Для подключения уведомлений:</b>\n1. Войдите в систему\n2. Перейдите в настройки профиля\n3. Нажмите кнопку \"Подключить Telegram\"\n4. Вы автоматически вернетесь сюда для подтверждения\n\n<b>Доступные команды:</b>\n/help - Помощь\n/settings - Настройки уведомлений",
            'parse_mode' => 'HTML',
        ]);
    }
}
