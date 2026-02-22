<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentController extends Controller
{
    /**
     * Show payment history
     */
    public function index()
    {
        $payments = auth()->user()
            ->payments()
            ->with('subscription.plan')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('App/Payments/Index', [
            'payments' => $payments,
        ]);
    }

    /**
     * Show payment details
     */
    public function show(Payment $payment)
    {
        $this->authorize('view', $payment);

        $payment->load('subscription.plan');

        return Inertia::render('App/Payments/Show', [
            'payment' => $payment,
        ]);
    }

    /**
     * Download payment receipt
     */
    public function receipt(Payment $payment)
    {
        $this->authorize('view', $payment);

        if (!$payment->isSucceeded()) {
            return back()->withErrors(['error' => 'Квитанция доступна только для успешных платежей']);
        }

        // TODO: Генерация PDF квитанции
        return back()->with('info', 'Функция генерации квитанций будет доступна в ближайшее время');
    }
}
