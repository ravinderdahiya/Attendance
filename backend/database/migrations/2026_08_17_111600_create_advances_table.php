<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Cash the business hands a staff member mid-month, netted off their pay at month-end. */
    public function up(): void
    {
        Schema::create('advances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->string('note')->nullable();
            $table->date('given_at');
            $table->timestamps();

            $table->index(['user_id', 'given_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('advances');
    }
};
