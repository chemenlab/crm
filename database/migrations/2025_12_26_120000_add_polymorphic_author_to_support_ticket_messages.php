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
        Schema::table('support_ticket_messages', function (Blueprint $table) {
            // Добавляем полиморфные поля для автора
            $table->string('author_type')->nullable()->after('support_ticket_id');
            $table->unsignedBigInteger('author_id')->nullable()->after('author_type');
            
            // Индекс для полиморфной связи
            $table->index(['author_type', 'author_id']);
        });

        // Мигрируем существующие данные: user_id -> author
        DB::statement("
            UPDATE support_ticket_messages 
            SET author_type = 'App\\\\Models\\\\User', 
                author_id = user_id 
            WHERE user_id IS NOT NULL
        ");

        Schema::table('support_ticket_messages', function (Blueprint $table) {
            // Делаем user_id nullable (оставляем для обратной совместимости)
            $table->foreignId('user_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('support_ticket_messages', function (Blueprint $table) {
            $table->dropIndex(['author_type', 'author_id']);
            $table->dropColumn(['author_type', 'author_id']);
        });
    }
};
