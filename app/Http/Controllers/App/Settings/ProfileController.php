<?php

namespace App\Http\Controllers\App\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdatePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Models\UserSchedule;
use App\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function update(UpdateProfileRequest $request)
    {
        $user = $request->user();
        
        // Only update fields that were actually sent in the request
        $validated = $request->validated();
        $fieldsToUpdate = array_filter($validated, function ($key) use ($request) {
            return $request->has($key);
        }, ARRAY_FILTER_USE_KEY);
        
        // Convert empty string to null for numeric fields
        if (array_key_exists('tax_rate', $fieldsToUpdate) && $fieldsToUpdate['tax_rate'] === '') {
            $fieldsToUpdate['tax_rate'] = null;
        }
        
        $user->update($fieldsToUpdate);

        return back()->with('success', 'Профиль успешно обновлен');
    }

    public function uploadAvatar(Request $request, ImageService $imageService)
    {
        $request->validate([
            'avatar' => 'required|image|max:20480', // 20MB max — compressed server-side
        ]);

        $user = $request->user();

        // Delete old avatar if exists
        if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
            Storage::disk('public')->delete($user->avatar);
        }

        // Compress and store avatar (512x512, quality 85)
        $path = $imageService->compressAndStore(
            $request->file('avatar'),
            'avatars',
            maxWidth: 512,
            maxHeight: 512,
            quality: 85,
        );

        $user->update(['avatar' => $path]);

        return back()->with('success', 'Аватар успешно загружен');
    }

    public function updatePassword(UpdatePasswordRequest $request)
    {
        $user = $request->user();

        // Verify current password
        if (!Hash::check($request->current_password, $user->password)) {
            return back()->withErrors(['current_password' => 'Неверный текущий пароль']);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return back()->with('success', 'Пароль успешно изменен');
    }

    public function updateSchedule(Request $request)
    {
        \Illuminate\Support\Facades\Log::info('Schedule update request:', $request->all());

        $validated = $request->validate([
            'schedule' => 'required|array',
            'schedule.*.day_of_week' => 'required|integer|between:0,6',
            'schedule.*.is_working' => 'required|boolean',
            'schedule.*.start_time' => 'required_if:schedule.*.is_working,true|nullable',
            'schedule.*.end_time' => 'required_if:schedule.*.is_working,true|nullable',
            'schedule.*.break_start' => 'nullable',
            'schedule.*.break_end' => 'nullable',
        ]);

        $user = $request->user();

        // Delete existing schedule
        $user->userSchedules()->delete();

        // Create new schedule
        foreach ($validated['schedule'] as $day) {
            if ($day['is_working']) {
                UserSchedule::create([
                    'user_id' => $user->id,
                    'day_of_week' => $day['day_of_week'],
                    'is_working' => true,
                    'start_time' => $day['start_time'],
                    'end_time' => $day['end_time'],
                    'break_start' => !empty($day['break_start']) ? $day['break_start'] : null,
                    'break_end' => !empty($day['break_end']) ? $day['break_end'] : null,
                ]);
            }
        }

        \Illuminate\Support\Facades\Log::info('Schedule updated successfully');

        return back()->with('success', 'График работы успешно обновлен');
    }

    /**
     * Генерация ссылки для подключения Telegram
     */
    public function generateTelegramLink(Request $request)
    {
        $user = $request->user();
        
        // Генерируем уникальный код
        $code = strtoupper(substr(md5(uniqid($user->id, true)), 0, 8));
        
        $user->update([
            'telegram_verification_code' => $code,
        ]);
        
        // Формируем Deep Link для Telegram
        $botUsername = config('services.telegram.bot_username', env('TELEGRAM_BOT_USERNAME'));
        $telegramLink = "https://t.me/{$botUsername}?start={$code}";
        
        return response()->json([
            'link' => $telegramLink,
            'code' => $code,
        ]);
    }

    /**
     * Отвязка Telegram аккаунта
     */
    public function unlinkTelegram(Request $request)
    {
        $user = $request->user();
        
        $user->update([
            'telegram_id' => null,
            'telegram_username' => null,
            'telegram_verification_code' => null,
            'telegram_verified_at' => null,
        ]);
        
        return back()->with('success', 'Telegram аккаунт отвязан');
    }

    /**
     * Получить настройки Telegram уведомлений
     */
    public function getTelegramSettings(Request $request)
    {
        $user = $request->user();
        
        // Получаем или создаем настройки
        $generalSettings = \App\Models\TelegramNotificationSetting::getOrCreateSettings($user);
        
        // Получаем настройки для каждого типа уведомлений
        $eventTypes = [
            'appointment_created',
            'appointment_updated',
            'ticket_reply',
            'appointment_reminder',
        ];
        
        $settings = [
            'reminder_time' => $generalSettings->reminder_time,
            'quiet_mode_enabled' => $generalSettings->quiet_mode_enabled,
            'quiet_mode_start' => $generalSettings->quiet_mode_start,
            'quiet_mode_end' => $generalSettings->quiet_mode_end,
            'notification_format' => $generalSettings->notification_format,
        ];
        
        foreach ($eventTypes as $eventType) {
            $settings[$eventType] = \App\Models\TelegramNotificationSetting::isEnabled($user, 'telegram', $eventType);
        }
        
        return response()->json($settings);
    }

    /**
     * Обновить настройки Telegram уведомлений
     */
    public function updateTelegramSettings(Request $request)
    {
        $validated = $request->validate([
            'appointment_created' => 'boolean',
            'appointment_updated' => 'boolean',
            'ticket_reply' => 'boolean',
            'appointment_reminder' => 'boolean',
            'reminder_time' => 'required|integer|in:15,30,60,180,1440',
            'quiet_mode_enabled' => 'required|boolean',
            'quiet_mode_start' => 'nullable|date_format:H:i',
            'quiet_mode_end' => 'nullable|date_format:H:i',
            'notification_format' => 'required|string|in:brief,detailed',
        ]);

        // Валидация тихого режима
        if ($validated['quiet_mode_enabled']) {
            if (empty($validated['quiet_mode_start']) || empty($validated['quiet_mode_end'])) {
                return back()->withErrors(['quiet_mode' => 'Необходимо указать время начала и конца тихого режима']);
            }
        }

        $user = $request->user();
        
        // Обновляем настройки
        \App\Models\TelegramNotificationSetting::updateSettings($user, $validated);
        
        return back()->with('success', 'Настройки уведомлений сохранены');
    }
}
