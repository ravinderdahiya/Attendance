<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('labour_sites', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('labour_workers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained('labour_sites')->cascadeOnDelete();
            $table->string('name');
            $table->string('trade');
            $table->timestamps();
        });

        Schema::create('labour_attendance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('worker_id')->constrained('labour_workers')->cascadeOnDelete();
            $table->date('attendance_date');
            $table->boolean('present')->default(false);
            $table->timestamps();

            $table->unique(['worker_id', 'attendance_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('labour_attendance');
        Schema::dropIfExists('labour_workers');
        Schema::dropIfExists('labour_sites');
    }
};
