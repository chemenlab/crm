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
        Schema::table('appointment_meta', function (Blueprint $table) {
            // Drop old foreign key
            $table->dropForeign(['user_field_id']);
            
            // Add new foreign key to custom_fields
            $table->foreign('user_field_id')
                ->references('id')
                ->on('custom_fields')
                ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointment_meta', function (Blueprint $table) {
            // Revert to old foreign key
            $table->dropForeign(['user_field_id']);
            
            $table->foreign('user_field_id')
                ->references('id')
                ->on('user_fields')
                ->cascadeOnDelete();
        });
    }
};
