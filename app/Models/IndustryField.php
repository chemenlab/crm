<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IndustryField extends Model
{
    protected $guarded = [];

    protected $casts = [
        'options' => 'array',
        'is_required' => 'boolean',
    ];

    public function industry()
    {
        return $this->belongsTo(Industry::class);
    }
}
