<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['visitor_id', 'source', 'referrer', 'path', 'utm_source', 'ip_hash'])]
class WebsiteVisit extends Model
{
}
