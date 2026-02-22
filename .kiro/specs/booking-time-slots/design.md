# Design Document: Booking Time Slots

## Overview

Система настройки интервалов записи позволяет мастерам гибко управлять временными слотами на публичной странице. Мастер может настроить глобальный шаг сетки времени и перерыв между клиентами, а также переопределить эти значения для отдельных услуг.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/Inertia)                  │
├─────────────────────────────────────────────────────────────┤
│  Settings Page          │  Service Edit Page                │
│  - slot_step dropdown   │  - custom_slot_step (optional)    │
│  - buffer_time dropdown │  - custom_buffer_time (optional)  │
└─────────────────────────┴───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Laravel)                         │
├─────────────────────────────────────────────────────────────┤
│  BookingSettingsController  │  ServiceController             │
│  - update()                 │  - update() (extended)         │
└─────────────────────────────┴───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Slot Generation Service                   │
├─────────────────────────────────────────────────────────────┤
│  TimeSlotGenerator                                           │
│  - getEffectiveSlotStep(service, user)                      │
│  - getEffectiveBufferTime(service, user)                    │
│  - generateSlots(date, service, user)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database                                  │
├─────────────────────────────────────────────────────────────┤
│  users table              │  services table                  │
│  + slot_step (int)        │  + custom_slot_step (int|null)   │
│  + buffer_time (int)      │  + custom_buffer_time (int|null) │
└───────────────────────────┴─────────────────────────────────┘
```

## Components and Interfaces

### 1. Database Schema Changes

#### Users Table (migration)
```php
Schema::table('users', function (Blueprint $table) {
    $table->integer('slot_step')->default(30);      // 15, 30, 45, 60
    $table->integer('buffer_time')->default(0);     // 0, 5, 10, 15, 30
});
```

#### Services Table (migration)
```php
Schema::table('services', function (Blueprint $table) {
    $table->integer('custom_slot_step')->nullable();    // Override global
    $table->integer('custom_buffer_time')->nullable();  // Override global
});
```

### 2. TimeSlotGenerator Service

```php
class TimeSlotGenerator
{
    public function getEffectiveSlotStep(Service $service, User $user): int
    {
        return $service->custom_slot_step ?? $user->slot_step ?? 30;
    }

    public function getEffectiveBufferTime(Service $service, User $user): int
    {
        return $service->custom_buffer_time ?? $user->buffer_time ?? 0;
    }

    public function generateSlots(
        Carbon $date,
        Service $service,
        User $user,
        int $duration
    ): Collection {
        $slotStep = $this->getEffectiveSlotStep($service, $user);
        $bufferTime = $this->getEffectiveBufferTime($service, $user);
        
        // Get work hours
        $schedule = $user->userSchedules()
            ->where('day_of_week', $date->dayOfWeek)
            ->first();
            
        if (!$schedule || !$schedule->is_working) {
            return collect([]);
        }
        
        $workStart = $date->copy()->setTimeFrom($schedule->start_time);
        $workEnd = $date->copy()->setTimeFrom($schedule->end_time);
        
        // Get busy intervals with buffer
        $busyIntervals = $this->getBusyIntervalsWithBuffer(
            $user, $date, $bufferTime
        );
        
        // Generate candidate slots
        $slots = collect();
        $current = $workStart->copy();
        
        while ($current->lt($workEnd)) {
            $slotEnd = $current->copy()->addMinutes($duration);
            
            // Check if slot fits in work hours (including buffer for next client)
            if ($slotEnd->addMinutes($bufferTime)->gt($workEnd)) {
                break;
            }
            
            // Check if slot overlaps with busy intervals
            if (!$this->overlapsWithBusy($current, $slotEnd, $busyIntervals)) {
                $slots->push($current->format('H:i'));
            }
            
            $current->addMinutes($slotStep);
        }
        
        return $slots;
    }
    
    private function getBusyIntervalsWithBuffer(
        User $user, 
        Carbon $date, 
        int $bufferTime
    ): Collection {
        return $user->appointments()
            ->whereDate('start_time', $date)
            ->whereIn('status', ['scheduled', 'confirmed'])
            ->get()
            ->map(fn($app) => [
                'start' => Carbon::parse($app->start_time),
                'end' => Carbon::parse($app->end_time)->addMinutes($bufferTime),
            ]);
    }
    
    private function overlapsWithBusy(
        Carbon $slotStart, 
        Carbon $slotEnd, 
        Collection $busyIntervals
    ): bool {
        foreach ($busyIntervals as $interval) {
            if ($slotStart->lt($interval['end']) && $slotEnd->gt($interval['start'])) {
                return true;
            }
        }
        return false;
    }
}
```

### 3. Validation Rules

```php
class BookingSettingsRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'slot_step' => [
                'required',
                'integer',
                'min:15',
                'max:120',
                function ($attribute, $value, $fail) {
                    if ($value % 5 !== 0) {
                        $fail('Шаг должен быть кратен 5 минутам.');
                    }
                },
            ],
            'buffer_time' => [
                'required',
                'integer',
                'min:0',
                'max:60',
            ],
        ];
    }
}
```

### 4. API Endpoints

```
PUT /api/settings/booking
    Body: { slot_step: 30, buffer_time: 15 }
    Response: { success: true, data: { slot_step: 30, buffer_time: 15 } }

PUT /api/services/{id}
    Body: { ..., custom_slot_step: 60, custom_buffer_time: 15 }
    Response: { success: true, data: Service }
```

## Data Models

### User Model (extended)
```php
protected $fillable = [
    // ... existing fields
    'slot_step',
    'buffer_time',
];

protected $casts = [
    // ... existing casts
    'slot_step' => 'integer',
    'buffer_time' => 'integer',
];
```

### Service Model (extended)
```php
protected $fillable = [
    // ... existing fields
    'custom_slot_step',
    'custom_buffer_time',
];

protected $casts = [
    // ... existing casts
    'custom_slot_step' => 'integer',
    'custom_buffer_time' => 'integer',
];
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Effective Slot Step Resolution

*For any* service and user combination, the effective slot_step should equal service.custom_slot_step if set, otherwise user.slot_step if set, otherwise 30 (default).

**Validates: Requirements 2.2, 2.3, 1.2**

### Property 2: Effective Buffer Time Resolution

*For any* service and user combination, the effective buffer_time should equal service.custom_buffer_time if set, otherwise user.buffer_time if set, otherwise 0 (default).

**Validates: Requirements 2.5, 1.4**

### Property 3: Slot Step Validation Range

*For any* slot_step value, validation should pass if and only if: 15 ≤ slot_step ≤ 120 AND slot_step % 5 == 0.

**Validates: Requirements 5.1, 5.2, 5.5**

### Property 4: Buffer Time Validation Range

*For any* buffer_time value, validation should pass if and only if: 0 ≤ buffer_time ≤ 60.

**Validates: Requirements 5.3, 5.4**

### Property 5: No Slot Overlaps With Appointments

*For any* generated time slot and any existing appointment, the slot interval [slot_start, slot_start + duration] should not overlap with [appointment_start, appointment_end + buffer_time].

**Validates: Requirements 3.3, 3.5**

### Property 6: Slots Fit Within Work Hours

*For any* generated time slot, slot_start + duration should not exceed work_end.

**Validates: Requirements 3.4**

### Property 7: Slot Interval Consistency

*For any* two consecutive generated slots, the difference between their start times should equal the effective slot_step.

**Validates: Requirements 3.1**

### Property 8: Settings Persistence Round-Trip

*For any* valid booking settings, after saving and reloading, the values should be identical to what was saved.

**Validates: Requirements 1.5**

### Property 9: Default Settings Auto-Creation

*For any* user without booking settings, accessing their effective slot_step should return 30 and buffer_time should return 0.

**Validates: Requirements 6.1, 6.2, 6.3**

## Error Handling

| Error Case | Response | HTTP Code |
|------------|----------|-----------|
| Invalid slot_step value | Validation error with message | 422 |
| Invalid buffer_time value | Validation error with message | 422 |
| Service not found | Not found error | 404 |
| Unauthorized access | Forbidden error | 403 |

## Testing Strategy

### Unit Tests
- TimeSlotGenerator.getEffectiveSlotStep() with various combinations
- TimeSlotGenerator.getEffectiveBufferTime() with various combinations
- Validation rules for slot_step and buffer_time
- Slot generation with edge cases (empty day, full day, breaks)

### Property-Based Tests
- Use Pest PHP with faker for property-based testing
- Minimum 100 iterations per property test
- Test slot generation invariants across random schedules and appointments

### Integration Tests
- API endpoint tests for settings update
- API endpoint tests for service update with custom values
- Public booking page slot generation with various configurations

### Test Configuration
- Property tests tagged with: **Feature: booking-time-slots, Property N: {property_text}**
- Use `pest-plugin-faker` for random data generation
