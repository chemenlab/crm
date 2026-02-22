<?php

namespace App\Modules\Leads\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Modules\Leads\Enums\LeadPriority;
use App\Modules\Leads\Enums\LeadStatus;
use App\Modules\Leads\Models\Lead;
use App\Modules\Leads\Models\LeadTodo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class LeadController extends Controller
{
    /**
     * Display leads in Kanban view
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $tab = $request->get('tab', 'kanban');
        $search = $request->get('search');
        $priorityFilter = $request->get('priority');
        $serviceFilter = $request->get('service_id');

        // Base query with filters
        $baseQuery = Lead::forUser($user->id)
            ->with([
                'service:id,name,color',
                'client:id,name',
                'todos' => fn($q) => $q->orderBy('is_completed')->orderBy('created_at'),
                'comments' => fn($q) => $q->with('user:id,name,avatar')->latest(),
            ]);

        if ($search) {
            $baseQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('message', 'like', "%{$search}%");
            });
        }

        if ($priorityFilter) {
            $baseQuery->where('priority', $priorityFilter);
        }

        if ($serviceFilter) {
            $baseQuery->where('service_id', $serviceFilter);
        }

        // Get leads for Kanban (new, in_progress, completed, cancelled)
        $kanbanStatuses = [LeadStatus::New, LeadStatus::InProgress, LeadStatus::Completed, LeadStatus::Cancelled];
        $kanbanLeads = (clone $baseQuery)
            ->whereIn('status', array_map(fn($s) => $s->value, $kanbanStatuses))
            ->ordered()
            ->get()
            ->groupBy(fn($lead) => $lead->status->value);

        // Prepare Kanban columns (4 columns: Новая, В работе, Завершена, Отменена)
        $columns = collect($kanbanStatuses)->map(fn($status) => [
            'id' => $status->value,
            'title' => $status->label(),
            'color' => $status->color(),
            'leads' => $kanbanLeads->get($status->value, collect())->values(),
        ]);

        // Get archived leads (only archived status)
        $archivedLeads = (clone $baseQuery)
            ->where('status', LeadStatus::Archived->value)
            ->latest()
            ->paginate(20, ['*'], 'archive_page');

        // Get all todos across all leads for the user
        $allTodos = LeadTodo::whereHas('lead', fn($q) => $q->where('user_id', $user->id))
            ->with(['lead:id,name,phone,service_id', 'lead.service:id,name'])
            ->orderBy('is_completed')
            ->orderBy('due_date')
            ->orderBy('created_at', 'desc')
            ->get();

        // Get stats
        $stats = [
            'total' => Lead::forUser($user->id)->count(),
            'new' => Lead::forUser($user->id)->withStatus(LeadStatus::New)->count(),
            'in_progress' => Lead::forUser($user->id)->withStatus(LeadStatus::InProgress)->count(),
            'completed' => Lead::forUser($user->id)->withStatus(LeadStatus::Completed)->count(),
            'cancelled' => Lead::forUser($user->id)->withStatus(LeadStatus::Cancelled)->count(),
            'archived' => Lead::forUser($user->id)->withStatus(LeadStatus::Archived)->count(),
            'urgent' => Lead::forUser($user->id)->where('priority', 'urgent')->whereIn('status', ['new', 'in_progress'])->count(),
            'with_reminders' => Lead::forUser($user->id)->whereNotNull('reminder_at')->where('reminder_at', '>=', now())->count(),
        ];

        // Get unique tags for filter
        $allTags = Lead::forUser($user->id)
            ->whereNotNull('tags')
            ->pluck('tags')
            ->flatten()
            ->unique()
            ->values();

        // Get services for filter
        $services = $user->services()
            ->where('booking_type', 'lead')
            ->select('id', 'name')
            ->get();

        return Inertia::render('Modules/Leads/Index', [
            'columns' => $columns,
            'archivedLeads' => $archivedLeads,
            'allTodos' => $allTodos,
            'stats' => $stats,
            'statuses' => LeadStatus::options(),
            'priorities' => LeadPriority::options(),
            'allTags' => $allTags,
            'services' => $services,
            'filters' => [
                'tab' => $tab,
                'search' => $search,
                'priority' => $priorityFilter,
                'service_id' => $serviceFilter,
            ],
        ]);
    }

    /**
     * Show lead details
     */
    public function show(Request $request, Lead $lead): Response
    {
        $this->authorizeAccess($request->user(), $lead);

        $lead->load([
            'service:id,name,color,price',
            'client:id,name,phone,email',
            'todos' => fn($q) => $q->orderBy('is_completed')->orderBy('created_at'),
            'comments' => fn($q) => $q->with('user:id,name,avatar')->latest(),
            'convertedAppointment:id,start_time,status',
        ]);

        return Inertia::render('Modules/Leads/Show', [
            'lead' => $lead,
            'statuses' => LeadStatus::options(),
        ]);
    }

    /**
     * Update lead status
     */
    public function updateStatus(Request $request, Lead $lead): RedirectResponse
    {
        $this->authorizeAccess($request->user(), $lead);

        $validated = $request->validate([
            'status' => 'required|string|in:' . implode(',', array_column(LeadStatus::cases(), 'value')),
        ]);

        $lead->update(['status' => $validated['status']]);

        return back()->with('success', 'Статус обновлён');
    }

    /**
     * Update lead position (for drag-and-drop)
     */
    public function updatePosition(Request $request, Lead $lead): RedirectResponse
    {
        $this->authorizeAccess($request->user(), $lead);

        $validated = $request->validate([
            'status' => 'required|string|in:' . implode(',', array_column(LeadStatus::cases(), 'value')),
            'position' => 'required|integer|min:0',
        ]);

        DB::transaction(function () use ($lead, $validated, $request) {
            $oldStatus = $lead->status->value;
            $newStatus = $validated['status'];
            $newPosition = $validated['position'];

            // If status changed, reorder both columns
            if ($oldStatus !== $newStatus) {
                // Decrease positions in old column
                Lead::forUser($request->user()->id)
                    ->where('status', $oldStatus)
                    ->where('position', '>', $lead->position)
                    ->decrement('position');

                // Increase positions in new column
                Lead::forUser($request->user()->id)
                    ->where('status', $newStatus)
                    ->where('position', '>=', $newPosition)
                    ->increment('position');
            } else {
                // Same column, reorder
                if ($newPosition > $lead->position) {
                    Lead::forUser($request->user()->id)
                        ->where('status', $newStatus)
                        ->where('position', '>', $lead->position)
                        ->where('position', '<=', $newPosition)
                        ->decrement('position');
                } else {
                    Lead::forUser($request->user()->id)
                        ->where('status', $newStatus)
                        ->where('position', '>=', $newPosition)
                        ->where('position', '<', $lead->position)
                        ->increment('position');
                }
            }

            $lead->update([
                'status' => $newStatus,
                'position' => $newPosition,
            ]);
        });

        return back();
    }

    /**
     * Convert lead to appointment
     */
    public function convert(Request $request, Lead $lead): RedirectResponse
    {
        $this->authorizeAccess($request->user(), $lead);

        if ($lead->isConverted()) {
            return back()->withErrors(['lead' => 'Заявка уже конвертирована']);
        }

        $validated = $request->validate([
            'start_time' => 'required|date|after:now',
            'end_time' => 'required|date|after:start_time',
            'notes' => 'nullable|string|max:1000',
        ]);

        $user = $request->user();

        // Find or create client
        $client = $user->clients()->firstOrCreate(
            ['phone' => $lead->phone],
            ['name' => $lead->name]
        );

        // Create appointment
        $appointment = $user->appointments()->create([
            'client_id' => $client->id,
            'service_id' => $lead->service_id,
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'price' => $lead->service->price ?? 0,
            'status' => 'scheduled',
            'notes' => $validated['notes'] ?? "Конвертировано из заявки #{$lead->id}",
        ]);

        // Update lead
        $lead->update([
            'status' => LeadStatus::Completed,
            'converted_appointment_id' => $appointment->id,
            'client_id' => $client->id,
        ]);

        return back()->with('success', 'Заявка конвертирована в запись');
    }

    /**
     * Delete a lead
     */
    public function destroy(Request $request, Lead $lead): RedirectResponse
    {
        $this->authorizeAccess($request->user(), $lead);

        $lead->delete();

        return back()->with('success', 'Заявка удалена');
    }

    /**
     * Update lead priority
     */
    public function updatePriority(Request $request, Lead $lead): RedirectResponse
    {
        $this->authorizeAccess($request->user(), $lead);

        $validated = $request->validate([
            'priority' => 'required|string|in:low,normal,high,urgent',
        ]);

        $lead->update(['priority' => $validated['priority']]);

        return back()->with('success', 'Приоритет обновлён');
    }

    /**
     * Update lead tags
     */
    public function updateTags(Request $request, Lead $lead): RedirectResponse
    {
        $this->authorizeAccess($request->user(), $lead);

        $validated = $request->validate([
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
        ]);

        $lead->update(['tags' => $validated['tags'] ?? []]);

        return back()->with('success', 'Теги обновлены');
    }

    /**
     * Set reminder for lead
     */
    public function setReminder(Request $request, Lead $lead): RedirectResponse
    {
        $this->authorizeAccess($request->user(), $lead);

        $validated = $request->validate([
            'reminder_at' => 'nullable|date|after:now',
            'reminder_note' => 'nullable|string|max:500',
        ]);

        $lead->update([
            'reminder_at' => $validated['reminder_at'],
            'reminder_note' => $validated['reminder_note'],
        ]);

        $message = $validated['reminder_at'] ? 'Напоминание установлено' : 'Напоминание удалено';
        return back()->with('success', $message);
    }

    /**
     * Bulk update leads status
     */
    public function bulkUpdateStatus(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'lead_ids' => 'required|array',
            'lead_ids.*' => 'integer|exists:leads,id',
            'status' => 'required|string|in:' . implode(',', array_column(LeadStatus::cases(), 'value')),
        ]);

        $user = $request->user();

        $count = Lead::whereIn('id', $validated['lead_ids'])
            ->where('user_id', $user->id)
            ->update(['status' => $validated['status']]);

        return back()->with('success', "Статус обновлён для {$count} заявок");
    }

    /**
     * Bulk delete leads
     */
    public function bulkDelete(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'lead_ids' => 'required|array',
            'lead_ids.*' => 'integer|exists:leads,id',
        ]);

        $user = $request->user();

        $count = Lead::whereIn('id', $validated['lead_ids'])
            ->where('user_id', $user->id)
            ->delete();

        return back()->with('success', "Удалено {$count} заявок");
    }

    /**
     * Export leads to CSV
     */
    public function export(Request $request)
    {
        $user = $request->user();
        $status = $request->get('status');

        $query = Lead::forUser($user->id)
            ->with(['service:id,name', 'client:id,name,phone,email']);

        if ($status) {
            $query->where('status', $status);
        }

        $leads = $query->latest()->get();

        $filename = 'leads_' . now()->format('Y-m-d_H-i-s') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($leads) {
            $file = fopen('php://output', 'w');
            
            // BOM for UTF-8
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            // Header row
            fputcsv($file, [
                'ID',
                'Имя',
                'Телефон',
                'Услуга',
                'Статус',
                'Приоритет',
                'Сообщение',
                'Теги',
                'Дата создания',
            ], ';');

            foreach ($leads as $lead) {
                fputcsv($file, [
                    $lead->id,
                    $lead->name,
                    $lead->phone,
                    $lead->service?->name ?? '',
                    $lead->status->label(),
                    $lead->priority ?? 'normal',
                    $lead->message ?? '',
                    implode(', ', $lead->tags ?? []),
                    $lead->created_at->format('d.m.Y H:i'),
                ], ';');
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Authorize access to lead
     */
    private function authorizeAccess($user, Lead $lead): void
    {
        if ($lead->user_id !== $user->id) {
            abort(403, 'Доступ запрещён');
        }
    }
}
