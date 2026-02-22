<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('module_error_logs', function (Blueprint $table) {
            $table->id();
            $table->string('module_slug', 100);
            $table->string('error_type', 50);
            $table->text('error_message');
            $table->text('stack_trace')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->json('context')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('module_slug', 'idx_module');
            $table->index('created_at', 'idx_created');
            $table->index('error_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('module_error_logs');
    }
};
