<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomField extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'type',
        'is_required',
        'is_public',
        'options',
        'order',
        'allow_multiple',
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'is_public' => 'boolean',
        'allow_multiple' => 'boolean',
        'options' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
