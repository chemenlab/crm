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
        Schema::table('clients', function (Blueprint $table) {
            // vk_id и telegram_id уже существуют, добавляем только preferred_channel
            if (!Schema::hasColumn('clients', 'preferred_channel')) {
                $table->string('preferred_channel', 20)->default('phone')->after('telegram_id');
            }
            
            // Добавляем индексы если их нет
            if (!Schema::hasIndex('clients', 'clients_vk_id_index')) {
                $table->index('vk_id');
            }
            if (!Schema::hasIndex('clients', 'clients_telegram_id_index')) {
                $table->index('telegram_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            if (Schema::hasColumn('clients', 'preferred_channel')) {
                $table->dropColumn('preferred_channel');
            }
        });
    }
};
