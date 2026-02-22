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
        Schema::create('service_preset_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_preset_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->decimal('price_change', 10, 2)->default(0);
            $table->integer('duration_change')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_preset_options');
    }
};
