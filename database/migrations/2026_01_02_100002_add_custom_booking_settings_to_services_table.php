<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->integer('custom_slot_step')->nullable()->after('duration');
            $table->integer('custom_buffer_time')->nullable()->after('custom_slot_step');
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn(['custom_slot_step', 'custom_buffer_time']);
        });
    }
};
