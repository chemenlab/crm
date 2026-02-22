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
        Schema::create('admin_activity_log', function (Blueprint $table) {
            $table->id();
            $table->foreignId('administrator_id')->constrained('administrators')->onDelete('cascade');
            $table->string('action'); // create, update, delete, view, login, logout
            $table->string('target_type')->nullable(); // User, Subscription, PromoCode, etc.
            $table->unsignedBigInteger('target_id')->nullable();
            $table->json('changes')->nullable(); // Изменения в формате JSON
            $table->text('description')->nullable();
            $table->string('ip_address');
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at');
            
            $table->index(['administrator_id', 'created_at']);
            $table->index(['action', 'created_at']);
            $table->index(['target_type', 'target_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admin_activity_log');
    }
};
