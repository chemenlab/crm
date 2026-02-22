<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('telegram_notification_settings', function (Blueprint $table) {
            // Время напоминания в минутах (15, 30, 60, 180, 1440)
            $table->integer('reminder_time')->default(60)->after('enabled');
            
            // Тихий режим
            $table->boolean('quiet_mode_enabled')->default(false)->after('reminder_time');
            $table->time('quiet_mode_start')->nullable()->after('quiet_mode_enabled');
            $table->time('quiet_mode_end')->nullable()->after('quiet_mode_start');
            
            // Формат уведомлений (brief, detailed)
            $table->enum('notification_format', ['brief', 'detailed'])->default('detailed')->after('quiet_mode_end');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('telegram_notification_settings', function (Blueprint $table) {
            $table->dropColumn([
                'reminder_time',
                'quiet_mode_enabled',
                'quiet_mode_start',
                'quiet_mode_end',
                'notification_format',
            ]);
        });
    }
};
