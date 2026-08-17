<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['worker_id', 'attendance_date', 'present'])]
class LabourAttendance extends Model
{
    // Eloquent's default pluralization would guess "labour_attendances";
    // the migration named it "labour_attendance" to match the concept
    // (one day's roster), so pin the real table name explicitly.
    protected $table = 'labour_attendance';

    protected function casts(): array
    {
        return [
            'attendance_date' => 'date',
            'present' => 'boolean',
        ];
    }

    public function worker(): BelongsTo
    {
        return $this->belongsTo(LabourWorker::class, 'worker_id');
    }
}
