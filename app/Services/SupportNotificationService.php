<?php

namespace App\Services;

use App\Models\SupportTicket;
use App\Models\SupportTicketMessage;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

class SupportNotificationService
{
    /**
     * Уведомить администраторов о новом тикете
     */
    public function notifyAdminsNewTicket(SupportTicket $ticket): void
    {
        try {
            $admins = User::where('role', 'admin')->get();

            foreach ($admins as $admin) {
                // TODO: Отправить email уведомление
                // Mail::to($admin->email)->send(new NewSupportTicketNotification($ticket));
            }
        } catch (\Exception $e) {
            \Log::error('Failed to notify admins about new ticket', [
                'error' => $e->getMessage(),
                'ticket_id' => $ticket->id,
            ]);
            // Не прерываем основной процесс
        }
    }

    /**
     * Уведомить пользователя о новом сообщении
     */
    public function notifyUserNewMessage(SupportTicket $ticket, SupportTicketMessage $message): void
    {
        try {
            // Не отправляем уведомление, если сообщение от самого пользователя
            if ($message->user_id === $ticket->user_id) {
                return;
            }

            // TODO: Отправить email уведомление
            // Mail::to($ticket->user->email)->send(new NewSupportMessageNotification($ticket, $message));
        } catch (\Exception $e) {
            \Log::error('Failed to notify user about new message', [
                'error' => $e->getMessage(),
                'ticket_id' => $ticket->id,
                'message_id' => $message->id,
            ]);
            // Не прерываем основной процесс
        }
    }

    /**
     * Уведомить администратора о новом сообщении
     */
    public function notifyAdminNewMessage(SupportTicket $ticket, SupportTicketMessage $message): void
    {
        try {
            // Уведомляем назначенного администратора
            if ($ticket->assigned_admin_id && $message->user_id !== $ticket->assigned_admin_id) {
                // TODO: Отправить email уведомление
                // Mail::to($ticket->assignedAdmin->email)->send(new NewSupportMessageNotification($ticket, $message));
            }
        } catch (\Exception $e) {
            \Log::error('Failed to notify admin about new message', [
                'error' => $e->getMessage(),
                'ticket_id' => $ticket->id,
                'message_id' => $message->id,
            ]);
            // Не прерываем основной процесс
        }
    }

    /**
     * Уведомить пользователя об изменении статуса
     */
    public function notifyUserStatusChange(SupportTicket $ticket): void
    {
        try {
            // TODO: Отправить email уведомление
            // Mail::to($ticket->user->email)->send(new SupportTicketStatusChangedNotification($ticket));
        } catch (\Exception $e) {
            \Log::error('Failed to notify user about status change', [
                'error' => $e->getMessage(),
                'ticket_id' => $ticket->id,
            ]);
            // Не прерываем основной процесс
        }
    }

    /**
     * Уведомить администратора о назначении
     */
    public function notifyAdminAssigned(SupportTicket $ticket, User $admin): void
    {
        try {
            // TODO: Отправить email уведомление
            // Mail::to($admin->email)->send(new SupportTicketAssignedNotification($ticket));
        } catch (\Exception $e) {
            \Log::error('Failed to notify admin about assignment', [
                'error' => $e->getMessage(),
                'ticket_id' => $ticket->id,
                'admin_id' => $admin->id,
            ]);
            // Не прерываем основной процесс
        }
    }
}
