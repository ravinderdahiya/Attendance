<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['checkpoint_id', 'user_id', 'patrol_date', 'scanned_at'])]
class PatrolLog extends Model
{
    protected function casts(): array
    {
        return [
            'patrol_date' => 'date',
            'scanned_at' => 'datetime',
        ];
    }

    public function checkpoint(): BelongsTo
    {
        return $this->belongsTo(Checkpoint::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
