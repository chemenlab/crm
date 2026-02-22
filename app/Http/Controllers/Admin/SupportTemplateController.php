<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SupportTicketTemplate;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupportTemplateController extends Controller
{
    /**
     * Список шаблонов
     */
    public function index()
    {
        $templates = SupportTicketTemplate::orderBy('category')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Settings/SupportTemplates', [
            'templates' => $templates,
        ]);
    }

    /**
     * Создание шаблона
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'content' => 'required|string',
            'is_active' => 'boolean',
        ]);

        try {
            SupportTicketTemplate::create($validated);

            return back()->with('success', 'Шаблон создан.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Не удалось создать шаблон.']);
        }
    }

    /**
     * Обновление шаблона
     */
    public function update(Request $request, SupportTicketTemplate $template)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'content' => 'required|string',
            'is_active' => 'boolean',
        ]);

        try {
            $template->update($validated);

            return back()->with('success', 'Шаблон обновлен.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Не удалось обновить шаблон.']);
        }
    }

    /**
     * Удаление шаблона
     */
    public function destroy(SupportTicketTemplate $template)
    {
        try {
            $template->delete();

            return back()->with('success', 'Шаблон удален.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Не удалось удалить шаблон.']);
        }
    }
}
