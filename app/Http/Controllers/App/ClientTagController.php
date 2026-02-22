<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\ClientTag;
use Illuminate\Http\Request;

class ClientTagController extends Controller
{
    public function index(Request $request)
    {
        $tags = $request->user()->clientTags()
            ->withCount('clients')
            ->orderBy('name')
            ->get();

        return response()->json($tags);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'color' => 'required|string|max:7',
            'description' => 'nullable|string',
        ]);

        $tag = $request->user()->clientTags()->create($validated);

        return response()->json($tag, 201);
    }

    public function update(Request $request, $id)
    {
        $tag = ClientTag::findOrFail($id);
        $this->authorize('update', $tag);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'color' => 'required|string|max:7',
            'description' => 'nullable|string',
        ]);

        $tag->update($validated);
        $tag->loadCount('clients');

        return response()->json($tag);
    }

    public function destroy(Request $request, $id)
    {
        $tag = ClientTag::findOrFail($id);
        $this->authorize('delete', $tag);

        $tag->delete();

        return response()->json(['message' => 'Тег удалён']);
    }

    public function attachToClient(Request $request, ClientTag $tag)
    {
        $this->authorize('update', $tag);

        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
        ]);

        $tag->clients()->syncWithoutDetaching([$validated['client_id']]);

        return response()->json(['message' => 'Тег добавлен к клиенту']);
    }

    public function detachFromClient(Request $request, ClientTag $tag)
    {
        $this->authorize('update', $tag);

        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
        ]);

        $tag->clients()->detach($validated['client_id']);

        return response()->json(['message' => 'Тег удалён у клиента']);
    }
}
