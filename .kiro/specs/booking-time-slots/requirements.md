# Requirements Document

## Introduction

Система настройки интервалов записи для публичной страницы мастера. Позволяет мастеру гибко настраивать временные слоты для онлайн-записи: шаг сетки времени, перерывы между клиентами, и индивидуальные настройки для каждой услуги.

## Glossary

- **Booking_System**: Система онлайн-записи на публичной странице мастера
- **Time_Slot**: Доступный временной интервал для записи клиента
- **Slot_Step**: Шаг сетки времени (интервал между началами слотов)
- **Buffer_Time**: Перерыв между записями (время на подготовку между клиентами)
- **Service_Duration**: Длительность услуги в минутах
- **Master**: Пользователь системы, предоставляющий услуги
- **Booking_Settings**: Настройки записи мастера

## Requirements

### Requirement 1: Глобальные настройки интервалов записи

**User Story:** As a мастер, I want настроить базовый шаг сетки времени для записи, so that клиенты видят удобные временные слоты.

#### Acceptance Criteria

1. THE Booking_Settings SHALL include a slot_step field with values: 15, 30, 45, 60 minutes
2. WHEN slot_step is not configured, THE Booking_System SHALL use 30 minutes as default
3. THE Booking_Settings SHALL include a buffer_time field with values: 0, 5, 10, 15, 30 minutes
4. WHEN buffer_time is not configured, THE Booking_System SHALL use 0 minutes as default
5. WHEN a Master updates booking settings, THE Booking_System SHALL persist the changes immediately

### Requirement 2: Индивидуальные настройки услуг

**User Story:** As a мастер, I want настроить индивидуальный шаг записи для каждой услуги, so that длинные услуги имеют подходящую сетку времени.

#### Acceptance Criteria

1. THE Service model SHALL include an optional custom_slot_step field
2. WHEN custom_slot_step is set for a service, THE Booking_System SHALL use it instead of global slot_step
3. WHEN custom_slot_step is null, THE Booking_System SHALL use the global slot_step
4. THE Service model SHALL include an optional custom_buffer_time field
5. WHEN custom_buffer_time is set for a service, THE Booking_System SHALL use it instead of global buffer_time

### Requirement 3: Генерация временных слотов

**User Story:** As a клиент, I want видеть доступные временные слоты с учётом настроек мастера, so that я могу выбрать удобное время.

#### Acceptance Criteria

1. WHEN generating time slots, THE Booking_System SHALL use the effective slot_step (service-specific or global)
2. WHEN generating time slots, THE Booking_System SHALL add buffer_time after each existing appointment
3. THE Booking_System SHALL NOT show slots that overlap with existing appointments plus buffer_time
4. THE Booking_System SHALL NOT show slots where service_duration + buffer_time exceeds remaining work time
5. WHEN a slot would start during buffer_time of previous appointment, THE Booking_System SHALL exclude it

### Requirement 4: Интерфейс настроек

**User Story:** As a мастер, I want удобный интерфейс для настройки интервалов записи, so that я могу легко управлять расписанием.

#### Acceptance Criteria

1. THE Settings_Page SHALL display current slot_step and buffer_time values
2. THE Settings_Page SHALL provide dropdown selectors for slot_step and buffer_time
3. WHEN Master saves settings, THE Settings_Page SHALL show success confirmation
4. THE Service_Edit_Page SHALL display optional custom_slot_step and custom_buffer_time fields
5. THE Service_Edit_Page SHALL show hint that empty values use global settings

### Requirement 5: Валидация настроек

**User Story:** As a система, I want валидировать настройки интервалов, so that некорректные значения не нарушают работу записи.

#### Acceptance Criteria

1. IF slot_step is less than 15 minutes, THEN THE Booking_System SHALL reject the value
2. IF slot_step is greater than 120 minutes, THEN THE Booking_System SHALL reject the value
3. IF buffer_time is negative, THEN THE Booking_System SHALL reject the value
4. IF buffer_time is greater than 60 minutes, THEN THE Booking_System SHALL reject the value
5. THE Booking_System SHALL validate that slot_step is divisible by 5

### Requirement 6: Обратная совместимость

**User Story:** As a существующий пользователь, I want чтобы система работала как раньше без дополнительных настроек, so that мой бизнес не пострадает.

#### Acceptance Criteria

1. WHEN booking settings do not exist, THE Booking_System SHALL create default settings automatically
2. THE default slot_step SHALL be 30 minutes (current behavior)
3. THE default buffer_time SHALL be 0 minutes (current behavior)
4. WHEN migrating existing users, THE Booking_System SHALL preserve current behavior
