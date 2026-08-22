<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendance_records', function (Blueprint $table) {
            $table->decimal('clock_in_face_confidence', 4, 3)->nullable()->after('clock_in_method');
            $table->decimal('clock_out_face_confidence', 4, 3)->nullable()->after('clock_out_method');
        });
    }

    public function down(): void
    {
        Schema::table('attendance_records', function (Blueprint $table) {
            $table->dropColumn(['clock_in_face_confidence', 'clock_out_face_confidence']);
        });
    }
};
