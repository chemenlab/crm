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
        Schema::table('users', function (Blueprint $table) {
            $table->string('telegram_id')->nullable()->unique()->after('email');
            $table->string('telegram_username')->nullable()->after('telegram_id');
            $table->string('telegram_verification_code')->nullable()->after('telegram_username');
            $table->timestamp('telegram_verified_at')->nullable()->after('telegram_verification_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'telegram_id',
                'telegram_username',
                'telegram_verification_code',
                'telegram_verified_at'
            ]);
        });
    }
};
