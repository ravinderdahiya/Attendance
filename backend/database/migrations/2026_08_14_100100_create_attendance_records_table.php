<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('outlet_id')->constrained()->cascadeOnDelete();
            $table->date('shift_date');

            $table->timestamp('clock_in_at')->nullable();
            $table->decimal('clock_in_lat', 10, 7)->nullable();
            $table->decimal('clock_in_lng', 10, 7)->nullable();
            $table->unsignedInteger('clock_in_distance_m')->nullable();
            // on_time: within radius. blocked: outside radius, clock-in denied
            // (row still kept so managers see the attempt in live monitor).
            $table->enum('status', ['on_time', 'blocked'])->nullable();

            $table->timestamp('clock_out_at')->nullable();
            $table->decimal('clock_out_lat', 10, 7)->nullable();
            $table->decimal('clock_out_lng', 10, 7)->nullable();

            $table->timestamps();

            // One row per staff member per outlet per day - clock-out updates
            // the same row a clock-in created rather than inserting a new one.
            $table->unique(['user_id', 'shift_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_records');
    }
};
