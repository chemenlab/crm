<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('module_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('module_slug', 100);
            $table->unsignedTinyInteger('rating'); // 1-5
            $table->text('comment')->nullable();
            $table->boolean('is_verified')->default(false); // Verified purchase
            $table->boolean('is_approved')->default(true); // Moderation
            $table->timestamps();

            $table->foreign('module_slug')
                ->references('slug')
                ->on('modules')
                ->onDelete('cascade');

            // One review per user per module
            $table->unique(['user_id', 'module_slug']);

            $table->index('module_slug');
            $table->index('rating');
            $table->index('is_approved');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('module_reviews');
    }
};
