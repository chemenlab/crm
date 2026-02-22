<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('subscription_id')->nullable()->constrained()->onDelete('set null');
            
            $table->string('yookassa_payment_id')->unique();
            $table->enum('status', ['pending', 'waiting_for_capture', 'succeeded', 'cancelled', 'failed'])->default('pending');
            
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('RUB');
            
            $table->string('payment_method')->nullable(); // bank_card, yoo_money, etc.
            $table->text('description')->nullable();
            
            $table->json('metadata')->nullable(); // Дополнительные данные от YooKassa
            
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            
            $table->timestamps();
            
            $table->index(['user_id', 'status']);
            $table->index('yookassa_payment_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_payments');
    }
};
