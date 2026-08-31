<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['visitor_id', 'source', 'referrer', 'path', 'utm_source', 'ip', 'latitude', 'longitude', 'city', 'ip_hash'])]
class WebsiteVisit extends Model
{
    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
        ];
    }
}
