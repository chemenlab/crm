<?php

namespace App\Http\Controllers\App\Settings;

use App\Http\Controllers\Controller;
use App\Models\CustomField;
use Illuminate\Http\Request;

class CustomFieldsController extends Controller
{
    public function index(Request $request)
    {
        $fields = $request->user()
            ->customFields()
            ->orderBy('order')
            ->get();

        return response()->json($fields);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:text,number,date,select,checkbox,image,photo,file',
            'is_required' => 'boolean',
            'is_public' => 'boolean',
            'options' => 'nullable|array',
            'allow_multiple' => 'boolean',
        ]);

        $maxOrder = $request->user()->customFields()->max('order') ?? -1;

        $field = $request->user()->customFields()->create([
            'name' => $validated['name'],
            'type' => $validated['type'],
            'is_required' => $validated['is_required'] ?? false,
            'is_public' => $validated['is_public'] ?? true,
            'options' => $validated['options'] ?? null,
            'allow_multiple' => $validated['allow_multiple'] ?? false,
            'order' => $maxOrder + 1,
        ]);

        return response()->json($field, 201);
    }

    public function update(Request $request, CustomField $customField)
    {
        // Check ownership
        if ($customField->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:text,number,date,select,checkbox,image,photo,file',
            'is_required' => 'boolean',
            'is_public' => 'boolean',
            'options' => 'nullable|array',
            'allow_multiple' => 'boolean',
        ]);

        $customField->update($validated);

        return response()->json($customField);
    }

    public function destroy(Request $request, CustomField $customField)
    {
        // Check ownership
        if ($customField->user_id !== $request->user()->id) {
            abort(403);
        }

        $customField->delete();

        return response()->json(['message' => 'Field deleted successfully']);
    }
}
