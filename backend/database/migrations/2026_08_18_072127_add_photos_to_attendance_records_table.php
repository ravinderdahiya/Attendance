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
        Schema::table('attendance_records', function (Blueprint $table) {
            // Storage path (not URL) for the selfie taken at clock-in/out -
            // proof the staff member was physically present, alongside the GPS check.
            $table->string('clock_in_photo')->nullable()->after('clock_in_method');
            $table->string('clock_out_photo')->nullable()->after('clock_out_method');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendance_records', function (Blueprint $table) {
            $table->dropColumn(['clock_in_photo', 'clock_out_photo']);
        });
    }
};
