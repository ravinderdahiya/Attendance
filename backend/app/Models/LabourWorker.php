<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['site_id', 'name', 'trade'])]
class LabourWorker extends Model
{
    public function site(): BelongsTo
    {
        return $this->belongsTo(LabourSite::class, 'site_id');
    }

    public function attendance(): HasMany
    {
        return $this->hasMany(LabourAttendance::class, 'worker_id');
    }
}
