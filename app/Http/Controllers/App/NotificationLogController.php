<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class NotificationLogController extends Controller
{
    /**
     * Display notification log with filters
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        $query = Notification::where('user_id', $user->id)
            ->with(['client', 'appointment']);

        // Filter by status
        if ($request->has('status')) {
            $query->byStatus($request->status);
        }

        // Filter by channel
        if ($request->has('channel')) {
            $query->byChannel($request->channel);
        }

        // Filter by client
        if ($request->has('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        // Filter by date range
        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Recent by default (30 days)
        if (!$request->has('date_from') && !$request->has('date_to')) {
            $query->recent(30);
        }

        $notifications = $query->orderBy('created_at', 'desc')
            ->paginate(50);

        return Inertia::render('App/Notifications/Log', [
            'notifications' => $notifications,
            'filters' => $request->only(['status', 'channel', 'search']),
        ]);
    }

    /**
     * Show notification details
     */
    public function show(Notification $notification)
    {
        $user = Auth::user();

        // Check ownership
        if ($notification->user_id !== $user->id) {
            abort(403, 'Unauthorized');
        }

        $notification->load(['client', 'appointment']);

        return response()->json([
            'notification' => $notification,
        ]);
    }
}
