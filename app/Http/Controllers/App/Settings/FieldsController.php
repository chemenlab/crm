<?php

namespace App\Http\Controllers\App\Settings;

use App\Http\Controllers\Controller;
use App\Models\UserField;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FieldsController extends Controller
{
    public function index(Request $request)
    {
        $fields = $request->user()->fields()
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('App/Settings/Fields', [
            'fields' => $fields,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'label' => 'required|string|max:255',
            'type' => 'required|in:text,number,select,checkbox,file',
            'options' => 'nullable|array',
            'is_required' => 'boolean',
        ]);

        $request->user()->fields()->create([
            ...$validated,
            'sort_order' => $request->user()->fields()->max('sort_order') + 1,
            'is_active' => true,
        ]);

        return redirect()->back();
    }

    public function update(Request $request, UserField $field)
    {
        $this->authorize('update', $field);

        $validated = $request->validate([
            'label' => 'required|string|max:255',
            'type' => 'required|in:text,number,select,checkbox,file',
            'options' => 'nullable|array',
            'is_required' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $field->update($validated);

        return redirect()->back();
    }

    public function destroy(Request $request, UserField $field)
    {
        $this->authorize('delete', $field);

        $field->delete();

        return redirect()->back();
    }
}
