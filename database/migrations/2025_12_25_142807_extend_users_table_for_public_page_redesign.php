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
            // Градиент для фона (новые поля)
            $table->string('site_gradient_from', 7)->nullable()->after('theme_color');
            $table->string('site_gradient_to', 7)->nullable()->after('site_gradient_from');
            
            // Кастомный CSS (для продвинутых пользователей)
            $table->text('site_custom_css')->nullable()->after('site_gradient_to');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'site_gradient_from',
                'site_gradient_to',
                'site_custom_css',
            ]);
        });
    }
};
