<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Modify ENUM to add 'archived' status
        DB::statement("ALTER TABLE leads MODIFY COLUMN status ENUM('new', 'in_progress', 'completed', 'cancelled', 'archived') DEFAULT 'new'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // First update any archived leads to cancelled
        DB::table('leads')->where('status', 'archived')->update(['status' => 'cancelled']);
        
        // Then remove archived from ENUM
        DB::statement("ALTER TABLE leads MODIFY COLUMN status ENUM('new', 'in_progress', 'completed', 'cancelled') DEFAULT 'new'");
    }
};
