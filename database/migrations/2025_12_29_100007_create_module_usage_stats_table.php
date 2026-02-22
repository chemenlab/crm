<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('module_usage_stats', function (Blueprint $table) {
            $table->id();
            $table->string('module_slug', 100);
            $table->date('date');
            $table->integer('installs')->default(0);
            $table->integer('uninstalls')->default(0);
            $table->integer('active_users')->default(0);
            $table->integer('purchases')->default(0);
            $table->decimal('revenue', 10, 2)->default(0);
            $table->timestamps();

            $table->unique(['module_slug', 'date'], 'unique_stat');
            $table->index('date', 'idx_date');
            $table->index('module_slug');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('module_usage_stats');
    }
};
