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
        Schema::create('module_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('client_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('appointment_id')->nullable()->constrained()->onDelete('set null');
            $table->string('author_name');
            $table->string('author_email')->nullable();
            $table->string('author_phone')->nullable();
            $table->tinyInteger('rating')->unsigned(); // 1-5
            $table->text('text')->nullable();
            $table->text('response')->nullable(); // Master's response
            $table->timestamp('response_at')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->boolean('is_verified')->default(false); // Verified client
            $table->boolean('is_featured')->default(false); // Featured review
            $table->string('source')->default('manual'); // manual, auto_request, public_page
            $table->json('meta')->nullable(); // Additional metadata
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['user_id', 'rating']);
            $table->index(['user_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('module_reviews');
    }
};
