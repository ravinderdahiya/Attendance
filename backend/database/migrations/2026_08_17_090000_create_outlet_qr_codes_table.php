<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('outlet_qr_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outlet_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            $table->string('token')->unique();
            $table->unsignedInteger('scan_count')->default(0);
            $table->timestamp('last_scanned_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Carry each outlet's existing single QR token forward as its
        // "Main entrance" code, so already-printed codes keep working.
        DB::table('outlets')->whereNotNull('qr_token')->get()->each(function ($outlet) {
            DB::table('outlet_qr_codes')->insert([
                'outlet_id' => $outlet->id,
                'label' => 'Main entrance',
                'token' => $outlet->qr_token,
                'scan_count' => 0,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('outlet_qr_codes');
    }
};
