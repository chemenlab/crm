# Implementation Plan: Booking Time Slots

## Overview

Реализация системы настройки интервалов записи для публичной страницы мастера. Включает миграции БД, сервис генерации слотов, API эндпоинты и UI компоненты.

## Tasks

- [x] 1. Database migrations
  - [x] 1.1 Create migration to add slot_step and buffer_time to users table
    - Add `slot_step` integer column with default 30
    - Add `buffer_time` integer column with default 0
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 1.2 Create migration to add custom fields to services table
    - Add `custom_slot_step` nullable integer column
    - Add `custom_buffer_time` nullable integer column
    - _Requirements: 2.1, 2.4_

- [x] 2. Backend models and service
  - [x] 2.1 Update User model with new fields
    - Add fields to $fillable array
    - Add integer casts
    - _Requirements: 1.1, 1.3_
  - [x] 2.2 Update Service model with new fields
    - Add fields to $fillable array
    - Add integer casts
    - _Requirements: 2.1, 2.4_
  - [x] 2.3 Create TimeSlotGenerator service
    - Implement getEffectiveSlotStep() method
    - Implement getEffectiveBufferTime() method
    - Implement generateSlots() method with buffer logic
    - _Requirements: 2.2, 2.3, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_
  - [ ]* 2.4 Write property tests for TimeSlotGenerator
    - **Property 1: Effective Slot Step Resolution**
    - **Property 2: Effective Buffer Time Resolution**
    - **Property 5: No Slot Overlaps With Appointments**
    - **Property 6: Slots Fit Within Work Hours**
    - **Property 7: Slot Interval Consistency**
    - **Validates: Requirements 2.2, 2.3, 2.5, 3.1, 3.3, 3.4, 3.5**

- [x] 3. Validation and requests
  - [x] 3.1 Create BookingSettingsRequest form request
    - Validate slot_step: required, integer, min:15, max:120, divisible by 5
    - Validate buffer_time: required, integer, min:0, max:60
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  - [ ]* 3.2 Write property tests for validation
    - **Property 3: Slot Step Validation Range**
    - **Property 4: Buffer Time Validation Range**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. API controllers
  - [x] 5.1 Create BookingSettingsController
    - Implement show() method to get current settings
    - Implement update() method to save settings
    - _Requirements: 1.5, 4.1_
  - [x] 5.2 Update ServiceController to handle custom slot fields
    - Add custom_slot_step and custom_buffer_time to update validation
    - _Requirements: 2.1, 2.4_
  - [x] 5.3 Update BookingController.slots() to use TimeSlotGenerator
    - Inject TimeSlotGenerator service
    - Replace hardcoded 30-minute step with service call
    - Add buffer_time to busy intervals calculation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 6. Routes
  - [x] 6.1 Add booking settings routes
    - GET /app/settings/booking - show settings
    - PUT /app/settings/booking - update settings
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 7. Frontend components
  - [x] 7.1 Create BookingSettings page component
    - Dropdown for slot_step (15, 30, 45, 60 minutes)
    - Dropdown for buffer_time (0, 5, 10, 15, 30 minutes)
    - Save button with success toast
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 7.2 Update Service edit form
    - Add optional custom_slot_step dropdown
    - Add optional custom_buffer_time dropdown
    - Add hint about global settings fallback
    - _Requirements: 4.4, 4.5_
  - [x] 7.3 Add booking settings link to settings navigation
    - Add menu item in settings sidebar
    - _Requirements: 4.1_

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 9. Integration tests
  - [ ]* 9.1 Write API tests for booking settings
    - Test GET /app/settings/booking returns current values
    - Test PUT /app/settings/booking updates values
    - Test validation errors for invalid values
    - **Property 8: Settings Persistence Round-Trip**
    - **Validates: Requirements 1.5, 5.1-5.5**
  - [ ]* 9.2 Write API tests for public booking slots
    - Test slots endpoint uses effective slot_step
    - Test slots endpoint respects buffer_time
    - Test service-specific overrides work correctly
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
