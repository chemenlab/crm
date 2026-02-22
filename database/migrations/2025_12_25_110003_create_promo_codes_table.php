<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promo_codes', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->text('description')->nullable();
            
            $table->enum('type', ['percentage', 'fixed', 'trial_extension']); // процент, фиксированная сумма, продление триала
            $table->decimal('value', 10, 2); // Процент (0-100) или сумма в рублях или дни триала
            
            // Ограничения
            $table->integer('max_uses')->nullable(); // null = безлимит
            $table->integer('uses_count')->default(0);
            $table->integer('max_uses_per_user')->default(1);
            
            // Применимость
            $table->json('applicable_plans')->nullable(); // null = все планы, или массив plan_ids
            $table->boolean('first_payment_only')->default(false);
            
            $table->timestamp('valid_from')->nullable();
            $table->timestamp('valid_until')->nullable();
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
            
            $table->index('code');
            $table->index(['is_active', 'valid_from', 'valid_until']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promo_codes');
    }
};
