<?php

namespace App\Modules\Leads\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Leads\Models\Lead;
use App\Modules\Leads\Models\LeadTodo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LeadTodoController extends Controller
{
    /**
     * Store a new todo item
     */
    public function store(Request $request, Lead $lead): RedirectResponse
    {
        $this->authorizeAccess($request->user(), $lead);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'due_date' => 'nullable|date',
        ]);

        $lead->todos()->create($validated);

        return back()->with('success', 'Задача добавлена');
    }

    /**
     * Update a todo item
     */
    public function update(Request $request, Lead $lead, LeadTodo $todo): RedirectResponse
    {
        $this->authorizeAccess($request->user(), $lead);
        $this->authorizeTodoAccess($lead, $todo);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'is_completed' => 'sometimes|boolean',
            'due_date' => 'nullable|date',
        ]);

        // Handle completion toggle
        if (isset($validated['is_completed'])) {
            if ($validated['is_completed'] && !$todo->is_completed) {
                $validated['completed_at'] = now();
            } elseif (!$validated['is_completed'] && $todo->is_completed) {
                $validated['completed_at'] = null;
            }
        }

        $todo->update($validated);

        return back()->with('success', 'Задача обновлена');
    }

    /**
     * Delete a todo item
     */
    public function destroy(Request $request, Lead $lead, LeadTodo $todo): RedirectResponse
    {
        $this->authorizeAccess($request->user(), $lead);
        $this->authorizeTodoAccess($lead, $todo);

        $todo->delete();

        return back()->with('success', 'Задача удалена');
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

    /**
     * Authorize todo belongs to lead
     */
    private function authorizeTodoAccess(Lead $lead, LeadTodo $todo): void
    {
        if ($todo->lead_id !== $lead->id) {
            abort(404, 'Задача не найдена');
        }
    }
}
