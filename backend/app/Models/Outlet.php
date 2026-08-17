<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'address', 'latitude', 'longitude', 'radius_meters', 'is_active'])]
class Outlet extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'radius_meters' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function staff(): HasMany
    {
        return $this->hasMany(User::class)->where('role', 'staff');
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    public function qrCodes(): HasMany
    {
        return $this->hasMany(OutletQrCode::class);
    }

    public function checkpoints(): HasMany
    {
        return $this->hasMany(Checkpoint::class);
    }

    public function visitors(): HasMany
    {
        return $this->hasMany(Visitor::class);
    }
}
