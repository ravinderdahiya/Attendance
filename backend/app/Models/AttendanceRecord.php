<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

#[Fillable([
    'user_id', 'outlet_id', 'shift_date',
    'clock_in_at', 'clock_in_lat', 'clock_in_lng', 'clock_in_distance_m', 'status', 'clock_in_method', 'clock_in_photo', 'clock_in_face_confidence',
    'clock_out_at', 'clock_out_lat', 'clock_out_lng', 'clock_out_method', 'clock_out_photo', 'clock_out_face_confidence', 'synced_offline',
])]
class AttendanceRecord extends Model
{
    use HasFactory;

    protected $appends = ['clock_in_photo_url', 'clock_out_photo_url'];

    protected function casts(): array
    {
        return [
            'shift_date' => 'date',
            'clock_in_at' => 'datetime',
            'clock_out_at' => 'datetime',
            'clock_in_lat' => 'float',
            'clock_in_lng' => 'float',
            'clock_out_lat' => 'float',
            'clock_out_lng' => 'float',
            'clock_in_face_confidence' => 'float',
            'clock_out_face_confidence' => 'float',
            'synced_offline' => 'boolean',
        ];
    }

    public function getClockInPhotoUrlAttribute(): ?string
    {
        return $this->clock_in_photo ? Storage::disk('public')->url($this->clock_in_photo) : null;
    }

    public function getClockOutPhotoUrlAttribute(): ?string
    {
        return $this->clock_out_photo ? Storage::disk('public')->url($this->clock_out_photo) : null;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }
}
