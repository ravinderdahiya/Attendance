<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'type', 'message', 'read_at'])]
class ShiftNotification extends Model
{
    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function notify(int $userId, string $type, string $message): self
    {
        return self::create(['user_id' => $userId, 'type' => $type, 'message' => $message]);
    }
}
