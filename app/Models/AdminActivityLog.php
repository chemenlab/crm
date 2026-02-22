<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdminActivityLog extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $table = 'admin_activity_log';

    protected $fillable = [
        'administrator_id',
        'action',
        'target_type',
        'target_id',
        'changes',
        'description',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    protected $casts = [
        'changes' => 'array',
        'created_at' => 'datetime',
    ];

    // Relationships
    public function administrator()
    {
        return $this->belongsTo(Administrator::class);
    }

    // Статический метод для логирования действий
    public static function log(
        int $administratorId,
        string $action,
        ?string $targetType = null,
        ?int $targetId = null,
        ?array $changes = null,
        ?string $description = null
    ): void {
        self::create([
            'administrator_id' => $administratorId,
            'action' => $action,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'changes' => $changes,
            'description' => $description,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'created_at' => now(),
        ]);
    }

    // Scope для фильтрации по действиям
    public function scopeAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    public function scopeByAdministrator($query, int $administratorId)
    {
        return $query->where('administrator_id', $administratorId);
    }

    public function scopeRecent($query, int $days = 30)
    {
        return $query->where('created_at', '>', now()->subDays($days));
    }
}
