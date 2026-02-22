<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Client;
use App\Models\Service;
use App\Services\ImageService;
use App\Services\OnboardingProgressService;
use App\Services\Subscription\UsageLimitService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class AppointmentController extends Controller
{
    /**
     * Display a listing of the resource (Calendar View).
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Default initial load
        return Inertia::render('App/Calendar/Index', [
            // Pass clients and services for the initial state if needed
            'services' => $user->services()->select('id', 'name', 'price', 'duration')->get(),
            'customFields' => $user->customFields()->orderBy('order')->get(),
            'availableTags' => $user->clientTags()->orderBy('name')->get(),
        ]);
    }

    /**
     * Fetch events for calendar (JSON API).
     */
    public function events(Request $request)
    {
        $user = $request->user();
        $userTimezone = $user->timezone ?? 'UTC';

        $start = Carbon::parse($request->start);
        $end = Carbon::parse($request->end);

        // Eager load all relationships to avoid N+1 queries
        $appointments = $user->appointments()
            ->with([
                'client.tags',
                'service',
                'options',
                'meta.customField'
            ])
            ->whereBetween('start_time', [$start, $end])
            ->get()
            ->map(function ($app) use ($userTimezone) {
                // Prepare meta data
                $metaData = [];
                foreach ($app->meta as $meta) {
                    if ($meta->customField) {
                        // Try to decode JSON values (for arrays like multiple images)
                        try {
                            $value = json_decode($meta->value, true);
                            // If it's not JSON, json_decode returns null, so use original
                            $metaData[$meta->customField->id] = $value ?? $meta->value;
                        } catch (\Exception $e) {
                            $metaData[$meta->customField->id] = $meta->value;
                        }
                    }
                }

                // Convert times to user's timezone for display
                $startTime = $app->start_time->copy()->setTimezone($userTimezone);
                $endTime = $app->end_time->copy()->setTimezone($userTimezone);

                return [
                    'id' => $app->id,
                    'title' => $app->client ? $app->client->name : 'Client',
                    'start' => $startTime->toIso8601String(),
                    'end' => $endTime->toIso8601String(),
                    'extendedProps' => [
                        'service' => $app->service ? $app->service->name : '',
                        'service_name' => $app->service ? $app->service->name : '',
                        'service_price' => $app->service ? $app->service->price : 0,
                        'service_duration' => $app->service ? $app->service->duration : 0,
                        'options' => $app->options ? $app->options->map(function($opt) {
                            return [
                                'id' => $opt->id,
                                'name' => $opt->name,
                                'price_change' => $opt->price_change,
                                'duration_change' => $opt->duration_change,
                            ];
                        }) : [],
                        'status' => $app->status,
                        'price' => $app->price,
                        'total_price' => $app->price,
                        'client_id' => $app->client_id,
                        'client_name' => $app->client ? $app->client->name : '',
                        'client_phone' => $app->client ? $app->client->phone : '',
                        'client' => $app->client ? [
                            'id' => $app->client->id,
                            'name' => $app->client->name,
                            'phone' => $app->client->phone,
                            'email' => $app->client->email,
                            'notes' => $app->client->notes,
                            'tags' => $app->client->tags,
                        ] : null,
                        'notes' => $app->notes,
                        'meta' => $metaData,
                    ],
                    'backgroundColor' => $this->getStatusColor($app->status),
                    'borderColor' => $this->getStatusColor($app->status),
                ];
            });

        return response()->json($appointments);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // We might not use this if we use a modal or just the Index page with state
        // But user asked for separate page.
        return Inertia::render('App/Calendar/Create', [
            'clients' => auth()->user()->clients()->with('tags')->orderBy('name')->get(),
            'services' => auth()->user()->services()->with('options')->orderBy('name')->get(),
            'customFields' => auth()->user()->customFields()->orderBy('order')->get(),
            'availableTags' => auth()->user()->clientTags()->orderBy('name')->get(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'service_id' => 'required|exists:services,id',
            'start_time' => 'required|date',
            'note' => 'nullable|string',
            'custom_fields' => 'nullable|array',
            'option_ids' => 'nullable|array',
            'option_ids.*' => 'exists:service_options,id',
        ]);

        $user = $request->user();
        if (
            $user->clients()->where('id', $validated['client_id'])->doesntExist() ||
            $user->services()->where('id', $validated['service_id'])->doesntExist()
        ) {
            abort(403);
        }

        $service = Service::find($validated['service_id']);
        $userTimezone = $user->timezone ?? 'UTC';
        
        // Parse the datetime - it comes from frontend in user's local timezone
        // The datetime-local input sends format like "2026-01-15T11:00"
        // We need to interpret this as user's timezone, then convert to UTC for storage
        $startTimeLocal = Carbon::parse($validated['start_time'], $userTimezone);
        $startTime = $startTimeLocal->copy()->utc();
        
        // Calculate total duration including options
        $totalDuration = $service->duration;
        if (!empty($validated['option_ids'])) {
            $options = \App\Models\ServiceOption::whereIn('id', $validated['option_ids'])
                ->where('service_id', $service->id)
                ->get();
            foreach ($options as $option) {
                $totalDuration += $option->duration_change;
            }
        }
        
        $endTime = $startTime->copy()->addMinutes($totalDuration);
        
        // Calculate total price including options
        $totalPrice = $service->price;
        if (!empty($validated['option_ids'])) {
            foreach ($options as $option) {
                $totalPrice += $option->price_change;
            }
        }

        // Basic overlap check
        $conflicts = $user->appointments()
            ->where('status', '!=', 'cancelled')
            ->where(function ($query) use ($startTime, $endTime) {
                $query->whereBetween('start_time', [$startTime, $endTime])
                    ->orWhereBetween('end_time', [$startTime, $endTime])
                    ->orWhere(function ($q) use ($startTime, $endTime) {
                        $q->where('start_time', '<', $startTime)
                            ->where('end_time', '>', $endTime);
                    });
            })
            ->exists();

        // Warn about conflicts but allow creation
        if ($conflicts) {
            \Log::warning('Appointment created with time conflict', [
                'user_id' => $user->id,
                'start_time' => $startTime,
                'end_time' => $endTime,
            ]);
        }

        $appointment = $user->appointments()->create([
            'client_id' => $validated['client_id'],
            'service_id' => $validated['service_id'],
            'start_time' => $startTime,
            'end_time' => $endTime,
            'price' => $totalPrice, // Snapshot price with options
            'status' => 'scheduled',
            'note' => $validated['note'] ?? null,
        ]);

        // Attach service options with price_change and duration_change
        if (!empty($validated['option_ids'])) {
            $optionsData = [];
            foreach ($options as $option) {
                $optionsData[$option->id] = [
                    'price_change' => $option->price_change,
                    'duration_change' => $option->duration_change,
                ];
            }
            $appointment->options()->attach($optionsData);
        }

        // Save custom fields
        if (!empty($validated['custom_fields'])) {
            foreach ($validated['custom_fields'] as $fieldId => $value) {
                $field = $user->customFields()->find($fieldId);
                if ($field && $value !== null && $value !== '') {
                    $appointment->meta()->create([
                        'user_field_id' => $field->id,
                        'value' => is_array($value) ? json_encode($value) : $value,
                    ]);
                }
            }
        }

        // Track usage
        app(UsageLimitService::class)->trackUsage($user, 'appointments');

        // Track onboarding progress
        try {
            app(OnboardingProgressService::class)->trackStepCompletion(
                $user,
                'first_appointment'
            );
        } catch (\Exception $e) {
            // Не прерываем основной процесс при ошибке отслеживания
            \Log::error('Failed to track onboarding progress', [
                'user_id' => $user->id,
                'step' => 'first_appointment',
                'error' => $e->getMessage(),
            ]);
        }

        // Send Telegram notification (don't block appointment creation if it fails)
        try {
            $telegramService = app(\App\Services\Telegram\TelegramNotificationService::class);
            $telegramService->sendAppointmentCreatedNotification($appointment->fresh(['client', 'service']));
        } catch (\Exception $e) {
            \Log::error('Failed to send Telegram notification for appointment', [
                'appointment_id' => $appointment->id,
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }

        return redirect()->route('calendar.index')->with('success', 'Запись создана');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Appointment $appointment)
    {
        $this->authorize('update', $appointment);

        return Inertia::render('App/Calendar/Edit', [
            'appointment' => $appointment->load('client.tags', 'service.options', 'options', 'meta.customField'),
            'clients' => auth()->user()->clients()->with('tags')->orderBy('name')->get(),
            'services' => auth()->user()->services()->with('options')->orderBy('name')->get(),
            'customFields' => auth()->user()->customFields()->orderBy('order')->get(),
            'availableTags' => auth()->user()->clientTags()->orderBy('name')->get(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Appointment $appointment)
    {
        $this->authorize('update', $appointment);

        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'service_id' => 'required|exists:services,id',
            'start_time' => 'required|date',
            'status' => 'required|in:scheduled,confirmed,completed,cancelled,no_show',
            'note' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'custom_fields' => 'nullable|array',
            'option_ids' => 'nullable|array',
            'option_ids.*' => 'exists:service_options,id',
        ]);

        $service = Service::find($validated['service_id']);
        $user = $request->user();
        $userTimezone = $user->timezone ?? 'UTC';
        
        // Parse the datetime in user's timezone, then convert to UTC for storage
        $startTimeLocal = Carbon::parse($validated['start_time'], $userTimezone);
        $startTime = $startTimeLocal->copy()->utc();
        
        // Calculate total duration including options
        $totalDuration = $service->duration;
        if (!empty($validated['option_ids'])) {
            $options = \App\Models\ServiceOption::whereIn('id', $validated['option_ids'])
                ->where('service_id', $service->id)
                ->get();
            foreach ($options as $option) {
                $totalDuration += $option->duration_change;
            }
        }
        
        // If service changed, duration might change, but maybe we want to keep custom duration?
        // Let's recalculate clean end time based on service duration for now unless we add manual duration field.
        $endTime = $startTime->copy()->addMinutes($totalDuration);

        $appointment->update([
            'client_id' => $validated['client_id'],
            'service_id' => $validated['service_id'],
            'start_time' => $startTime,
            'end_time' => $endTime,
            'price' => $validated['price'],
            'status' => $validated['status'],
            'note' => $validated['note'],
        ]);

        // Sync service options with price_change and duration_change
        if (isset($validated['option_ids'])) {
            if (!empty($validated['option_ids'])) {
                $optionsData = [];
                foreach ($options as $option) {
                    $optionsData[$option->id] = [
                        'price_change' => $option->price_change,
                        'duration_change' => $option->duration_change,
                    ];
                }
                $appointment->options()->sync($optionsData);
            } else {
                $appointment->options()->detach();
            }
        } else {
            $appointment->options()->detach();
        }

        // Update custom fields
        if (isset($validated['custom_fields'])) {
            // Delete existing meta
            $appointment->meta()->delete();
            
            // Create new meta
            foreach ($validated['custom_fields'] as $fieldId => $value) {
                $field = $request->user()->customFields()->find($fieldId);
                if ($field && $value !== null && $value !== '') {
                    $appointment->meta()->create([
                        'user_field_id' => $field->id,
                        'value' => is_array($value) ? json_encode($value) : $value,
                    ]);
                }
            }
        }

        return redirect()->route('calendar.index')->with('success', 'Запись обновлена');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $appointment = auth()->user()->appointments()->where('id', $id)->firstOrFail();

        $appointment->delete();

        // Decrease usage
        app(UsageLimitService::class)->decreaseUsage(auth()->user(), 'appointments');

        return redirect()->route('calendar.index')->with('success', 'Запись успешно удалена');
    }

    public function updateStatus(Request $request, Appointment $appointment)
    {
        $this->authorize('update', $appointment);

        $validated = $request->validate([
            'status' => 'required|in:scheduled,confirmed,completed,cancelled,no_show',
            'payment_method' => 'nullable|in:cash,card',
        ]);

        // Update status and payment method together
        $updateData = ['status' => $validated['status']];
        
        if ($validated['status'] === 'completed' && isset($validated['payment_method'])) {
            $updateData['payment_method'] = $validated['payment_method'];
        }

        $appointment->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Статус обновлен',
            'appointment' => $appointment->fresh(['client', 'service', 'meta.customField'])
        ]);
    }

    public function updateNotes(Request $request, Appointment $appointment)
    {
        $this->authorize('update', $appointment);

        $validated = $request->validate([
            'notes' => 'nullable|string|max:1000'
        ]);

        $appointment->update(['notes' => $validated['notes']]);

        return response()->json([
            'success' => true,
            'message' => 'Заметка обновлена',
            'appointment' => $appointment->fresh(['client', 'service', 'meta.customField'])
        ]);
    }

    public function uploadFieldImage(Request $request, ImageService $imageService)
    {
        $validated = $request->validate([
            'image' => 'required|image|max:20480', // 20MB max — compressed server-side
            'field_id' => 'required|exists:custom_fields,id',
            'appointment_id' => 'nullable|exists:appointments,id',
        ]);

        $user = $request->user();

        // Verify field belongs to user
        $field = $user->customFields()->find($validated['field_id']);
        if (!$field) {
            abort(403, 'Это поле вам не принадлежит');
        }

        // Verify appointment belongs to user if provided
        if (!empty($validated['appointment_id'])) {
            $appointment = $user->appointments()->find($validated['appointment_id']);
            if (!$appointment) {
                abort(403, 'Эта запись вам не принадлежит');
            }
        }

        // Compress and store image (max 1920x1920, quality 80)
        $path = $imageService->compressAndStore(
            $request->file('image'),
            'appointment-fields/' . $user->id,
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 80,
        );

        return response()->json([
            'success' => true,
            'path' => $path,
            'url' => Storage::url($path),
        ]);
    }

    private function getStatusColor($status)
    {
        return match ($status) {
            'confirmed' => '#10b981', // emerald-500
            'completed' => '#3b82f6', // blue-500
            'cancelled' => '#ef4444', // red-500
            'no_show' => '#f59e0b', // amber-500
            default => '#9ca3af', // gray-400
        };
    }
}
