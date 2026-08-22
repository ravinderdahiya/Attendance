<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;

#[Fillable([
    'role', 'name', 'mobile', 'staff_code', 'username', 'email', 'password', 'pin',
    'designation', 'department', 'outlet_id', 'is_active', 'pay_type', 'pay_rate',
    'face_embedding', 'face_reference_photo', 'face_enrolled_at',
])]
#[Hidden(['password', 'remember_token', 'face_embedding', 'face_reference_photo'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $appends = ['face_enrolled', 'face_reference_photo_url'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'pay_rate' => 'decimal:2',
            'face_embedding' => 'array',
            'face_enrolled_at' => 'datetime',
        ];
    }

    public function getFaceEnrolledAttribute(): bool
    {
        return $this->face_enrolled_at !== null;
    }

    public function getFaceReferencePhotoUrlAttribute(): ?string
    {
        return $this->face_reference_photo ? Storage::disk('public')->url($this->face_reference_photo) : null;
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    public function shifts(): HasMany
    {
        return $this->hasMany(Shift::class);
    }

    public function advances(): HasMany
    {
        return $this->hasMany(Advance::class);
    }
}
