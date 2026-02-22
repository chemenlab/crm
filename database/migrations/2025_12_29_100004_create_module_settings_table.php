<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('module_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('module_slug', 100);
            $table->string('key', 100);
            $table->json('value')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'module_slug', 'key'], 'unique_setting');
            $table->index(['user_id', 'module_slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('module_settings');
    }
};
