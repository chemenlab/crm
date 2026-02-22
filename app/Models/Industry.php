<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Industry extends Model
{
    protected $guarded = [];
    public function fields()
    {
        return $this->hasMany(IndustryField::class)->orderBy('sort_order');
    }
}
