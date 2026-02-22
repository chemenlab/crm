<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClientTag extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'color',
        'description',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function clients()
    {
        return $this->belongsToMany(Client::class);
    }
}
