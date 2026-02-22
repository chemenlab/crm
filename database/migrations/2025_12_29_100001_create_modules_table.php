<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('modules', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 100)->unique();
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->text('long_description')->nullable();
            $table->string('version', 20);
            $table->string('author', 255)->nullable();
            $table->string('category', 50)->nullable();
            $table->string('icon', 100)->nullable();
            $table->json('screenshots')->nullable();
            $table->enum('pricing_type', ['free', 'subscription', 'one_time'])->default('free');
            $table->decimal('price', 10, 2)->default(0);
            $table->enum('subscription_period', ['monthly', 'yearly'])->default('monthly');
            $table->string('min_plan', 50)->nullable();
            $table->json('dependencies')->nullable();
            $table->json('hooks')->nullable();
            $table->json('permissions')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->integer('installs_count')->default(0);
            $table->decimal('rating', 2, 1)->default(0);
            $table->timestamps();

            $table->index('category');
            $table->index('pricing_type');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('modules');
    }
};
