<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('outlet_id')->constrained()->cascadeOnDelete();
            $table->date('shift_date');
            $table->time('start_time');
            $table->time('end_time');
            // e.g. "Lunch service", "Break" - matches the mockup's schedule rows.
            $table->string('label')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'shift_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shifts');
    }
};
