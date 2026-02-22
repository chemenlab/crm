<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('usage_tracking', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            $table->string('resource_type'); // appointments, clients, services, portfolio_images, tags, notifications
            $table->integer('current_usage')->default(0);
            $table->integer('limit_value')->default(-1); // -1 = безлимит
            
            $table->date('period_start');
            $table->date('period_end');
            
            $table->boolean('warning_sent')->default(false); // Предупреждение при 80%
            $table->boolean('limit_reached')->default(false);
            
            $table->timestamps();
            
            $table->unique(['user_id', 'resource_type', 'period_start']);
            $table->index(['user_id', 'period_start', 'period_end']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('usage_tracking');
    }
};
