<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // How this staff member is paid, for month-end payroll calculation.
            // 'monthly' = pay_rate is the fixed amount for the whole month.
            // 'daily'   = pay_rate x days present that month.
            $table->enum('pay_type', ['monthly', 'daily'])->nullable()->after('department');
            $table->decimal('pay_rate', 10, 2)->nullable()->after('pay_type');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['pay_type', 'pay_rate']);
        });
    }
};
