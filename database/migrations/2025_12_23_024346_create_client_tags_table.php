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
        Schema::create('client_tags', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name'); // Название тега (например: "Хороший клиент", "Проблемный")
            $table->string('color')->default('#3b82f6'); // Цвет тега для визуализации
            $table->text('description')->nullable(); // Описание тега
            $table->timestamps();

            $table->unique(['user_id', 'name']); // У каждого мастера уникальные названия тегов
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('client_tags');
    }
};
