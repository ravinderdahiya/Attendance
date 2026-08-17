<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patrol_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('checkpoint_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('patrol_date');
            $table->timestamp('scanned_at')->nullable();
            $table->timestamps();

            // One scan per guard per checkpoint per night's round.
            $table->unique(['checkpoint_id', 'user_id', 'patrol_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patrol_logs');
    }
};
