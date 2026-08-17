<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'location_name', 'latitude', 'longitude', 'arrived_at', 'departed_at'])]
class FieldVisit extends Model
{
    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'arrived_at' => 'datetime',
            'departed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
