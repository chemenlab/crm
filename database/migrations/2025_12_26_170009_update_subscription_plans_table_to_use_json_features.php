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
        Schema::table('subscription_plans', function (Blueprint $table) {
            // Удаляем старые колонки с лимитами
            $table->dropColumn([
                'max_appointments',
                'max_clients',
                'max_services',
                'max_portfolio_images',
                'max_tags',
                'max_notifications_per_month',
                'has_analytics',
                'has_priority_support',
                'has_custom_branding',
                'trial_days'
            ]);
            
            // Добавляем JSON колонку для features
            $table->json('features')->after('billing_period');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table) {
            // Возвращаем старые колонки
            $table->integer('max_appointments')->default(-1);
            $table->integer('max_clients')->default(-1);
            $table->integer('max_services')->default(-1);
            $table->integer('max_portfolio_images')->default(-1);
            $table->integer('max_tags')->default(-1);
            $table->integer('max_notifications_per_month')->default(-1);
            $table->boolean('has_analytics')->default(false);
            $table->boolean('has_priority_support')->default(false);
            $table->boolean('has_custom_branding')->default(false);
            $table->integer('trial_days')->default(0);
            
            // Удаляем JSON колонку
            $table->dropColumn('features');
        });
    }
};
