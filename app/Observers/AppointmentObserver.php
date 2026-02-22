<?php

namespace App\Observers;

use App\Models\Appointment;
use App\Models\Transaction;
use Illuminate\Support\Facades\Log;

class AppointmentObserver
{
    /**
     * Handle the Appointment "updated" event.
     * Creates income transaction when appointment is completed.
     */
    public function updated(Appointment $appointment): void
    {
        // Check if status changed to 'completed'
        if ($appointment->isDirty('status') && $appointment->status === 'completed') {
            $this->createIncomeTransaction($appointment);
        }
    }

    /**
     * Create income transaction for completed appointment.
     */
    protected function createIncomeTransaction(Appointment $appointment): void
    {
        // Check if transaction already exists for this appointment
        $existingTransaction = Transaction::where('appointment_id', $appointment->id)
            ->where('type', 'income')
            ->first();

        if ($existingTransaction) {
            Log::info('Transaction already exists for appointment', [
                'appointment_id' => $appointment->id,
                'transaction_id' => $existingTransaction->id,
            ]);
            return;
        }

        // Get service name for description
        $serviceName = $appointment->service?->name ?? 'Услуга';
        $clientName = $appointment->client?->name ?? 'Клиент';

        // Determine booking source for description
        $bookingSource = $appointment->created_at?->diffInMinutes($appointment->start_time) > 0 ? 'онлайн-запись' : 'запись';

        // Create income transaction
        $transaction = Transaction::create([
            'user_id' => $appointment->user_id,
            'client_id' => $appointment->client_id,
            'appointment_id' => $appointment->id,
            'type' => 'income',
            'amount' => $appointment->price,
            'payment_method' => $appointment->payment_method ?? 'cash',
            'source' => 'appointment',
            'category' => $serviceName,
            'date' => $appointment->start_time->toDateString(),
            'description' => "{$clientName} — {$bookingSource}",
            'is_taxable' => true,
            'tax_amount' => 0,
        ]);

        Log::info('Income transaction created for completed appointment', [
            'appointment_id' => $appointment->id,
            'transaction_id' => $transaction->id,
            'amount' => $transaction->amount,
        ]);
    }
}
