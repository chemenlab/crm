<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentManagementController extends Controller
{
    public function index(Request $request)
    {
        $query = Payment::with(['user', 'subscription.plan'])
            ->orderBy('created_at', 'desc');

        // Фильтр по статусу
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Фильтр по методу оплаты
        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }

        // Фильтр по дате (от)
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        // Фильтр по дате (до)
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Поиск по пользователю (email или имя)
        if ($request->filled('search')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('email', 'like', "%{$request->search}%");
            });
        }

        $payments = $query->paginate(20);

        // Статистика
        $stats = [
            'total_amount' => Payment::succeeded()->sum('amount'),
            'total_count' => Payment::count(),
            'succeeded_count' => Payment::succeeded()->count(),
            'pending_count' => Payment::pending()->count(),
            'failed_count' => Payment::failed()->count(),
        ];

        return Inertia::render('Admin/Payments/Index', [
            'payments' => $payments,
            'stats' => $stats,
            'filters' => $request->only(['status', 'payment_method', 'date_from', 'date_to', 'search']),
        ]);
    }

    public function show(Payment $payment)
    {
        $payment->load(['user', 'subscription.plan']);

        return Inertia::render('Admin/Payments/Show', [
            'payment' => $payment,
        ]);
    }
}
