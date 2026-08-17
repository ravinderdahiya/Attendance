<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

#[Fillable(['outlet_id', 'name', 'sequence', 'expected_time'])]
class Checkpoint extends Model
{
    protected static function booted(): void
    {
        static::creating(fn (Checkpoint $checkpoint) => $checkpoint->qr_token ??= Str::random(24));
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function patrolLogs(): HasMany
    {
        return $this->hasMany(PatrolLog::class);
    }
}
