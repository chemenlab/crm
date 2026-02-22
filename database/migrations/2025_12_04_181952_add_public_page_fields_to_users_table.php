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
        Schema::table('users', function (Blueprint $table) {
            $table->string('slug')->nullable()->unique()->after('email');
            $table->decimal('tax_rate', 5, 2)->nullable()->default(4.00)->after('slug');
            $table->string('site_title')->nullable()->after('tax_rate');
            $table->text('site_description')->nullable()->after('site_title');
            $table->string('theme_color', 7)->nullable()->default('#000000')->after('site_description');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['slug', 'tax_rate', 'site_title', 'site_description', 'theme_color']);
        });
    }
};
