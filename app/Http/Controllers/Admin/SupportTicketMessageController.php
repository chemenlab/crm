<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Services\SupportTicketService;
use App\Services\SupportNotificationService;
use Illuminate\Http\Request;

class SupportTicketMessageController extends Controller
{
    public function __construct(
        private SupportTicketService $ticketService,
        private SupportNotificationService $notificationService
    ) {}

    /**
     * Добавление обычного сообщения (публичного)
     */
    public function store(Request $request, SupportTicket $ticket)
    {
        $validated = $request->validate([
            'message' => 'required|string',
            'attachments.*' => 'nullable|file|max:10240|mimes:jpg,jpeg,png,pdf,txt,log',
        ]);

        try {
            $admin = auth('admin')->user();
            
            $message = $this->ticketService->addMessage(
                $ticket,
                $validated['message'],
                $admin,
                false, // не внутренняя заметка
                $request->file('attachments', [])
            );

            // Отправляем уведомление пользователю
            $this->notificationService->notifyUserNewMessage($ticket, $message);

            return back()->with('success', 'Сообщение отправлено.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Не удалось отправить сообщение.']);
        }
    }

    /**
     * Добавление внутренней заметки
     */
    public function storeInternal(Request $request, SupportTicket $ticket)
    {
        $validated = $request->validate([
            'message' => 'required|string',
            'attachments.*' => 'nullable|file|max:10240|mimes:jpg,jpeg,png,pdf,txt,log',
        ]);

        try {
            $admin = auth('admin')->user();
            
            $message = $this->ticketService->addMessage(
                $ticket,
                $validated['message'],
                $admin,
                true, // внутренняя заметка
                $request->file('attachments', [])
            );

            // Внутренние заметки не отправляют уведомления пользователю

            return back()->with('success', 'Внутренняя заметка добавлена.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Не удалось добавить заметку.']);
        }
    }
}
