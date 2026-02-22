<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserField extends Model
{
    protected $guarded = [];

    protected $casts = [
        'options' => 'array',
        'is_required' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
