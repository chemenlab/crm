<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('subscription_plan_id')->constrained()->onDelete('cascade');
            
            $table->enum('status', ['active', 'cancelled', 'expired', 'trial', 'past_due'])->default('trial');
            
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('current_period_start')->nullable();
            $table->timestamp('current_period_end')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            
            // YooKassa данные
            $table->string('yookassa_subscription_id')->nullable()->unique();
            $table->boolean('auto_renew')->default(true);
            
            // Промокод
            $table->foreignId('promo_code_id')->nullable()->constrained()->onDelete('set null');
            $table->decimal('discount_amount', 10, 2)->default(0);
            
            $table->timestamps();
            
            $table->index(['user_id', 'status']);
            $table->index('current_period_end');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
