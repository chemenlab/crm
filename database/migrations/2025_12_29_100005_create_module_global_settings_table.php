<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('module_global_settings', function (Blueprint $table) {
            $table->id();
            $table->string('module_slug', 100);
            $table->string('key', 100);
            $table->json('value')->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->unique(['module_slug', 'key'], 'unique_global_setting');
            $table->index('module_slug');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('module_global_settings');
    }
};
