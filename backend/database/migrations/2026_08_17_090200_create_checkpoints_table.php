<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('checkpoints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outlet_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->unsignedInteger('sequence')->default(0);
            // Time-of-day this checkpoint is expected to be scanned by, on a
            // guard's nightly round - not tied to a specific date.
            $table->time('expected_time');
            $table->string('qr_token')->unique();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('checkpoints');
    }
};
