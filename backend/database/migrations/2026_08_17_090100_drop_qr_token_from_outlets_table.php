<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Superseded by outlet_qr_codes (an outlet can now have several entrance
    // codes, each with its own scan stats) - the single-token column carried
    // its value forward in the previous migration, so it's safe to drop.
    public function up(): void
    {
        Schema::table('outlets', function (Blueprint $table) {
            $table->dropColumn('qr_token');
        });
    }

    public function down(): void
    {
        Schema::table('outlets', function (Blueprint $table) {
            $table->string('qr_token')->nullable()->unique()->after('radius_meters');
        });
    }
};
