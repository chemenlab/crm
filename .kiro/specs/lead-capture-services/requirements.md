# Requirements Document

## Introduction

Бесплатный модуль для услуг без привязки к дате/времени - сбор заявок (лидов) вместо бронирования конкретного времени. Позволяет мастерам предлагать услуги типа "разработка сайта", "консультация по запросу" и вести учёт заявок с возможностью управления через todo-лист.

**Тип: Модуль (бесплатный)**
**Slug: leads**

## Glossary

- **Lead_Service**: Услуга с типом "заявка" (без выбора даты/времени)
- **Lead**: Заявка на услугу без привязки к конкретному времени
- **Lead_Status**: Статус заявки (new, in_progress, completed, cancelled)
- **Todo_Item**: Задача привязанная к заявке для отслеживания прогресса

## Requirements

### Requirement 1: Тип услуги

**User Story:** As a мастер, I want to указать тип услуги (с бронированием или заявка), so that я могу предлагать услуги без привязки к календарю.

#### Acceptance Criteria

1. THE Service_Model SHALL have a booking_type field with values "appointment" or "lead"
2. WHEN booking_type is "appointment" THEN THE System SHALL show date/time selection on public page
3. WHEN booking_type is "lead" THEN THE System SHALL show only contact form without date/time selection
4. THE Service_Form SHALL allow selecting booking_type when creating/editing service

### Requirement 2: Форма заявки на публичной странице

**User Story:** As a клиент, I want to оставить заявку на услугу без выбора даты, so that я могу заказать услугу типа "разработка сайта".

#### Acceptance Criteria

1. WHEN a lead service is selected THEN THE Public_Page SHALL display contact form without date/time picker
2. THE Lead_Form SHALL collect name, phone, and optional message
3. WHEN lead form is submitted THEN THE System SHALL create a Lead record
4. WHEN lead is created THEN THE System SHALL notify the master

### Requirement 3: Управление заявками

**User Story:** As a мастер, I want to видеть и управлять заявками, so that я могу отслеживать и обрабатывать их.

#### Acceptance Criteria

1. THE Dashboard SHALL display leads in a separate section or tab
2. THE Lead_List SHALL show client name, phone, service, status, and created date
3. WHEN viewing a lead THEN THE Master SHALL be able to change its status
4. THE Lead_Statuses SHALL include: new, in_progress, completed, cancelled

### Requirement 4: Todo-лист для заявок

**User Story:** As a мастер, I want to добавлять задачи к заявке, so that я могу отслеживать прогресс работы.

#### Acceptance Criteria

1. WHEN viewing a lead THEN THE Master SHALL be able to add todo items
2. THE Todo_Item SHALL have title, completed status, and optional due date
3. WHEN a todo item is toggled THEN THE System SHALL update its completed status
4. THE Lead_Detail_Page SHALL display all todo items for that lead

### Requirement 5: Конвертация заявки в запись

**User Story:** As a мастер, I want to конвертировать заявку в запись с датой, so that я могу назначить встречу после согласования.

#### Acceptance Criteria

1. WHEN viewing a lead THEN THE Master SHALL have option to convert to appointment
2. WHEN converting THEN THE System SHALL open appointment creation form with pre-filled client data
3. WHEN appointment is created from lead THEN THE Lead SHALL be marked as completed
4. THE Appointment SHALL reference the original lead_id


### Requirement 6: Модульная структура

**User Story:** As a разработчик, I want to реализовать функционал как модуль, so that он может быть включен/выключен пользователями.

#### Acceptance Criteria

1. THE Module SHALL be located in app/Modules/Leads directory
2. THE Module SHALL have manifest.json with slug "leads" and free pricing
3. THE Module SHALL register routes via module hooks
4. THE Module SHALL have its own models, controllers, and views
5. WHEN module is disabled THEN THE Lead_Services SHALL behave as regular appointment services
6. THE Module SHALL integrate with existing Service model via booking_type field
