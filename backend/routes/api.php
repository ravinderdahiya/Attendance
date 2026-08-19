<?php

use App\Http\Controllers\Api\Admin\CheckpointController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\FieldVisitController as AdminFieldVisitController;
use App\Http\Controllers\Api\Admin\LabourController;
use App\Http\Controllers\Api\Admin\LiveMonitorController;
use App\Http\Controllers\Api\Admin\OutletController;
use App\Http\Controllers\Api\Admin\PatrolController;
use App\Http\Controllers\Api\Admin\PayrollController;
use App\Http\Controllers\Api\Admin\ShiftController as AdminShiftController;
use App\Http\Controllers\Api\Admin\StaffController;
use App\Http\Controllers\Api\Admin\TimesheetController;
use App\Http\Controllers\Api\Admin\VisitorController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\FieldVisitController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ScanController;
use App\Http\Controllers\Api\ShiftController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/staff/login', [AuthController::class, 'staffLogin']);
Route::post('/auth/manager/login', [AuthController::class, 'managerLogin']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/attendance/today', [AttendanceController::class, 'today']);
    Route::get('/attendance/history', [AttendanceController::class, 'history']);
    Route::get('/attendance/calendar', [AttendanceController::class, 'calendar']);
    Route::get('/attendance/analytics', [AttendanceController::class, 'analytics']);
    Route::post('/attendance/clock-in', [AttendanceController::class, 'clockIn']);
    Route::post('/attendance/clock-out', [AttendanceController::class, 'clockOut']);

    Route::post('/scan', [ScanController::class, 'scan']);

    Route::get('/shifts/today', [ShiftController::class, 'today']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);

    Route::post('/field-visits/start', [FieldVisitController::class, 'start']);
    Route::post('/field-visits/{visit}/end', [FieldVisitController::class, 'end']);
    Route::get('/field-visits/today', [FieldVisitController::class, 'today']);

    Route::middleware('manager')->prefix('admin')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index']);

        Route::get('/staff', [StaffController::class, 'index']);
        Route::post('/staff', [StaffController::class, 'store']);
        Route::put('/staff/{staff}', [StaffController::class, 'update']);
        Route::delete('/staff/{staff}', [StaffController::class, 'destroy']);

        Route::get('/outlets', [OutletController::class, 'index']);
        Route::post('/outlets', [OutletController::class, 'store']);
        Route::put('/outlets/{outlet}', [OutletController::class, 'update']);

        Route::get('/live-monitor', [LiveMonitorController::class, 'index']);

        Route::get('/shifts', [AdminShiftController::class, 'index']);
        Route::post('/shifts', [AdminShiftController::class, 'store']);
        Route::put('/shifts/{shift}', [AdminShiftController::class, 'update']);
        Route::delete('/shifts/{shift}', [AdminShiftController::class, 'destroy']);

        Route::get('/timesheets', [TimesheetController::class, 'index']);

        Route::get('/payroll', [PayrollController::class, 'index']);
        Route::get('/payroll/{staff}/history', [PayrollController::class, 'history']);
        Route::post('/advances', [PayrollController::class, 'storeAdvance']);
        Route::delete('/advances/{advance}', [PayrollController::class, 'destroyAdvance']);

        Route::get('/visitors', [VisitorController::class, 'index']);
        Route::post('/visitors', [VisitorController::class, 'store']);
        Route::post('/visitors/{visitor}/check-out', [VisitorController::class, 'checkOut']);

        Route::get('/checkpoints', [CheckpointController::class, 'index']);
        Route::post('/checkpoints', [CheckpointController::class, 'store']);
        Route::delete('/checkpoints/{checkpoint}', [CheckpointController::class, 'destroy']);
        Route::get('/patrols', [PatrolController::class, 'index']);

        Route::get('/labour/sites', [LabourController::class, 'sites']);
        Route::post('/labour/sites', [LabourController::class, 'storeSite']);
        Route::post('/labour/workers', [LabourController::class, 'storeWorker']);
        Route::get('/labour/attendance', [LabourController::class, 'attendance']);
        Route::post('/labour/attendance', [LabourController::class, 'saveAttendance']);

        Route::get('/field-visits', [AdminFieldVisitController::class, 'index']);
    });
});
