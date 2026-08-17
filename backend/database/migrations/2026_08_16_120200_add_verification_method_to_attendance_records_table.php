<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendance_records', function (Blueprint $table) {
            // How the clock-in/out was verified. 'gps' = geofence distance check,
            // 'qr' = outlet QR code scan (no distance check, presence implied by
            // having the outlet's current token).
            $table->string('clock_in_method')->nullable()->after('status');
            $table->string('clock_out_method')->nullable()->after('clock_out_lng');
            // True when this event was queued on-device (no network) and synced
            // later - clock_in_at/clock_out_at reflect the device's timestamp at
            // the moment it happened, not when the server received it.
            $table->boolean('synced_offline')->default(false)->after('clock_out_method');
        });
    }

    public function down(): void
    {
        Schema::table('attendance_records', function (Blueprint $table) {
            $table->dropColumn(['clock_in_method', 'clock_out_method', 'synced_offline']);
        });
    }
};
