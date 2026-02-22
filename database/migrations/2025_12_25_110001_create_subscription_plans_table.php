<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Базовая, Профессиональная, Максимальная
            $table->string('slug')->unique(); // basic, professional, maximum
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2)->default(0); // Цена в рублях
            $table->enum('billing_period', ['monthly', 'yearly'])->default('monthly');
            $table->boolean('is_active')->default(true);
            
            // Лимиты
            $table->integer('max_appointments')->default(-1); // -1 = безлимит
            $table->integer('max_clients')->default(-1);
            $table->integer('max_services')->default(-1);
            $table->integer('max_portfolio_images')->default(-1);
            $table->integer('max_tags')->default(-1);
            $table->integer('max_notifications_per_month')->default(-1);
            
            // Функции
            $table->boolean('has_analytics')->default(false);
            $table->boolean('has_priority_support')->default(false);
            $table->boolean('has_custom_branding')->default(false);
            
            $table->integer('trial_days')->default(0);
            $table->integer('sort_order')->default(0);
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_plans');
    }
};
