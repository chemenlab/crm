<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Models\User;
use App\Services\SupportTicketService;
use App\Services\SupportNotificationService;
use App\Services\SupportExportService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupportTicketController extends Controller
{
    public function __construct(
        private SupportTicketService $ticketService,
        private SupportNotificationService $notificationService,
        private SupportExportService $exportService
    ) {}

    /**
     * Список всех тикетов
     */
    public function index(Request $request)
    {
        $query = SupportTicket::with(['user', 'assignedAdmin', 'messages']);

        // Фильтр "Мои тикеты"
        if ($request->has('my_tickets') && $request->my_tickets) {
            $query->where('assigned_admin_id', $request->user()->id);
        }

        // Фильтрация по статусу
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Фильтрация по приоритету
        if ($request->has('priority') && $request->priority !== 'all') {
            $query->where('priority', $request->priority);
        }

        // Фильтрация по категории
        if ($request->has('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        // Фильтрация по пользователю
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Фильтрация по назначенному администратору
        if ($request->has('assigned_admin_id')) {
            $query->where('assigned_admin_id', $request->assigned_admin_id);
        }

        // Поиск
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('ticket_number', 'like', "%{$search}%")
                    ->orWhere('subject', 'like', "%{$search}%");
            });
        }

        // Сортировка
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $tickets = $query->paginate(20);

        // Получаем список администраторов для фильтра
        $admins = \App\Models\Administrator::select('id', 'name')->get();

        return Inertia::render('Admin/Support/Index', [
            'tickets' => $tickets,
            'admins' => $admins,
            'filters' => $request->only([
                'status',
                'priority',
                'category',
                'user_id',
                'assigned_admin_id',
                'my_tickets',
                'search',
                'sort_by',
                'sort_order',
            ]),
        ]);
    }

    /**
     * Просмотр тикета
     */
    public function show(SupportTicket $ticket)
    {
        $ticket->load([
            'user.currentSubscription.plan',
            'assignedAdmin',
            'messages.author',
            'messages.attachments',
        ]);

        // Получаем список администраторов для назначения
        $admins = \App\Models\Administrator::select('id', 'name')->get();

        return Inertia::render('Admin/Support/Show', [
            'ticket' => $ticket,
            'admins' => $admins,
        ]);
    }

    /**
     * Изменение статуса
     */
    public function updateStatus(Request $request, SupportTicket $ticket)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:new,in_progress,waiting_for_user,resolved,closed',
            'resolution_summary' => 'nullable|string',
        ]);

        try {
            $admin = auth('admin')->user();
            
            $this->ticketService->changeStatus(
                $ticket,
                $validated['status'],
                $admin,
                $validated['resolution_summary'] ?? null
            );

            // Отправляем уведомление пользователю
            $this->notificationService->notifyUserStatusChange($ticket);

            return back()->with('success', 'Статус тикета обновлен.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Не удалось обновить статус.']);
        }
    }

    /**
     * Изменение приоритета
     */
    public function updatePriority(Request $request, SupportTicket $ticket)
    {
        $validated = $request->validate([
            'priority' => 'required|string|in:low,medium,high,critical',
        ]);

        try {
            $ticket->update(['priority' => $validated['priority']]);

            return back()->with('success', 'Приоритет тикета обновлен.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Не удалось обновить приоритет.']);
        }
    }

    /**
     * Назначение администратора
     */
    public function assign(Request $request, SupportTicket $ticket)
    {
        $validated = $request->validate([
            'admin_id' => 'required|exists:administrators,id',
        ]);

        try {
            $admin = \App\Models\Administrator::findOrFail($validated['admin_id']);
            $this->ticketService->assignTicket($ticket, $admin);

            // Отправляем уведомление администратору
            $this->notificationService->notifyAdminAssigned($ticket, $admin);

            return back()->with('success', 'Тикет назначен администратору.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Не удалось назначить тикет.']);
        }
    }

    /**
     * Экспорт тикетов
     */
    public function export(Request $request)
    {
        $filters = $request->only([
            'status',
            'priority',
            'category',
            'user_id',
            'assigned_admin_id',
            'date_from',
            'date_to',
        ]);

        $format = $request->get('format', 'csv');

        try {
            return $this->exportService->exportTickets($filters, $format);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Не удалось экспортировать данные.']);
        }
    }
}
