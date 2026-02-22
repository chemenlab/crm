<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppointmentMeta extends Model
{
    protected $table = 'appointment_meta'; // Laravel might guess appointment_metas
    protected $guarded = [];

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function userField()
    {
        return $this->belongsTo(UserField::class, 'user_field_id');
    }

    public function customField()
    {
        return $this->belongsTo(CustomField::class, 'user_field_id');
    }

    /**
     * Get the field (either custom_field or user_field)
     */
    public function getFieldAttribute()
    {
        return $this->customField ?? $this->userField;
    }
}
