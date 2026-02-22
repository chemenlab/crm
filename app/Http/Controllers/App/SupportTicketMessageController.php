<?php

namespace App\Http\Controllers\App;

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
     * Добавление сообщения в тикет
     */
    public function store(Request $request, SupportTicket $ticket)
    {
        // Проверяем, что тикет принадлежит пользователю
        if ($ticket->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'message' => 'required|string',
            'attachments.*' => 'nullable|file|max:10240|mimes:jpg,jpeg,png,pdf,txt,log',
        ]);

        try {
            $message = $this->ticketService->addMessage(
                $ticket,
                $validated['message'],
                $request->user(),
                false, // не внутренняя заметка
                $request->file('attachments', [])
            );

            // Отправляем уведомление администратору
            $this->notificationService->notifyAdminNewMessage($ticket, $message);

            return back()->with('success', 'Сообщение отправлено.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Не удалось отправить сообщение.']);
        }
    }
}
