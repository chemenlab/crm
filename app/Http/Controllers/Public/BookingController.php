<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use App\Models\Service;
use App\Models\Appointment;
use App\Models\User;
use App\Models\UserModule;
use App\Notifications\NewOnlineBooking;
use App\Services\Booking\TimeSlotGenerator;
use App\Services\Modules\ModuleRegistry;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class BookingController extends Controller
{
    public function __construct(
        private readonly ModuleRegistry $moduleRegistry,
        private readonly TimeSlotGenerator $timeSlotGenerator
    ) {}

    public function show($slug)
    {
        // Find master by slug in users table
        $user = User::where('slug', $slug)->first();

        if (!$user) {
            abort(404, 'Мастер не найден');
        }

        $services = $user->services()
            ->where('is_active', true)
            ->with('options')
            ->get();

        $customFields = $user->customFields()
            ->where('is_public', true)
            ->orderBy('order')
            ->get();

        // Get lead form fields if Leads module is active
        $leadFormFields = [];
        $isLeadsModuleActive = UserModule::where('user_id', $user->id)
            ->where('module_slug', 'leads')
            ->where('is_enabled', true)
            ->exists();

        if ($isLeadsModuleActive && class_exists(\App\Modules\Leads\Models\LeadFormField::class)) {
            $leadFormFields = \App\Modules\Leads\Models\LeadFormField::forUser($user->id)
                ->active()
                ->ordered()
                ->get()
                ->map(fn($field) => [
                    'id' => $field->id,
                    'label' => $field->label,
                    'type' => $field->type,
                    'options' => $field->options,
                    'is_required' => $field->is_required,
                ])
                ->toArray();
        }

        // Get visible portfolio items
        $portfolioItems = $user->portfolioItems()
            ->visible()
            ->ordered()
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'title' => $item->title,
                    'description' => $item->description,
                    'thumbnail_url' => $item->thumbnail_url,
                    'image_url' => $item->image_url,
                    'tag' => $item->tag,
                ];
            });

        // Prepare social links (only non-empty)
        $socialLinks = array_filter([
            'instagram' => $user->instagram,
            'vk' => $user->vk,
            'telegram' => $user->telegram,
            'whatsapp' => $user->whatsapp,
        ]);

        // Prepare SEO data
        $seoTitle = $user->site_title ?? $user->name;
        $seoDescription = $user->site_description ?? "Онлайн-запись к мастеру {$user->name}";
        $seoImage = $user->avatar ? asset('storage/' . $user->avatar) : null;

        // Get active modules for this user that have public.page.sections hook
        $activeModules = $this->getActivePublicModules($user);

        // Get module-specific data (e.g., reviews)
        $moduleData = $this->getModuleData($user, $activeModules);

        return Inertia::render('Public/Booking/Show', [
            'master' => [
                'name' => $user->name,
                'username' => $user->slug,
                'avatar' => $user->avatar ? asset('storage/' . $user->avatar) : null,
                'phone' => $user->phone,
                'niche' => $user->niche,
                'site_title' => $seoTitle,
                'site_description' => $seoDescription,
                'theme_color' => $user->theme_color ?? '#000000',
                'site_bio' => $user->site_description,
                'site_location' => $user->city,
                'site_address' => $user->address,
                'site_gradient_from' => $user->site_gradient_from,
                'site_gradient_to' => $user->site_gradient_to,
                'social_links' => $socialLinks,
            ],
            'services' => $services,
            'custom_fields' => $customFields,
            'lead_form_fields' => $leadFormFields,
            'portfolio_items' => $portfolioItems,
            'slug' => $slug,
            'seo' => [
                'title' => $seoTitle,
                'description' => $seoDescription,
                'image' => $seoImage,
                'url' => url("/book/{$slug}"),
                'type' => 'website',
            ],
            'schema' => $this->generateSchemaOrg($user, $services),
            'activeModules' => $activeModules,
            'moduleData' => $moduleData,
        ]);
    }

    /**
     * Get active modules for user that have public page hooks
     */
    private function getActivePublicModules(User $user): array
    {
        $activeModuleSlugs = UserModule::where('user_id', $user->id)
            ->where('is_enabled', true)
            ->pluck('module_slug')
            ->toArray();

        $publicModules = [];

        foreach ($activeModuleSlugs as $slug) {
            $manifest = $this->moduleRegistry->get($slug);
            if ($manifest && isset($manifest->hooks['public.page.sections']) && $manifest->hooks['public.page.sections']) {
                $publicModules[] = [
                    'slug' => $slug,
                    'name' => $manifest->name,
                    'hooks' => $manifest->hooks,
                ];
            }
        }

        return $publicModules;
    }

    /**
     * Get module-specific data for public page
     */
    private function getModuleData(User $user, array $activeModules): array
    {
        $data = [];

        foreach ($activeModules as $module) {
            if ($module['slug'] === 'reviews') {
                $data['reviews'] = $this->getReviewsData($user);
            }
        }

        return $data;
    }

    /**
     * Get reviews data for public page
     */
    private function getReviewsData(User $user): array
    {
        // Check if Reviews module model exists
        if (!class_exists(\App\Modules\Reviews\Models\Review::class)) {
            return [
                'reviews' => [],
                'average_rating' => 0,
                'total_reviews' => 0,
            ];
        }

        try {
            $reviews = \App\Modules\Reviews\Models\Review::where('user_id', $user->id)
                ->where('status', 'approved')
                ->orderByDesc('is_featured')
                ->orderByDesc('created_at')
                ->limit(10)
                ->get()
                ->map(fn($review) => [
                    'id' => $review->id,
                    'author_name' => $review->author_name,
                    'rating' => $review->rating,
                    'text' => $review->text,
                    'is_verified' => $review->is_verified,
                    'is_featured' => $review->is_featured,
                    'created_at' => $review->created_at->toDateTimeString(),
                    'response' => $review->response,
                ]);

            $stats = \App\Modules\Reviews\Models\Review::where('user_id', $user->id)
                ->where('status', 'approved')
                ->selectRaw('COUNT(*) as total, AVG(rating) as average')
                ->first();

            return [
                'reviews' => $reviews,
                'average_rating' => round($stats->average ?? 0, 1),
                'total_reviews' => $stats->total ?? 0,
            ];
        } catch (\Throwable $e) {
            \Log::warning('Failed to load reviews for public page', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            return [
                'reviews' => [],
                'average_rating' => 0,
                'total_reviews' => 0,
            ];
        }
    }

    /**
     * Generate Schema.org LocalBusiness microdata
     */
    private function generateSchemaOrg(User $user, $services)
    {
        $schema = [
            '@context' => 'https://schema.org',
            '@type' => 'LocalBusiness',
            'name' => $user->name,
            'description' => $user->site_description ?? "Онлайн-запись к мастеру {$user->name}",
            'url' => url("/book/{$user->slug}"),
            'telephone' => $user->phone,
        ];

        if ($user->avatar) {
            $schema['image'] = asset('storage/' . $user->avatar);
        }

        if ($user->city) {
            $schema['address'] = [
                '@type' => 'PostalAddress',
                'addressLocality' => $user->city,
            ];
        }

        // Add services as offers
        if ($services->isNotEmpty()) {
            $schema['hasOfferCatalog'] = [
                '@type' => 'OfferCatalog',
                'name' => 'Услуги',
                'itemListElement' => $services->map(function ($service) {
                    return [
                        '@type' => 'Offer',
                        'itemOffered' => [
                            '@type' => 'Service',
                            'name' => $service->name,
                            'description' => $service->description,
                        ],
                        'price' => $service->price,
                        'priceCurrency' => 'RUB',
                    ];
                })->toArray(),
            ];
        }

        return $schema;
    }

    public function slots(Request $request, $slug)
    {
        $request->validate([
            'date' => 'required|date|after_or_equal:today',
            'service_id' => 'required|exists:services,id',
            'duration' => 'required|integer',
        ]);

        $user = User::where('slug', $slug)->firstOrFail();
        $userTimezone = $user->timezone ?? 'UTC';
        $service = Service::findOrFail($request->service_id);

        // Parse date in master's timezone
        $date = Carbon::parse($request->date, $userTimezone);
        $duration = (int) $request->duration;

        \Log::info('Slots request', [
            'slug' => $slug,
            'date' => $date->format('Y-m-d'),
            'dayOfWeek' => $date->dayOfWeek,
            'duration' => $duration,
            'service_id' => $service->id,
            'userTimezone' => $userTimezone,
        ]);

        // Get effective settings from TimeSlotGenerator
        $slotStep = $this->timeSlotGenerator->getEffectiveSlotStep($service, $user);
        $bufferTime = $this->timeSlotGenerator->getEffectiveBufferTime($service, $user);

        \Log::info('Effective booking settings', [
            'slot_step' => $slotStep,
            'buffer_time' => $bufferTime,
        ]);

        // 1. Determine Working Hours
        $dayOfWeek = $date->dayOfWeek;
        $schedule = $user->userSchedules()->where('day_of_week', $dayOfWeek)->first();

        \Log::info('Schedule found', ['schedule' => $schedule ? $schedule->toArray() : null]);

        // If day off or no schedule, return empty
        if (!$schedule || !$schedule->is_working) {
            \Log::info('No schedule or day off');
            return response()->json([]);
        }

        $workStart = $date->copy()->setTimeFrom($schedule->start_time);
        $workEnd = $date->copy()->setTimeFrom($schedule->end_time);

        \Log::info('Work hours', [
            'workStart' => $workStart->format('Y-m-d H:i:s'),
            'workEnd' => $workEnd->format('Y-m-d H:i:s'),
        ]);

        // 2. Get Existing Appointments with buffer time
        // Appointments are stored in UTC, need to convert to user's timezone for comparison
        // First, get the UTC date range for the local date
        $dateStartUtc = $date->copy()->startOfDay()->utc();
        $dateEndUtc = $date->copy()->endOfDay()->utc();
        
        $timeSlotGenerator = $this->timeSlotGenerator;
        $busyIntervals = $user->appointments()
            ->where('start_time', '>=', $dateStartUtc)
            ->where('start_time', '<=', $dateEndUtc)
            ->whereIn('status', ['scheduled', 'confirmed'])
            ->with('service')
            ->get()
            ->map(function ($app) use ($userTimezone, $timeSlotGenerator, $user) {
                // Get buffer time for THIS appointment's service
                $appointmentBufferTime = $app->service 
                    ? $timeSlotGenerator->getEffectiveBufferTime($app->service, $user)
                    : 0;
                
                // Convert from UTC to user's timezone
                $start = Carbon::parse($app->start_time)->setTimezone($userTimezone);
                $end = Carbon::parse($app->end_time)->setTimezone($userTimezone)->addMinutes($appointmentBufferTime);
                return [
                    'start' => $start,
                    'end' => $end,
                    'appointment_id' => $app->id,
                ];
            })
            ->sortBy('start')
            ->values();

        \Log::info('Busy intervals', [
            'count' => $busyIntervals->count(), 
            'intervals' => $busyIntervals->map(fn($i) => [
                'start' => $i['start']->format('H:i'),
                'end' => $i['end']->format('H:i'),
                'appointment_id' => $i['appointment_id'] ?? null,
            ])->toArray(),
            'new_service_buffer' => $bufferTime,
        ]);

        // Add break time as busy interval if exists
        if ($schedule->break_start && $schedule->break_end) {
            $breakStart = $date->copy()->setTimeFrom($schedule->break_start);
            $breakEnd = $date->copy()->setTimeFrom($schedule->break_end);
            $busyIntervals->push([
                'start' => $breakStart,
                'end' => $breakEnd,
            ]);
        }

        // 3. Smart Slots Generation using effective slot step
        $candidateTimes = collect();

        // A. Standard Grid with effective slot step
        $current = $workStart->copy();
        while ($current->lt($workEnd)) {
            $candidateTimes->push($current->copy());
            $current->addMinutes($slotStep);
        }

        // B. "Smart" points (immediately after existing bookings)
        foreach ($busyIntervals as $interval) {
            $candidateTimes->push($interval['end']->copy());
        }

        \Log::info('Candidate times generated', ['count' => $candidateTimes->count()]);

        // 4. Filter and Validate
        $validSlots = $candidateTimes
            ->unique(fn($dt) => $dt->format('H:i'))
            ->sort(fn($a, $b) => $a->timestamp <=> $b->timestamp)
            ->filter(function ($slotStart) use ($workEnd, $duration, $busyIntervals, $date, $userTimezone, $bufferTime) {
                $slotEnd = $slotStart->copy()->addMinutes($duration);
                $slotEndWithBuffer = $slotEnd->copy()->addMinutes($bufferTime);

                // Check 1: Within working hours (the appointment itself, not including buffer)
                if ($slotEnd->gt($workEnd)) {
                    return false;
                }

                // Check 2: In the future (if today) - compare in master's timezone
                $now = Carbon::now($userTimezone);
                if ($date->isToday() && $slotStart->lte($now)) {
                    return false;
                }

                // Check 3: Overlap with existing appointments (including buffer times)
                // The new slot (with its buffer) must not overlap with existing slots (with their buffers)
                foreach ($busyIntervals as $interval) {
                    // interval['end'] already includes the buffer of the existing appointment
                    // We need to check if new slot + its buffer overlaps with existing slot
                    if ($slotStart->lt($interval['end']) && $slotEndWithBuffer->gt($interval['start'])) {
                        return false;
                    }
                }

                return true;
            })
            ->values()
            ->map(fn($dt) => $dt->format('H:i'));

        \Log::info('Valid slots', ['count' => $validSlots->count(), 'slots' => $validSlots->toArray()]);

        return response()->json($validSlots);
    }

    public function store(Request $request, $slug)
    {
        $request->validate([
            'service_id' => 'required|exists:services,id',
            'date' => 'required|date',
            'time' => 'required|date_format:H:i',
            'name' => 'required|string',
            'phone' => 'required|string',
            'option_ids' => 'nullable|array',
            'custom_fields' => 'nullable|array',
        ]);

        $user = User::where('slug', $slug)->firstOrFail();
        $userTimezone = $user->timezone ?? 'UTC';

        $service = Service::findOrFail($request->service_id);

        // Calculate totals
        $options = collect([]);
        if (!empty($request->option_ids)) {
            $options = $service->options()->whereIn('id', $request->option_ids)->get();
        }

        $totalPrice = $service->price + $options->sum('price_change');
        $totalDuration = $service->duration + $options->sum('duration_change');

        // Parse date/time in master's timezone, then convert to UTC for storage
        $startLocal = Carbon::parse($request->date . ' ' . $request->time, $userTimezone);
        $start = $startLocal->copy()->utc(); // Convert to UTC for DB storage
        $end = $start->copy()->addMinutes($totalDuration);

        \Log::info('Booking store - time conversion', [
            'input_date' => $request->date,
            'input_time' => $request->time,
            'user_timezone' => $userTimezone,
            'startLocal' => $startLocal->toDateTimeString(),
            'startLocal_tz' => $startLocal->timezone->getName(),
            'start_utc' => $start->toDateTimeString(),
            'start_utc_tz' => $start->timezone->getName(),
        ]);

        // Get buffer time for this service (for checking conflicts with existing appointments)
        $bufferTime = $this->timeSlotGenerator->getEffectiveBufferTime($service, $user);

        // Check for conflicts with existing appointments (including buffer time)
        // Get appointments for the local date (need to convert to UTC range)
        $localDateStart = $startLocal->copy()->startOfDay()->utc();
        $localDateEnd = $startLocal->copy()->endOfDay()->utc();
        
        \Log::info('Booking store - conflict check', [
            'localDateStart' => $localDateStart->toDateTimeString(),
            'localDateEnd' => $localDateEnd->toDateTimeString(),
            'new_start_utc' => $start->toDateTimeString(),
            'new_end_utc' => $end->toDateTimeString(),
            'buffer_time' => $bufferTime,
        ]);
        
        $hasConflict = $user->appointments()
            ->where('start_time', '>=', $localDateStart)
            ->where('start_time', '<=', $localDateEnd)
            ->whereIn('status', ['scheduled', 'confirmed'])
            ->get()
            ->contains(function ($existingAppointment) use ($start, $end, $bufferTime) {
                $existingStart = Carbon::parse($existingAppointment->start_time);
                $existingEnd = Carbon::parse($existingAppointment->end_time);
                
                // Get buffer time for the existing appointment's service
                $existingService = $existingAppointment->service;
                $existingBufferTime = $existingService 
                    ? $this->timeSlotGenerator->getEffectiveBufferTime($existingService, $existingAppointment->user)
                    : 0;
                
                // New appointment must not start during existing appointment + its buffer
                // New appointment + its buffer must not overlap with existing appointment
                $existingEndWithBuffer = $existingEnd->copy()->addMinutes($existingBufferTime);
                $newEndWithBuffer = $end->copy()->addMinutes($bufferTime);
                
                \Log::info('Booking store - checking against existing', [
                    'existing_id' => $existingAppointment->id,
                    'existing_start' => $existingStart->toDateTimeString(),
                    'existing_end' => $existingEnd->toDateTimeString(),
                    'existing_end_with_buffer' => $existingEndWithBuffer->toDateTimeString(),
                    'new_end_with_buffer' => $newEndWithBuffer->toDateTimeString(),
                    'overlap' => $start->lt($existingEndWithBuffer) && $newEndWithBuffer->gt($existingStart),
                ]);
                
                // Check overlap: new slot overlaps with existing slot (including buffers)
                return $start->lt($existingEndWithBuffer) && $newEndWithBuffer->gt($existingStart);
            });

        if ($hasConflict) {
            return redirect()->back()->withErrors([
                'time' => 'Выбранное время уже занято. Пожалуйста, выберите другое время.',
            ]);
        }

        // Find or create client
        $client = $user->clients()->firstOrCreate(
            ['phone' => $request->phone],
            ['name' => $request->name]
        );

        $appointment = $user->appointments()->create([
            'client_id' => $client->id,
            'service_id' => $service->id,
            'start_time' => $start, // UTC time
            'end_time' => $end,     // UTC time
            'price' => $totalPrice,
            'status' => 'scheduled', // Maybe 'pending' if we want approval
            'notes' => 'Онлайн-запись',
        ]);

        // Attach options
        foreach ($options as $option) {
            $appointment->options()->attach($option->id, [
                'price_change' => $option->price_change,
                'duration_change' => $option->duration_change,
            ]);
        }

        // Save custom fields
        if (!empty($request->custom_fields)) {
            foreach ($request->custom_fields as $fieldId => $value) {
                // Verify field belongs to user and is public
                $field = $user->customFields()->where('is_public', true)->find($fieldId);
                if ($field && $value !== null && $value !== '') {
                    // Handle file fields - move from temp to permanent storage
                    if (in_array($field->type, ['image', 'photo', 'file']) && is_string($value) && str_starts_with($value, 'temp/booking/')) {
                        // Move file from temp to permanent location
                        $newPath = 'appointments/' . $appointment->id . '/' . basename($value);
                        if (\Storage::disk('public')->exists($value)) {
                            \Storage::disk('public')->move($value, $newPath);
                            $value = $newPath;
                        }
                    }
                    
                    $appointment->meta()->create([
                        'custom_field_id' => $field->id,
                        'value' => is_array($value) ? json_encode($value) : $value,
                    ]);
                }
            }
        }

        // Load relationships before sending notification
        $appointment->load('client', 'service');

        // Send notification to the master about new online booking
        $user->notify(new NewOnlineBooking($appointment));

        return redirect()->back()->with('success', 'Вы успешно записаны!');
    }
}
