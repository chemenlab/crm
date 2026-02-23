<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('oauth_providers', function (Blueprint $table) {
            $table->renameColumn('provider_id', 'provider_user_id');
            $table->renameColumn('provider_token', 'access_token');
            $table->renameColumn('provider_refresh_token', 'refresh_token');
            $table->timestamp('token_expires_at')->nullable()->after('refresh_token');
        });
    }

    public function down(): void
    {
        Schema::table('oauth_providers', function (Blueprint $table) {
            $table->renameColumn('provider_user_id', 'provider_id');
            $table->renameColumn('access_token', 'provider_token');
            $table->renameColumn('refresh_token', 'provider_refresh_token');
            $table->dropColumn('token_expires_at');
        });
    }
};
