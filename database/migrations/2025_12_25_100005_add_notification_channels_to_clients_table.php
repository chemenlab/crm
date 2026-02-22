<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            // Add vk_id column if it doesn't exist
            if (!Schema::hasColumn('clients', 'vk_id')) {
                $table->string('vk_id')->nullable()->after('telegram_id');
            }

            // Add preferred_channel if it doesn't exist
            if (!Schema::hasColumn('clients', 'preferred_channel')) {
                $table->string('preferred_channel', 20)->default('phone')->after('telegram_id');
            }
        });

        // Add indexes in a separate call (after columns are guaranteed to exist)
        Schema::table('clients', function (Blueprint $table) {
            if (Schema::hasColumn('clients', 'vk_id') && !Schema::hasIndex('clients', 'clients_vk_id_index')) {
                $table->index('vk_id');
            }
            if (Schema::hasColumn('clients', 'telegram_id') && !Schema::hasIndex('clients', 'clients_telegram_id_index')) {
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
            if (Schema::hasColumn('clients', 'vk_id')) {
                $table->dropColumn('vk_id');
            }
        });
    }
};
