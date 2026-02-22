<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\NotificationTemplate;
use App\Services\Notifications\TemplateService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class NotificationTemplateController extends Controller
{
    public function __construct(
        protected TemplateService $templateService
    ) {}

    /**
     * Display list of templates
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        $query = NotificationTemplate::query()
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhereNull('user_id'); // System templates
            });

        // Filter by type
        if ($request->has('type')) {
            $query->byType($request->type);
        }

        // Filter by channel
        if ($request->has('channel')) {
            $query->byChannel($request->channel);
        }

        $templates = $query->orderBy('is_system', 'desc')
            ->orderBy('type')
            ->orderBy('channel')
            ->get();

        return Inertia::render('App/Notifications/Templates', [
            'templates' => $templates,
        ]);
    }

    /**
     * Show create form
     */
    public function create()
    {
        return Inertia::render('App/Notifications/TemplateEditor', [
            'isEdit' => false,
        ]);
    }

    /**
     * Show edit form
     */
    public function edit(NotificationTemplate $template)
    {
        $user = Auth::user();

        // Check access
        if ($template->user_id && $template->user_id !== $user->id) {
            abort(403, 'Unauthorized');
        }

        return Inertia::render('App/Notifications/TemplateEditor', [
            'template' => $template,
            'isEdit' => true,
        ]);
    }

    /**
     * Show single template
     */
    public function show(NotificationTemplate $template)
    {
        $user = Auth::user();

        // Check access
        if ($template->user_id && $template->user_id !== $user->id) {
            abort(403, 'Unauthorized');
        }

        return response()->json([
            'template' => $template,
            'available_variables' => $this->templateService->getAvailableVariables($template->type),
        ]);
    }

    /**
     * Create custom template
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:50',
            'channel' => 'required|string|in:vk,telegram,sms,email',
            'subject' => 'nullable|string|max:255',
            'content' => 'required|string',
            'is_active' => 'boolean',
        ]);

        $template = NotificationTemplate::create([
            'user_id' => Auth::id(),
            'name' => $validated['name'],
            'type' => $validated['type'],
            'channel' => $validated['channel'],
            'subject' => $validated['subject'] ?? null,
            'body' => $validated['content'],
            'is_system' => false,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return redirect()->route('notifications.templates.index')
            ->with('success', 'Шаблон успешно создан');
    }

    /**
     * Update template
     */
    public function update(Request $request, NotificationTemplate $template)
    {
        $user = Auth::user();

        // Check ownership for custom templates
        if (!$template->is_system && $template->user_id !== $user->id) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'subject' => 'nullable|string|max:255',
            'content' => 'required|string',
            'is_active' => 'boolean',
        ]);

        // System templates can only update content and is_active
        if ($template->is_system) {
            $template->update([
                'body' => $validated['content'],
                'is_active' => $validated['is_active'] ?? $template->is_active,
            ]);
        } else {
            $template->update([
                'name' => $validated['name'] ?? $template->name,
                'subject' => $validated['subject'] ?? $template->subject,
                'body' => $validated['content'],
                'is_active' => $validated['is_active'] ?? $template->is_active,
            ]);
        }

        return redirect()->route('notifications.templates.index')
            ->with('success', 'Шаблон успешно обновлен');
    }

    /**
     * Delete template (only custom)
     */
    public function destroy(NotificationTemplate $template)
    {
        $user = Auth::user();

        // Only custom templates can be deleted
        if ($template->is_system) {
            abort(403, 'Системные шаблоны нельзя удалять');
        }

        // Check ownership
        if ($template->user_id !== $user->id) {
            abort(403, 'Unauthorized');
        }

        $template->delete();

        return redirect()->route('notifications.templates.index')
            ->with('success', 'Шаблон успешно удален');
    }
}
