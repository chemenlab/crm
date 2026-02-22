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
        Schema::table('transactions', function (Blueprint $table) {
            $table->enum('payment_method', ['cash', 'card', 'transfer', 'qr', 'other'])->default('cash')->after('amount');
            $table->boolean('is_taxable')->default(true)->after('payment_method');
            $table->decimal('tax_amount', 10, 2)->default(0)->after('is_taxable');
            $table->string('source')->nullable()->comment('Appointment, Manual, etc')->after('description');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn(['payment_method', 'is_taxable', 'tax_amount', 'source']);
        });
    }
};
