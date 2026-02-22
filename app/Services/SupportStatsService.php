<?php

namespace App\Services;

use App\Models\SupportTicket;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class SupportStatsService
{
    /**
     * Получить глобальную статистику
     */
    public function getGlobalStats(): array
    {
        try {
            return [
                'total' => SupportTicket::count(),
                'new' => SupportTicket::where('status', 'new')->count(),
                'in_progress' => SupportTicket::where('status', 'in_progress')->count(),
                'waiting_for_user' => SupportTicket::where('status', 'waiting_for_user')->count(),
                'resolved' => SupportTicket::where('status', 'resolved')->count(),
                'closed' => SupportTicket::where('status', 'closed')->count(),
                'average_rating' => $this->getAverageRating(),
                'by_category' => $this->getTicketsByCategory(),
                'by_priority' => $this->getTicketsByPriority(),
            ];
        } catch (\Exception $e) {
            \Log::error('Failed to get global stats', [
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }

    /**
     * Получить статистику по администратору
     */
    public function getAdminStats(User $admin): array
    {
        try {
            return [
                'total_assigned' => SupportTicket::where('assigned_admin_id', $admin->id)->count(),
                'active' => SupportTicket::where('assigned_admin_id', $admin->id)
                    ->whereIn('status', ['new', 'in_progress', 'waiting_for_user'])
                    ->count(),
                'resolved' => SupportTicket::where('assigned_admin_id', $admin->id)
                    ->where('status', 'resolved')
                    ->count(),
                'closed' => SupportTicket::where('assigned_admin_id', $admin->id)
                    ->where('status', 'closed')
                    ->count(),
                'average_rating' => SupportTicket::where('assigned_admin_id', $admin->id)
                    ->whereNotNull('rating')
                    ->avg('rating'),
            ];
        } catch (\Exception $e) {
            \Log::error('Failed to get admin stats', [
                'error' => $e->getMessage(),
                'admin_id' => $admin->id,
            ]);
            return [];
        }
    }

    /**
     * Получить среднюю оценку
     */
    public function getAverageRating(): ?float
    {
        try {
            return SupportTicket::whereNotNull('rating')->avg('rating');
        } catch (\Exception $e) {
            \Log::error('Failed to get average rating', [
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Получить тикеты по категориям
     */
    public function getTicketsByCategory(): array
    {
        try {
            return SupportTicket::select('category', DB::raw('count(*) as count'))
                ->groupBy('category')
                ->pluck('count', 'category')
                ->toArray();
        } catch (\Exception $e) {
            \Log::error('Failed to get tickets by category', [
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }

    /**
     * Получить тикеты по приоритетам
     */
    public function getTicketsByPriority(): array
    {
        try {
            return SupportTicket::select('priority', DB::raw('count(*) as count'))
                ->groupBy('priority')
                ->pluck('count', 'priority')
                ->toArray();
        } catch (\Exception $e) {
            \Log::error('Failed to get tickets by priority', [
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }

    /**
     * Получить тикеты по администраторам
     */
    public function getTicketsByAdmin(): array
    {
        try {
            return SupportTicket::select('assigned_admin_id', DB::raw('count(*) as count'))
                ->whereNotNull('assigned_admin_id')
                ->groupBy('assigned_admin_id')
                ->with('assignedAdmin:id,name')
                ->get()
                ->mapWithKeys(function ($item) {
                    return [$item->assignedAdmin->name ?? 'Unknown' => $item->count];
                })
                ->toArray();
        } catch (\Exception $e) {
            \Log::error('Failed to get tickets by admin', [
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }
}
