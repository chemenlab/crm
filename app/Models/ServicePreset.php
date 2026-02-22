<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServicePreset extends Model
{
    protected $guarded = [];
    public function options()
    {
        return $this->hasMany(ServicePresetOption::class);
    }
}
