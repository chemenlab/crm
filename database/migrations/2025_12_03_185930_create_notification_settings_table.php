<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('notification_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // Email notifications
            $table->boolean('email_new_booking')->default(true);
            $table->boolean('email_cancelled')->default(true);
            $table->boolean('email_modified')->default(true);
            $table->boolean('email_payment')->default(false);

            // Client reminders
            $table->boolean('client_reminder_24h')->default(true);
            $table->boolean('client_reminder_1h')->default(false);
            $table->boolean('client_thank_you')->default(false);

            // Summaries
            $table->boolean('daily_summary')->default(false);
            $table->time('daily_summary_time')->default('09:00');
            $table->boolean('weekly_summary')->default(false);
            $table->integer('weekly_summary_day')->default(1)->comment('1=Monday');

            // Notification email (can be different from user email)
            $table->string('notification_email')->nullable();

            $table->timestamps();

            $table->unique('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_settings');
    }
};
