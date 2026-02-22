<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add 'photo' and 'file' types to the enum
        DB::statement("ALTER TABLE custom_fields MODIFY COLUMN type ENUM('text', 'number', 'date', 'select', 'checkbox', 'image', 'photo', 'file') DEFAULT 'text'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove 'photo' and 'file' types from the enum
        DB::statement("ALTER TABLE custom_fields MODIFY COLUMN type ENUM('text', 'number', 'date', 'select', 'checkbox', 'image') DEFAULT 'text'");
    }
};
