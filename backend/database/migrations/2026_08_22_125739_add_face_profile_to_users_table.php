<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // On-device face matching compares against this embedding - the
            // server never runs the match itself, just stores it so a
            // reinstalled app can resync without asking staff to re-enroll.
            $table->json('face_embedding')->nullable()->after('pin');
            $table->string('face_reference_photo')->nullable()->after('face_embedding');
            $table->timestamp('face_enrolled_at')->nullable()->after('face_reference_photo');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['face_embedding', 'face_reference_photo', 'face_enrolled_at']);
        });
    }
};
