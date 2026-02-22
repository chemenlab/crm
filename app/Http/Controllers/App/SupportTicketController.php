<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Services\SupportTicketService;
use App\Services\SupportNotificationService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupportTicketController extends Controller
{
    public function __construct(
        private SupportTicketService $ticketService,
        private SupportNotificationService $notificationService
    ) {}

    /**
     * Список тикетов пользователя
     */
    public function index(Request $request)
    {
        $query = SupportTicket::where('user_id', $request->user()->id)
            ->with(['messages', 'assignedAdmin']);

        // Фильтрация по статусу
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Сортировка
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $tickets = $query->paginate(15);

        // Добавляем информацию о непрочитанных сообщениях для каждого тикета
        $tickets->getCollection()->transform(function ($ticket) {
            $ticket->has_unread = $ticket->hasUnreadMessages();
            return $ticket;
        });

        return Inertia::render('App/Support/Index', [
            'tickets' => $tickets,
            'filters' => [
                'status' => $request->get('status', 'all'),
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
            ],
        ]);
    }

    /**
     * Форма создания тикета
     */
    public function create()
    {
        return Inertia::render('App/Support/Create');
    }

    /**
     * Создание тикета
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'category' => 'required|string|in:technical,billing,feature_request,other',
            'priority' => 'required|string|in:low,medium,high,critical',
            'message' => 'required|string',
            'attachments.*' => 'nullable|file|max:10240|mimes:jpg,jpeg,png,pdf,txt,log',
        ]);

        try {
            $ticket = $this->ticketService->createTicket($validated, $request->user());

            // Отправляем уведомления администраторам
            $this->notificationService->notifyAdminsNewTicket($ticket);

            return redirect()->route('app.support.show', $ticket->id)
                ->with('success', 'Тикет успешно создан. Мы свяжемся с вами в ближайшее время.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Не удалось создать тикет. Попробуйте позже.']);
        }
    }

    /**
     * Просмотр тикета
     */
    public function show(Request $request, SupportTicket $ticket)
    {
        // Проверяем, что тикет принадлежит пользователю
        if ($ticket->user_id !== $request->user()->id) {
            abort(403);
        }

        // Обновляем время последнего просмотра
        $ticket->update(['last_viewed_by_user_at' => now()]);

        $ticket->load([
            'user',
            'assignedAdmin',
            'publicMessages.author',
            'publicMessages.attachments',
        ]);

        return Inertia::render('App/Support/Show', [
            'ticket' => $ticket,
        ]);
    }

    /**
     * Закрытие тикета
     */
    public function close(Request $request, SupportTicket $ticket)
    {
        // Проверяем, что тикет принадлежит пользователю
        if ($ticket->user_id !== $request->user()->id) {
            abort(403);
        }

        try {
            $this->ticketService->closeTicket($ticket, $request->user());

            return back()->with('success', 'Тикет закрыт.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Не удалось закрыть тикет.']);
        }
    }

    /**
     * Переоткрытие тикета
     */
    public function reopen(Request $request, SupportTicket $ticket)
    {
        // Проверяем, что тикет принадлежит пользователю
        if ($ticket->user_id !== $request->user()->id) {
            abort(403);
        }

        try {
            $this->ticketService->reopenTicket($ticket, $request->user());

            return back()->with('success', 'Тикет переоткрыт.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Не удалось переоткрыть тикет.']);
        }
    }

    /**
     * Оценка качества поддержки
     */
    public function rate(Request $request, SupportTicket $ticket)
    {
        // Проверяем, что тикет принадлежит пользователю
        if ($ticket->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        try {
            $this->ticketService->rateTicket(
                $ticket,
                $validated['rating'],
                $validated['comment'] ?? null
            );

            return back()->with('success', 'Спасибо за вашу оценку!');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Не удалось сохранить оценку.']);
        }
    }
}

