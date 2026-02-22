<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Notification System Scheduled Tasks

// Send 24-hour reminders (every hour)
Schedule::command('notifications:send-reminders 24h')
    ->hourly()
    ->withoutOverlapping()
    ->runInBackground();

// Send 2-hour reminders (every 30 minutes)
Schedule::command('notifications:send-reminders 2h')
    ->everyThirtyMinutes()
    ->withoutOverlapping()
    ->runInBackground();

// Send daily summary to masters via Telegram (8:00 AM Moscow time)
Schedule::command('telegram:send-daily-summary')
    ->dailyAt('08:00')
    ->timezone('Europe/Moscow')
    ->runInBackground();

// Cleanup old notification logs (daily at 3:00 AM)
Schedule::command('notifications:cleanup')
    ->dailyAt('03:00')
    ->runInBackground();

// Subscription System Scheduled Tasks

// Check expired subscriptions (every hour)
Schedule::command('subscriptions:check-expired')
    ->hourly()
    ->withoutOverlapping()
    ->runInBackground();

// Process recurring payments (daily at 2:00 AM)
Schedule::command('subscriptions:process-recurring')
    ->dailyAt('02:00')
    ->withoutOverlapping()
    ->runInBackground();

// Send subscription reminders (daily at 10:00 AM)
Schedule::command('subscriptions:send-reminders')
    ->dailyAt('10:00')
    ->runInBackground();

// Reset monthly usage (first day of month at 00:01)
Schedule::command('subscriptions:reset-usage')
    ->monthlyOn(1, '00:01')
    ->runInBackground();

// User Cleanup Scheduled Tasks

// Cleanup inactive users (daily at 4:00 AM)
// - Warns users inactive for 90 days
// - Deletes users inactive for 104 days (90 + 14 days after warning)
Schedule::command('users:cleanup-inactive')
    ->dailyAt('04:00')
    ->withoutOverlapping()
    ->runInBackground();

// Module System Scheduled Tasks

// Check expired module subscriptions (every hour)
Schedule::command('modules:check-expired --notify')
    ->hourly()
    ->withoutOverlapping()
    ->runInBackground();

// Aggregate module statistics (daily at 1:00 AM)
Schedule::command('modules:aggregate-stats')
    ->dailyAt('01:00')
    ->withoutOverlapping()
    ->runInBackground();

// Cleanup old module error logs (weekly on Sunday at 2:00 AM)
Schedule::command('modules:cleanup-logs --days=30')
    ->weeklyOn(0, '02:00')
    ->withoutOverlapping()
    ->runInBackground();
