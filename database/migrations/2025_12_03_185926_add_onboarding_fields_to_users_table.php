<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // onboarding_completed, phone, timezone уже существуют
            $table->string('avatar')->nullable()->after('phone');
            $table->string('address')->nullable()->after('avatar');
            $table->string('city')->nullable()->after('address');
            $table->string('instagram')->nullable()->after('city');
            $table->string('vk')->nullable()->after('instagram');
            $table->string('telegram')->nullable()->after('vk');
            $table->string('whatsapp')->nullable()->after('telegram');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'avatar',
                'address',
                'city',
                'instagram',
                'vk',
                'telegram',
                'whatsapp',
            ]);
        });
    }
};
