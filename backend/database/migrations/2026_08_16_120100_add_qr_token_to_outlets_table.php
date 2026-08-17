<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('outlets', function (Blueprint $table) {
            $table->string('qr_token')->nullable()->unique()->after('radius_meters');
        });

        DB::table('outlets')->whereNull('qr_token')->get()->each(function ($outlet) {
            DB::table('outlets')->where('id', $outlet->id)->update(['qr_token' => Str::random(24)]);
        });
    }

    public function down(): void
    {
        Schema::table('outlets', function (Blueprint $table) {
            $table->dropColumn('qr_token');
        });
    }
};
