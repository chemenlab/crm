<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointment_meta', function (Blueprint $table) {
            // Make user_field_id nullable (for backwards compatibility)
            $table->foreignId('user_field_id')->nullable()->change();
            
            // Add custom_field_id
            $table->foreignId('custom_field_id')->nullable()->after('user_field_id')
                ->constrained('custom_fields')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('appointment_meta', function (Blueprint $table) {
            $table->dropForeign(['custom_field_id']);
            $table->dropColumn('custom_field_id');
        });
    }
};
