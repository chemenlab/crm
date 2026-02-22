<?php

namespace App\Modules\Leads\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Leads\Models\Lead;
use App\Modules\Leads\Models\LeadComment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LeadCommentController extends Controller
{
    /**
     * Store a new comment
     */
    public function store(Request $request, Lead $lead): RedirectResponse
    {
        $this->authorizeAccess($request->user(), $lead);

        $validated = $request->validate([
            'content' => 'required|string|max:2000',
        ]);

        $lead->comments()->create([
            'user_id' => $request->user()->id,
            'content' => $validated['content'],
        ]);

        return back()->with('success', 'Комментарий добавлен');
    }

    /**
     * Delete a comment
     */
    public function destroy(Request $request, Lead $lead, LeadComment $comment): RedirectResponse
    {
        $this->authorizeAccess($request->user(), $lead);
        $this->authorizeCommentAccess($lead, $comment);

        // Only author can delete their comment
        if ($comment->user_id !== $request->user()->id) {
            abort(403, 'Вы можете удалять только свои комментарии');
        }

        $comment->delete();

        return back()->with('success', 'Комментарий удалён');
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
     * Authorize comment belongs to lead
     */
    private function authorizeCommentAccess(Lead $lead, LeadComment $comment): void
    {
        if ($comment->lead_id !== $lead->id) {
            abort(404, 'Комментарий не найден');
        }
    }
}
