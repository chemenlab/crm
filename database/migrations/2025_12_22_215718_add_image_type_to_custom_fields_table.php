<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Modify the enum to include 'image' type
        DB::statement("ALTER TABLE custom_fields MODIFY COLUMN type ENUM('text', 'number', 'date', 'select', 'checkbox', 'image') DEFAULT 'text'");
        
        // Add allow_multiple column for image fields
        Schema::table('custom_fields', function (Blueprint $table) {
            $table->boolean('allow_multiple')->default(false)->after('is_public');
        });
    }

    public function down(): void
    {
        Schema::table('custom_fields', function (Blueprint $table) {
            $table->dropColumn('allow_multiple');
        });
        
        DB::statement("ALTER TABLE custom_fields MODIFY COLUMN type ENUM('text', 'number', 'date', 'select', 'checkbox') DEFAULT 'text'");
    }
};
