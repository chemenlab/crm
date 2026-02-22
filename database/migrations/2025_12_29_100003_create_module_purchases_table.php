<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('module_purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('module_slug', 100);
            $table->foreignId('payment_id')->nullable()->constrained('subscription_payments')->onDelete('set null');
            $table->string('yookassa_payment_id', 100)->nullable();
            $table->decimal('price', 10, 2);
            $table->string('currency', 3)->default('RUB');
            $table->enum('pricing_type', ['subscription', 'one_time']);
            $table->enum('status', ['pending', 'completed', 'failed', 'refunded', 'cancelled'])->default('pending');
            $table->timestamp('purchased_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->boolean('auto_renew')->default(true);
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->text('refund_reason')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'module_slug'], 'idx_user_module');
            $table->index('status', 'idx_status');
            $table->index('expires_at', 'idx_expires');
            $table->index('yookassa_payment_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('module_purchases');
    }
};
