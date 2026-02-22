<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\PromoCode;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        // Статистика по подпискам
        $subscriptionStats = [
            'total' => Subscription::count(),
            'active' => Subscription::where('status', 'active')->count(),
            'trial' => Subscription::where('status', 'trial')->count(),
            'cancelled' => Subscription::where('status', 'cancelled')->count(),
            'expired' => Subscription::where('status', 'expired')->count(),
        ];

        // Статистика по платежам за последние 30 дней
        $paymentStats = Payment::where('created_at', '>', now()->subDays(30))
            ->where('status', 'succeeded')
            ->selectRaw('
                COUNT(*) as total_payments,
                COALESCE(SUM(amount), 0) as total_revenue,
                COALESCE(AVG(amount), 0) as average_payment
            ')
            ->first();

        // MRR (Monthly Recurring Revenue)
        $mrr = Subscription::whereIn('status', ['active', 'trial'])
            ->join('subscription_plans', 'subscriptions.subscription_plan_id', '=', 'subscription_plans.id')
            ->where('subscription_plans.billing_period', 'monthly')
            ->sum('subscription_plans.price');

        // Новые пользователи за последние 30 дней
        $newUsers = User::where('created_at', '>', now()->subDays(30))->count();

        // Активные промокоды
        $activePromoCodes = PromoCode::where('is_active', true)
            ->where(function ($query) {
                $query->whereNull('valid_until')
                    ->orWhere('valid_until', '>', now());
            })
            ->count();

        // График платежей за последние 30 дней
        $paymentsChart = Payment::where('created_at', '>', now()->subDays(30))
            ->where('status', 'succeeded')
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count, SUM(amount) as amount')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return Inertia::render('Admin/Dashboard', [
            'subscriptionStats' => $subscriptionStats,
            'paymentStats' => [
                'total_payments' => $paymentStats->total_payments ?? 0,
                'total_revenue' => $paymentStats->total_revenue ?? 0,
                'average_payment' => $paymentStats->average_payment ?? 0,
            ],
            'mrr' => $mrr,
            'newUsers' => $newUsers,
            'activePromoCodes' => $activePromoCodes,
            'paymentsChart' => $paymentsChart,
        ]);
    }
}
