<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServicePresetOption extends Model
{
    protected $guarded = [];

    public function preset()
    {
        return $this->belongsTo(ServicePreset::class, 'service_preset_id');
    }
}
