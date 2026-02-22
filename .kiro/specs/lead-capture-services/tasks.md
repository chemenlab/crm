# Implementation Plan: Leads Module

## Overview

Реализация бесплатного модуля "Заявки" для сбора лидов без привязки к дате. Kanban-доска, комментарии, todo-листы, настраиваемые поля формы.

## Tasks

- [x] 1. Создать структуру модуля и миграции
  - [x] 1.1 Создать директорию app/Modules/Leads со всеми поддиректориями
    - Controllers, Models, Database/Migrations, Routes, Hooks
    - _Requirements: 6.1, 6.4_
  - [x] 1.2 Создать module.json манифест
    - slug: "leads", pricing: free, hooks: sidebar.menu, service.form.fields, public.booking.form, settings.sections
    - _Requirements: 6.2_
  - [x] 1.3 Создать миграцию для добавления booking_type в services
    - ENUM('appointment', 'lead') DEFAULT 'appointment'
    - _Requirements: 1.1_
  - [x] 1.4 Создать миграцию для таблицы leads
    - user_id, client_id, service_id, name, phone, message, status, position, custom_fields, converted_appointment_id
    - _Requirements: 2.3, 3.2_
  - [x] 1.5 Создать миграцию для таблицы lead_todos
    - lead_id, title, is_completed, due_date, completed_at
    - _Requirements: 4.2_
  - [x] 1.6 Создать миграцию для таблицы lead_comments
    - lead_id, user_id, content
    - _Requirements: комментарии_
  - [x] 1.7 Создать миграцию для таблицы lead_form_fields
    - user_id, label, type, options, is_required, is_active, position
    - _Requirements: настраиваемые поля_

- [x] 2. Создать модели и enum
  - [x] 2.1 Создать LeadStatus enum
    - New, InProgress, Completed, Cancelled с методами label() и color()
    - _Requirements: 3.4_
  - [x] 2.2 Создать модель Lead
    - fillable, casts, relations: user, client, service, todos, comments, convertedAppointment
    - _Requirements: 2.3, 3.2_
  - [x] 2.3 Создать модель LeadTodo
    - fillable, casts, relation: lead
    - _Requirements: 4.2_
  - [x] 2.4 Создать модель LeadComment
    - fillable, relation: lead, user
    - _Requirements: комментарии_
  - [x] 2.5 Создать модель LeadFormField
    - fillable, casts, relation: user
    - _Requirements: настраиваемые поля_

- [x] 3. Создать контроллеры и роуты
  - [x] 3.1 Создать LeadController
    - index (Kanban data), show, updateStatus, updatePosition, convert, destroy
    - _Requirements: 3.1, 3.3, 5.1, 5.2, 5.3_
  - [x] 3.2 Создать LeadTodoController
    - store, update, destroy
    - _Requirements: 4.1, 4.3_
  - [x] 3.3 Создать LeadCommentController
    - store, destroy
    - _Requirements: комментарии_
  - [x] 3.4 Создать LeadFormFieldController
    - index, store, update, destroy, reorder
    - _Requirements: настраиваемые поля_
  - [x] 3.5 Создать PublicLeadController
    - store - создание заявки с публичной страницы
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 3.6 Создать Routes/web.php с маршрутами модуля
    - _Requirements: 6.3_
  - [x] 3.7 Создать LeadsServiceProvider для регистрации роутов
    - _Requirements: 6.3_

- [x] 4. Checkpoint - Backend готов
  - Запустить миграции, проверить что модуль регистрируется
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Создать frontend компоненты (Kanban)
  - [x] 5.1 Установить @dnd-kit/core для drag-and-drop
    - npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
  - [x] 5.2 Создать LeadsKanban.tsx - главная страница
    - 4 колонки: Новые, В работе, Завершены, Отменены
    - Drag-and-drop между колонками
    - Адаптив: табы на мобильных
    - _Requirements: 3.1, 3.3_
  - [x] 5.3 Создать LeadCard.tsx - карточка в колонке
    - Имя, услуга, телефон, дата
    - Клик открывает Sheet
    - _Requirements: 3.2_
  - [x] 5.4 Создать LeadDetailSheet.tsx - детали заявки
    - Sheet справа с информацией
    - Секции: инфо, кастомные поля, комментарии, todo-лист
    - Кнопки: статус, конвертировать
    - _Requirements: 3.3, 4.4, 5.1_

- [x] 6. Создать frontend компоненты (Todo и комментарии)
  - [x] 6.1 Создать LeadTodoList.tsx
    - Список задач с чекбоксами
    - Форма добавления задачи
    - _Requirements: 4.1, 4.3, 4.4_
  - [x] 6.2 Создать LeadComments.tsx
    - Список комментариев
    - Форма добавления комментария
    - _Requirements: комментарии_

- [x] 7. Создать frontend компоненты (Настройки)
  - [x] 7.1 Создать LeadFormFieldsSettings.tsx
    - Список полей с drag-and-drop сортировкой
    - Диалог добавления/редактирования поля
    - _Requirements: настраиваемые поля_

- [x] 8. Интеграция с существующими компонентами
  - [x] 8.1 Добавить booking_type в форму услуги (Services/Index.tsx)
    - Select: "Запись на время" / "Заявка без даты"
    - Показывать только если модуль активен
    - _Requirements: 1.4_
  - [x] 8.2 Интегрировать PublicLeadForm в публичную страницу бронирования
    - Показывать вместо выбора даты для услуг с booking_type="lead"
    - Динамически рендерить кастомные поля
    - _Requirements: 1.3, 2.1_
  - [x] 8.3 Добавить пункт "Заявки" в сайдбар (если модуль активен)
    - Иконка clipboard-list
    - _Requirements: sidebar.menu hook_

- [x] 9. Уведомления
  - [x] 9.1 Создать NewLeadNotification
    - Уведомление мастеру о новой заявке
    - _Requirements: 2.4_

- [ ] 10. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.
  - Проверить полный flow: создание услуги-заявки → публичная форма → Kanban → комментарии → todo → конвертация

## Notes

- Модуль бесплатный, доступен всем пользователям
- Используем shadcn/ui компоненты для консистентного дизайна
- @dnd-kit для drag-and-drop (лучше чем react-beautiful-dnd для React 18)
- Адаптивный дизайн: на мобильных табы вместо колонок Kanban
