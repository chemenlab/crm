<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Services\OnboardingProgressService;
use App\Services\Subscription\UsageLimitService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClientController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $perPage = 20;
        $search = $request->input('search');

        $query = $request->user()->clients()
            ->with('tags')
            ->orderBy('name');

        // Search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $usageLimitService = app(UsageLimitService::class);
        $remainingSlots = $usageLimitService->getRemainingUsage($request->user(), 'clients');

        if ($request->wantsJson()) {
            // For API requests, return paginated results
            $clients = $query->paginate($perPage)->withQueryString();
            return response()->json($clients);
        }

        // For Inertia, use pagination
        $clients = $query->paginate($perPage)->withQueryString();

        return Inertia::render('App/Clients/Index', [
            'clients' => $clients,
            'remainingSlots' => $remainingSlots,
            'search' => $search,
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Client $client)
    {
        $this->authorize('view', $client);

        // Load client with relationships
        $client->load('tags');

        // Get all appointments for this client
        $appointments = $client->user->appointments()
            ->where('client_id', $client->id)
            ->with(['service', 'options'])
            ->orderBy('start_time', 'desc')
            ->get();

        // Map appointments to array format
        $appointmentsData = $appointments->map(function ($appointment) {
            return [
                'id' => $appointment->id,
                'start_time' => $appointment->start_time,
                'end_time' => $appointment->end_time,
                'status' => $appointment->status,
                'payment_method' => $appointment->payment_method,
                'price' => $appointment->price,
                'service' => $appointment->service ? [
                    'id' => $appointment->service->id,
                    'name' => $appointment->service->name,
                ] : null,
                'options' => $appointment->options->map(function ($option) {
                    return [
                        'id' => $option->id,
                        'name' => $option->name,
                        'price_change' => $option->pivot->price_change ?? $option->price_change,
                    ];
                }),
            ];
        });

        // Calculate statistics using original collection
        $completedAppointments = $appointments->where('status', 'completed');
        $totalVisits = $completedAppointments->count();
        $totalSpent = $completedAppointments->sum('price');
        $upcomingAppointments = $appointments->where('status', 'scheduled')
            ->filter(function ($appointment) {
                return $appointment->start_time > now();
            })
            ->count();
        $lastVisit = $completedAppointments->first();

        return Inertia::render('App/Clients/Show', [
            'client' => $client,
            'appointments' => $appointmentsData,
            'stats' => [
                'total_visits' => $totalVisits,
                'total_spent' => $totalSpent,
                'upcoming_appointments' => $upcomingAppointments,
                'last_visit' => $lastVisit?->start_time,
            ],
            'customFields' => $request->user()->customFields()->orderBy('order')->get(),
            'availableTags' => $request->user()->clientTags()->orderBy('name')->get(),
        ]);
    }

    /**
     * Normalize phone number to last 10 digits for comparison
     */
    private function normalizePhone($phone)
    {
        if (!$phone) {
            return null;
        }

        // Remove all non-digit characters
        $digits = preg_replace('/\D/', '', $phone);

        // Get last 10 digits
        return substr($digits, -10);
    }

    /**
     * Check if phone number already exists
     */
    public function checkPhone(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
        ]);

        $phone = $request->input('phone');
        $normalizedPhone = $this->normalizePhone($phone);

        if (!$normalizedPhone || strlen($normalizedPhone) < 10) {
            return response()->json([
                'exists' => false,
            ]);
        }

        // Optimized: search by phone pattern in database instead of loading all clients
        $existingClient = $request->user()->clients()
            ->with('tags')
            ->whereRaw("RIGHT(REGEXP_REPLACE(phone, '[^0-9]', ''), 10) = ?", [$normalizedPhone])
            ->first();

        // Fallback for databases that don't support REGEXP_REPLACE (like SQLite)
        if ($existingClient === null) {
            $existingClient = $request->user()->clients()
                ->with('tags')
                ->where(function ($query) use ($normalizedPhone) {
                    $query->where('phone', 'LIKE', '%' . $normalizedPhone)
                        ->orWhere('phone', 'LIKE', '%' . substr($normalizedPhone, 0, 3) . '%' . substr($normalizedPhone, 3, 3) . '%' . substr($normalizedPhone, 6));
                })
                ->get()
                ->first(function ($client) use ($normalizedPhone) {
                    $clientNormalized = $this->normalizePhone($client->phone);
                    return $clientNormalized === $normalizedPhone;
                });
        }

        if ($existingClient) {
            return response()->json([
                'exists' => true,
                'client' => $existingClient,
            ]);
        }

        return response()->json([
            'exists' => false,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Check limit before creating
        $usageLimitService = app(UsageLimitService::class);
        if (!$usageLimitService->checkLimit($request->user(), 'clients')) {
            return back()->withErrors([
                'limit' => 'Вы достигли лимита клиентов для вашего тарифного плана.'
            ]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => [
                'nullable',
                'string',
                'max:20',
                function ($attribute, $value, $fail) use ($request) {
                    if ($value) {
                        $normalizedPhone = $this->normalizePhone($value);

                        if ($normalizedPhone && strlen($normalizedPhone) >= 10) {
                            $exists = $request->user()->clients()
                                ->get()
                                ->first(function ($client) use ($normalizedPhone) {
                                    $clientNormalized = $this->normalizePhone($client->phone);
                                    return $clientNormalized === $normalizedPhone;
                                });

                            if ($exists) {
                                $fail('Клиент с таким номером телефона уже существует');
                            }
                        }
                    }
                },
            ],
            'email' => 'nullable|email|max:255',
            'telegram_id' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:client_tags,id',
        ], [
            'name.required' => 'Укажите имя клиента',
        ]);

        $client = $request->user()->clients()->create($validated);

        // Attach tags if provided
        if (!empty($validated['tag_ids'])) {
            $client->tags()->sync($validated['tag_ids']);
        }

        $client->load('tags');

        // Track usage
        app(UsageLimitService::class)->trackUsage($request->user(), 'clients');

        // Track onboarding progress
        try {
            app(OnboardingProgressService::class)->trackStepCompletion(
                $request->user(),
                'first_client'
            );
        } catch (\Exception $e) {
            // Не прерываем основной процесс при ошибке отслеживания
            \Log::error('Failed to track onboarding progress', [
                'user_id' => $request->user()->id,
                'step' => 'first_client',
                'error' => $e->getMessage(),
            ]);
        }

        if ($request->wantsJson()) {
            return response()->json($client, 201);
        }

        return redirect()->back();
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Client $client)
    {
        $this->authorize('update', $client);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => [
                'nullable',
                'string',
                'max:20',
                function ($attribute, $value, $fail) use ($request, $client) {
                    if ($value) {
                        $normalizedPhone = $this->normalizePhone($value);

                        if ($normalizedPhone && strlen($normalizedPhone) >= 10) {
                            $exists = $request->user()->clients()
                                ->where('id', '!=', $client->id)
                                ->get()
                                ->first(function ($c) use ($normalizedPhone) {
                                    $clientNormalized = $this->normalizePhone($c->phone);
                                    return $clientNormalized === $normalizedPhone;
                                });

                            if ($exists) {
                                $fail('Клиент с таким номером телефона уже существует');
                            }
                        }
                    }
                },
            ],
            'email' => 'nullable|email|max:255',
            'telegram_id' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:client_tags,id',
        ]);

        $client->update($validated);

        // Sync tags if provided
        if (isset($validated['tag_ids'])) {
            $client->tags()->sync($validated['tag_ids']);
        }

        // Return JSON for AJAX requests
        if ($request->wantsJson() || $request->expectsJson()) {
            $client->load('tags');
            return response()->json([
                'message' => 'Клиент обновлён',
                'client' => $client,
            ]);
        }

        return redirect()->back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, $id)
    {
        $client = $request->user()->clients()->where('id', $id)->firstOrFail();

        $client->delete();

        // Decrease usage
        app(UsageLimitService::class)->decreaseUsage($request->user(), 'clients');

        return back()->with('success', 'Клиент успешно удалён');
    }
}
