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
        // Обновляем существующие сообщения, у которых не заполнены author_type и author_id
        // но есть user_id - устанавливаем автора как User
        \DB::table('support_ticket_messages')
            ->whereNull('author_type')
            ->whereNull('author_id')
            ->whereNotNull('user_id')
            ->update([
                'author_type' => 'App\\Models\\User',
                'author_id' => \DB::raw('user_id'),
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
