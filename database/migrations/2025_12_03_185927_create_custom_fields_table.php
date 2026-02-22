<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('custom_fields', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->enum('type', ['text', 'number', 'date', 'select', 'checkbox'])->default('text');
            $table->boolean('is_required')->default(false);
            $table->boolean('is_public')->default(true)->comment('Show in public booking form');
            $table->json('options')->nullable()->comment('For select type');
            $table->integer('order')->default(0);
            $table->timestamps();

            $table->index(['user_id', 'order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('custom_fields');
    }
};
