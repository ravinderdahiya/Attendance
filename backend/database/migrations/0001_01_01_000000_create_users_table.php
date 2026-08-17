<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->enum('role', ['staff', 'manager'])->default('staff');
            $table->string('name');
            // Staff sign in via mobile+OTP; managers via username+password - both
            // are nullable so either login path can be null on the other role.
            $table->string('mobile')->unique()->nullable();
            $table->string('staff_code')->unique()->nullable();
            $table->string('username')->unique()->nullable();
            $table->string('email')->nullable();
            $table->string('password')->nullable();
            $table->string('designation')->nullable();
            $table->string('department')->nullable();
            $table->unsignedBigInteger('outlet_id')->nullable()->index();
            $table->boolean('is_active')->default(true);
            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
