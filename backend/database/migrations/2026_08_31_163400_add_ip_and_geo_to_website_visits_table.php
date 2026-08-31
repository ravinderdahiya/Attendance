<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('website_visits', function (Blueprint $table) {
            $table->string('ip', 45)->nullable()->after('utm_source');
            $table->decimal('latitude', 10, 7)->nullable()->after('ip');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->string('city', 120)->nullable()->after('longitude');
        });
    }

    public function down(): void
    {
        Schema::table('website_visits', function (Blueprint $table) {
            $table->dropColumn(['ip', 'latitude', 'longitude', 'city']);
        });
    }
};
