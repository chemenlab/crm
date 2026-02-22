<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TransactionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Get selected month and year from request, default to current
        $selectedMonth = (int) $request->input('month', now()->month);
        $selectedYear = (int) $request->input('year', now()->year);

        // Create date range for selected month
        $startOfMonth = now()->setDate($selectedYear, $selectedMonth, 1)->startOfMonth();
        $endOfMonth = now()->setDate($selectedYear, $selectedMonth, 1)->endOfMonth();
        $startOfYear = now()->setDate($selectedYear, 1, 1)->startOfYear();
        $endOfYear = now()->setDate($selectedYear, 12, 31)->endOfYear();

        $transactions = $request->user()->transactions()
            ->with('client')
            ->whereBetween('date', [$startOfMonth, $endOfMonth])
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(50)
            ->withQueryString();

        // Monthly stats for selected month
        $monthlyStats = $request->user()->transactions()
            ->whereBetween('date', [$startOfMonth, $endOfMonth])
            ->select(
                DB::raw('SUM(CASE WHEN type = "income" THEN amount ELSE 0 END) as income'),
                DB::raw('SUM(CASE WHEN type = "expense" THEN amount ELSE 0 END) as expense'),
                DB::raw('SUM(CASE WHEN type = "income" AND payment_method = "card" THEN amount ELSE 0 END) as income_card'),
                DB::raw('SUM(CASE WHEN type = "income" AND payment_method = "cash" THEN amount ELSE 0 END) as income_cash'),
                DB::raw('COUNT(DISTINCT CASE WHEN type = "income" THEN DATE(date) END) as income_days')
            )
            ->first();

        // Yearly stats
        $yearlyStats = $request->user()->transactions()
            ->whereBetween('date', [$startOfYear, $endOfYear])
            ->select(
                DB::raw('SUM(CASE WHEN type = "income" THEN amount ELSE 0 END) as income'),
                DB::raw('SUM(CASE WHEN type = "expense" THEN amount ELSE 0 END) as expense'),
                DB::raw('COUNT(DISTINCT CASE WHEN type = "income" THEN DATE(date) END) as income_days')
            )
            ->first();

        // Count appointments from transactions
        $monthlyAppointments = $request->user()->transactions()
            ->whereBetween('date', [$startOfMonth, $endOfMonth])
            ->where('type', 'income')
            ->whereNotNull('appointment_id')
            ->distinct('appointment_id')
            ->count('appointment_id');

        $yearlyAppointments = $request->user()->transactions()
            ->whereBetween('date', [$startOfYear, $endOfYear])
            ->where('type', 'income')
            ->whereNotNull('appointment_id')
            ->distinct('appointment_id')
            ->count('appointment_id');

        // Top 10 clients by revenue (all time)
        $topClients = $request->user()->transactions()
            ->where('type', 'income')
            ->whereNotNull('client_id')
            ->with('client:id,name,phone')
            ->select(
                'client_id',
                DB::raw('SUM(amount) as total_revenue'),
                DB::raw('COUNT(*) as transactions_count')
            )
            ->groupBy('client_id')
            ->orderByDesc('total_revenue')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'client' => $item->client,
                    'total_revenue' => $item->total_revenue,
                    'transactions_count' => $item->transactions_count,
                ];
            });

        // Get monthly breakdown by category for selected month
        $categoryBreakdown = $request->user()->transactions()
            ->whereBetween('date', [$startOfMonth, $endOfMonth])
            ->select(
                'category',
                'type',
                DB::raw('SUM(amount) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('category', 'type')
            ->orderByDesc('total')
            ->get();

        $monthlyIncome = $monthlyStats->income ?? 0;
        $monthlyExpense = $monthlyStats->expense ?? 0;
        $monthlyProfit = $monthlyIncome - $monthlyExpense;

        $yearlyIncome = $yearlyStats->income ?? 0;
        $yearlyExpense = $yearlyStats->expense ?? 0;
        $yearlyProfit = $yearlyIncome - $yearlyExpense;

        // Generate list of available months (last 24 months)
        $availableMonths = collect();
        for ($i = 23; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $availableMonths->push([
                'month' => $date->month,
                'year' => $date->year,
                'label' => $date->translatedFormat('F Y'),
            ]);
        }

        return Inertia::render('App/Finance/Index', [
            'transactions' => $transactions,
            'stats' => [
                // Monthly
                'income' => $monthlyIncome,
                'expense' => $monthlyExpense,
                'profit' => $monthlyProfit,
                'income_card' => $monthlyStats->income_card ?? 0,
                'income_cash' => $monthlyStats->income_cash ?? 0,
                'appointments_count' => $monthlyAppointments,

                // Yearly
                'year_income' => $yearlyIncome,
                'year_expense' => $yearlyExpense,
                'year_profit' => $yearlyProfit,
                'year_appointments_count' => $yearlyAppointments,
            ],
            'categoryBreakdown' => $categoryBreakdown,
            'topClients' => $topClients,
            'clients' => $request->user()->clients()->orderBy('name')->get(['id', 'name']),
            'monthlyGoal' => $request->user()->monthly_goal,
            'selectedMonth' => (int) $selectedMonth,
            'selectedYear' => (int) $selectedYear,
            'availableMonths' => $availableMonths,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:income,expense',
            'amount' => 'required|numeric|min:0',
            'category' => 'required|string|max:255',
            'date' => 'required|date',
            'client_id' => 'nullable|exists:clients,id',
            'description' => 'nullable|string',
        ]);

        $request->user()->transactions()->create($validated);

        return redirect()->back();
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Transaction $transaction)
    {
        $this->authorize('update', $transaction);

        $validated = $request->validate([
            'type' => 'required|in:income,expense',
            'amount' => 'required|numeric|min:0',
            'category' => 'required|string|max:255',
            'date' => 'required|date',
            'client_id' => 'nullable|exists:clients,id',
            'description' => 'nullable|string',
        ]);

        $transaction->update($validated);

        return redirect()->back();
    }

    /**
     * Update the user's monthly goal.
     */
    public function updateGoal(Request $request)
    {
        $validated = $request->validate([
            'monthly_goal' => 'required|numeric|min:0|max:99999999.99',
        ]);

        $request->user()->update([
            'monthly_goal' => $validated['monthly_goal'] > 0 ? $validated['monthly_goal'] : null,
        ]);

        return redirect()->back()->with('success', 'Цель на месяц обновлена');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, $id)
    {
        $transaction = Transaction::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $transaction->delete();

        return back()->with('success', 'Операция успешно удалена');
    }
}
