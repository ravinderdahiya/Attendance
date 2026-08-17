<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

#[Fillable(['outlet_id', 'label', 'is_active'])]
class OutletQrCode extends Model
{
    protected static function booted(): void
    {
        static::creating(fn (OutletQrCode $code) => $code->token ??= Str::random(24));
    }

    protected function casts(): array
    {
        return [
            'last_scanned_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function regenerateToken(): string
    {
        $this->token = Str::random(24);
        $this->save();

        return $this->token;
    }

    public function recordScan(): void
    {
        $this->increment('scan_count');
        $this->update(['last_scanned_at' => now()]);
    }
}
