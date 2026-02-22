<?php

namespace App\Modules\Leads\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Leads\Models\LeadFormField;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class LeadFormFieldController extends Controller
{
    /**
     * Display list of form fields
     */
    public function index(Request $request): Response
    {
        $fields = LeadFormField::forUser($request->user()->id)
            ->ordered()
            ->get();

        return Inertia::render('Modules/Leads/Settings/FormFields', [
            'fields' => $fields,
            'fieldTypes' => LeadFormField::getFieldTypes(),
        ]);
    }

    /**
     * Store a new form field
     */
    public function store(Request $request): RedirectResponse|JsonResponse
    {
        $validated = $request->validate([
            'label' => 'required|string|max:255',
            'type' => 'required|string|in:text,textarea,select,checkbox,email,url',
            'options' => 'nullable|array',
            'options.*' => 'string|max:255',
            'is_required' => 'boolean',
            'is_active' => 'boolean',
        ]);

        // Validate options for select type
        if ($validated['type'] === 'select' && empty($validated['options'])) {
            return back()->withErrors(['options' => 'Для выпадающего списка необходимо указать варианты']);
        }

        // Get max position
        $maxPosition = LeadFormField::forUser($request->user()->id)->max('position') ?? -1;

        $field = LeadFormField::create([
            'user_id' => $request->user()->id,
            'label' => $validated['label'],
            'type' => $validated['type'],
            'options' => $validated['options'] ?? null,
            'is_required' => $validated['is_required'] ?? false,
            'is_active' => $validated['is_active'] ?? true,
            'position' => $maxPosition + 1,
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'field' => $field,
            ]);
        }

        return back()->with('success', 'Поле добавлено');
    }

    /**
     * Update a form field
     */
    public function update(Request $request, LeadFormField $field): RedirectResponse|JsonResponse
    {
        $this->authorizeAccess($request->user(), $field);

        $validated = $request->validate([
            'label' => 'sometimes|required|string|max:255',
            'type' => 'sometimes|required|string|in:text,textarea,select,checkbox,email,url',
            'options' => 'nullable|array',
            'options.*' => 'string|max:255',
            'is_required' => 'sometimes|boolean',
            'is_active' => 'sometimes|boolean',
        ]);

        // Validate options for select type
        if (isset($validated['type']) && $validated['type'] === 'select' && empty($validated['options'])) {
            return back()->withErrors(['options' => 'Для выпадающего списка необходимо указать варианты']);
        }

        $field->update($validated);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'field' => $field->fresh(),
            ]);
        }

        return back()->with('success', 'Поле обновлено');
    }

    /**
     * Delete a form field
     */
    public function destroy(Request $request, LeadFormField $field): RedirectResponse|JsonResponse
    {
        $this->authorizeAccess($request->user(), $field);

        $field->delete();

        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return back()->with('success', 'Поле удалено');
    }

    /**
     * Reorder form fields
     */
    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'fields' => 'required|array',
            'fields.*.id' => 'required|integer|exists:lead_form_fields,id',
            'fields.*.position' => 'required|integer|min:0',
        ]);

        DB::transaction(function () use ($validated, $request) {
            foreach ($validated['fields'] as $fieldData) {
                LeadFormField::where('id', $fieldData['id'])
                    ->where('user_id', $request->user()->id)
                    ->update(['position' => $fieldData['position']]);
            }
        });

        return response()->json(['success' => true]);
    }

    /**
     * Authorize access to field
     */
    private function authorizeAccess($user, LeadFormField $field): void
    {
        if ($field->user_id !== $user->id) {
            abort(403, 'Доступ запрещён');
        }
    }
}
