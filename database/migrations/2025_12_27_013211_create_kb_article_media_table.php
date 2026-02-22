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
        Schema::create('kb_article_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained('kb_articles')->onDelete('cascade');
            $table->enum('type', ['image', 'video', 'video_embed']);
            $table->string('filename');
            $table->string('path');
            $table->string('url');
            $table->integer('size')->default(0);
            $table->json('metadata')->nullable();
            $table->integer('order')->default(0);
            $table->timestamps();
            
            $table->index('article_id');
            $table->index('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kb_article_media');
    }
};
