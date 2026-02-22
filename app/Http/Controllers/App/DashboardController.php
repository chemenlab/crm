<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Services\Subscription\UsageLimitService;
use Illuminate\Http\Request; // Ensure Request is imported
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Display the dashboard.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Redirect to onboarding if not completed
        if (!$user->onboarding_completed) {
            return redirect()->route('onboarding.index');
        }

        $startOfMonth = now()->startOfMonth();
        $endOfMonth = now()->endOfMonth();


        // 1. Stats Cards Data
        $appointmentsToday = $user->appointments()
            ->whereDate('start_time', today())
            ->count();

        $incomeMonth = $user->transactions()
            ->where('type', 'income')
            ->whereBetween('date', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        // Calculate growth for income (vs last month)
        $startOfLastMonth = now()->subMonth()->startOfMonth();
        $endOfLastMonth = now()->subMonth()->endOfMonth();
        $incomeLastMonth = $user->transactions()
            ->where('type', 'income')
            ->whereBetween('date', [$startOfLastMonth, $endOfLastMonth])
            ->sum('amount');

        $incomeGrowth = $incomeLastMonth > 0
            ? round((($incomeMonth - $incomeLastMonth) / $incomeLastMonth) * 100, 1)
            : 0;

        $newClientsMonth = $user->clients()
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->count();

        $pendingAppointments = $user->appointments()
            ->where('status', 'pending') // Assuming 'pending' status exists, otherwise use 'scheduled' without confirmation
            ->count();

        // 2. Chart Data (Revenue per day for last 30 days)
        $revenueChart = $user->transactions()
            ->where('type', 'income')
            ->where('date', '>=', now()->subDays(30))
            ->selectRaw('DATE(date) as date, SUM(amount) as revenue')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->date->format('Y-m-d'),
                    'revenue' => (float) $item->revenue,
                ];
            });

        // 3. Upcoming Appointments (Next 5)
        $userTimezone = $user->timezone ?? 'UTC';
        $upcomingAppointments = $user->appointments()
            ->with(['client', 'service'])
            ->where('start_time', '>=', now())
            ->whereIn('status', ['scheduled', 'confirmed', 'pending'])
            ->orderBy('start_time')
            ->take(5)
            ->get()
            ->map(function ($app) use ($userTimezone) {
                $startTime = $app->start_time->copy()->setTimezone($userTimezone);
                return [
                    'id' => $app->id,
                    'client_name' => $app->client ? $app->client->name : 'Unknown',
                    'service_name' => $app->service ? $app->service->name : 'Service',
                    'start_time' => $startTime->format('H:i'),
                    'date' => $startTime->format('d.m.Y'),
                    'status' => $app->status,
                ];
            });

        // 4. Recent Applications/Bookings (Last 10)
        $recentAppointments = $user->appointments()
            ->with(['client', 'service'])
            ->orderByDesc('created_at')
            ->take(5)
            ->get()
            ->map(function ($app) use ($userTimezone) {
                $startTime = $app->start_time->copy()->setTimezone($userTimezone);
                return [
                    'id' => $app->id,
                    'service_name' => $app->service ? $app->service->name : 'Услуга',
                    'client_name' => $app->client ? $app->client->name : 'Клиент',
                    'status' => $app->status,
                    'price' => $app->price,
                    'date_formatted' => $startTime->format('d.m H:i'),
                ];
            });

        $incomeToday = $user->transactions()
            ->where('type', 'income')
            ->whereDate('date', today())
            ->sum('amount');

        // Tax Estimate (Default 4% or from user settings)
        // Assuming we'll add 'tax_rate' to user or settings later
        $taxRate = $user->tax_rate ?? 4;
        $taxEstimate = ($incomeMonth * $taxRate) / 100;

        // 5. Occupancy Data for Calendar
        $occupancyData = $user->appointments()
            ->whereBetween('start_time', [$startOfMonth, $endOfMonth])
            ->selectRaw('DATE(start_time) as date, COUNT(*) as count')
            ->groupBy('date')
            ->get()
            ->mapWithKeys(function ($item) {
                // Determine occupancy level
                $count = $item->count;
                $level = 'low';
                if ($count >= 5)
                    $level = 'high';
                else if ($count >= 3)
                    $level = 'medium';

                return [
                    $item->date => [
                        'count' => $count,
                        'level' => $level,
                    ]
                ];
            });

        // 6. Subscription Info
        $subscription = $user->currentSubscription?->load('plan');
        $usageStats = null;
        
        if ($subscription) {
            $usageLimitService = app(UsageLimitService::class);
            $usageStats = $usageLimitService->getAllUsageStats($user);
        }

        return Inertia::render('App/Dashboard', [
            'onboarding_completed' => $user->onboarding_completed,
            'stats' => [
                'appointments_today' => $appointmentsToday,
                'income_today' => $incomeToday, // New
                'income_month' => $incomeMonth,
                'income_growth' => $incomeGrowth,
                'tax_estimate' => $taxEstimate, // New
                'new_clients' => $newClientsMonth,
                'pending_appointments' => $pendingAppointments,
            ],
            'chart_data' => $revenueChart,
            'occupancy' => $occupancyData,
            'upcoming' => $upcomingAppointments,
            'recent' => $recentAppointments,
            'monthly_goal' => $user->monthly_goal,
            'subscription' => $subscription,
            'usage_stats' => $usageStats,
        ]);
    }

    /**
     * Get appointments for a specific date (API).
     */
    public function getAppointmentsByDate(Request $request)
    {
        $request->validate([
            'date' => 'required|date_format:Y-m-d',
        ]);

        $user = $request->user();
        $userTimezone = $user->timezone ?? 'UTC';
        $date = $request->input('date');

        $appointments = $user->appointments()
            ->with(['client', 'service'])
            ->whereDate('start_time', $date)
            ->orderBy('start_time')
            ->get()
            ->map(function ($app) use ($userTimezone) {
                $startTime = $app->start_time->copy()->setTimezone($userTimezone);
                $endTime = $app->end_time->copy()->setTimezone($userTimezone);
                return [
                    'id' => $app->id,
                    'start_time' => $startTime->format('H:i'),
                    'end_time' => $endTime->format('H:i'),
                    'client_name' => $app->client ? $app->client->name : 'Unknown',
                    'service_name' => $app->service ? $app->service->name : 'Deleted Service',
                    'status' => $app->status,
                    'price' => $app->price,
                    // Format price nicely
                    'price_formatted' => number_format($app->price, 0, '.', ' ') . ' ₽',
                    'client_phone' => $app->client ? $app->client->phone : null,
                ];
            });

        return response()->json([
            'date' => Carbon::parse($date)->format('d.m.Y'),
            'appointments' => $appointments,
        ]);
    }
}
