# Requirements Document: Support Ticket System

## Introduction

Система тикетов технической поддержки для MasterPlan CRM позволяет пользователям сервиса (мастерам) обращаться к администраторам платформы с вопросами и проблемами по работе сервиса. Администраторы обрабатывают обращения и помогают решать технические проблемы.

## Glossary

- **Support_System**: Система технической поддержки сервиса
- **Support_Ticket**: Обращение пользователя в техподдержку
- **User**: Пользователь сервиса (мастер), создающий тикеты
- **Admin**: Администратор платформы, обрабатывающий тикеты
- **Message**: Сообщение в рамках тикета
- **Status**: Статус тикета (новый, в работе, ожидает ответа, решен, закрыт)
- **Priority**: Приоритет тикета (низкий, средний, высокий, критический)
- **Category**: Категория тикета (технический вопрос, ошибка, запрос функции, вопрос по оплате, другое)
- **Attachment**: Прикрепленный файл к тикету или сообщению

## Requirements

### Requirement 1: Создание тикетов пользователями

**User Story:** As a user, I want to create support tickets, so that I can get help with technical issues or questions about the service.

#### Acceptance Criteria

1. WHEN a user is logged in, THE Support_System SHALL display a "Support" or "Help" button in navigation
2. WHEN a user creates a ticket, THE Support_System SHALL require a subject and description
3. WHEN a user creates a ticket, THE Support_System SHALL allow selecting a category
4. WHEN a user creates a ticket, THE Support_System SHALL allow selecting a priority (default: medium)
5. WHEN a user creates a ticket, THE Support_System SHALL allow attaching files (screenshots, logs, documents)
6. WHEN a ticket is created, THE Support_System SHALL set status to "new"
7. WHEN a ticket is created, THE Support_System SHALL send email notification to administrators
8. WHEN a ticket is created, THE Support_System SHALL display success message with ticket number

### Requirement 2: Просмотр тикетов пользователями

**User Story:** As a user, I want to view my support tickets, so that I can track the status of my requests.

#### Acceptance Criteria

1. WHEN a user accesses support page, THE Support_System SHALL display all tickets created by this user
2. WHEN displaying tickets list, THE Support_System SHALL show ticket number, subject, status, priority, and creation date
3. WHEN a user clicks on a ticket, THE Support_System SHALL display full ticket details
4. WHEN displaying ticket details, THE Support_System SHALL show all messages in chronological order
5. WHEN displaying ticket details, THE Support_System SHALL show attached files with download links
6. WHEN a user views tickets list, THE Support_System SHALL allow filtering by status
7. WHEN a user views tickets list, THE Support_System SHALL allow sorting by date or priority
8. WHEN a user has unread messages, THE Support_System SHALL display notification badge

### Requirement 3: Ответы на тикеты пользователями

**User Story:** As a user, I want to reply to my tickets, so that I can provide additional information or continue the conversation.

#### Acceptance Criteria

1. WHEN a user views an open ticket, THE Support_System SHALL display a reply form
2. WHEN a user replies to a ticket, THE Support_System SHALL require message text
3. WHEN a user replies to a ticket, THE Support_System SHALL allow attaching files
4. WHEN a user sends a reply, THE Support_System SHALL add the message to ticket history
5. WHEN a user sends a reply, THE Support_System SHALL send email notification to administrators
6. IF a ticket status is "waiting_for_user", WHEN a user replies, THEN THE Support_System SHALL change status to "in_progress"

### Requirement 4: Закрытие тикетов пользователями

**User Story:** As a user, I want to close resolved tickets, so that I can confirm the issue is resolved.

#### Acceptance Criteria

1. WHEN a ticket status is "resolved", THE Support_System SHALL display a "Close ticket" button to the user
2. WHEN a user closes a ticket, THE Support_System SHALL change status to "closed"
3. WHEN a ticket is closed, THE Support_System SHALL prevent further replies
4. WHEN a ticket is closed, THE Support_System SHALL allow the user to reopen it within 30 days
5. WHEN a user reopens a ticket, THE Support_System SHALL change status to "in_progress"

### Requirement 5: Просмотр всех тикетов администратором

**User Story:** As an administrator, I want to view all support tickets, so that I can manage user requests.

#### Acceptance Criteria

1. WHEN an administrator accesses admin support page, THE Support_System SHALL display all tickets from all users
2. WHEN displaying tickets list, THE Support_System SHALL show ticket number, user name, subject, status, priority, and creation date
3. WHEN an administrator clicks on a ticket, THE Support_System SHALL display full ticket details
4. WHEN displaying ticket details, THE Support_System SHALL show user information (name, email, subscription plan)
5. WHEN an administrator views tickets list, THE Support_System SHALL allow filtering by status, priority, category, and user
6. WHEN an administrator views tickets list, THE Support_System SHALL allow sorting by date, priority, or user
7. WHEN an administrator views tickets list, THE Support_System SHALL highlight unread tickets
8. WHEN an administrator views tickets list, THE Support_System SHALL show assigned administrator

### Requirement 6: Ответы на тикеты администратором

**User Story:** As an administrator, I want to reply to tickets, so that I can help users with their issues.

#### Acceptance Criteria

1. WHEN an administrator views a ticket, THE Support_System SHALL display a reply form
2. WHEN an administrator replies to a ticket, THE Support_System SHALL require message text
3. WHEN an administrator replies to a ticket, THE Support_System SHALL allow attaching files
4. WHEN an administrator sends a reply, THE Support_System SHALL add the message to ticket history
5. WHEN an administrator sends a reply, THE Support_System SHALL send email notification to the user
6. IF a ticket status is "new", WHEN an administrator replies, THEN THE Support_System SHALL change status to "in_progress"
7. WHEN an administrator replies, THE Support_System SHALL update first_response_at timestamp if not set

### Requirement 7: Управление статусами тикетов администратором

**User Story:** As an administrator, I want to change ticket statuses, so that I can organize my workflow.

#### Acceptance Criteria

1. WHEN an administrator views a ticket, THE Support_System SHALL display status change options
2. WHEN an administrator changes ticket status, THE Support_System SHALL update the status immediately
3. WHEN an administrator marks ticket as "waiting_for_user", THE Support_System SHALL send email notification to the user
4. WHEN an administrator marks ticket as "resolved", THE Support_System SHALL send email notification to the user
5. WHEN an administrator marks ticket as "resolved", THE Support_System SHALL ask for resolution summary
6. WHEN a ticket is marked as "resolved", THE Support_System SHALL allow the user to close or reopen it

### Requirement 8: Назначение тикетов администраторам

**User Story:** As an administrator, I want to assign tickets to specific administrators, so that work can be distributed.

#### Acceptance Criteria

1. WHEN an administrator views a ticket, THE Support_System SHALL display an "Assign" button
2. WHEN assigning a ticket, THE Support_System SHALL show list of all administrators
3. WHEN a ticket is assigned, THE Support_System SHALL send email notification to assigned administrator
4. WHEN a ticket is assigned, THE Support_System SHALL display assigned administrator name on ticket
5. WHEN filtering tickets, THE Support_System SHALL allow filtering by assigned administrator
6. WHEN an administrator views tickets list, THE Support_System SHALL show "My tickets" filter

### Requirement 9: Внутренние заметки администратора

**User Story:** As an administrator, I want to add internal notes to tickets, so that I can communicate with other administrators without user seeing it.

#### Acceptance Criteria

1. WHEN an administrator views a ticket, THE Support_System SHALL display an "Add internal note" button
2. WHEN adding internal note, THE Support_System SHALL clearly mark it as internal
3. WHEN displaying ticket messages, THE Support_System SHALL show internal notes only to administrators
4. WHEN displaying ticket messages, THE Support_System SHALL visually distinguish internal notes from regular messages
5. WHEN an internal note is added, THE Support_System SHALL NOT send notification to the user

### Requirement 10: Уведомления о тикетах

**User Story:** As a user, I want to receive notifications about ticket updates, so that I can respond promptly.

#### Acceptance Criteria

1. WHEN a new ticket is created, THE Support_System SHALL send email notification to all administrators
2. WHEN an administrator replies to a ticket, THE Support_System SHALL send email notification to the user
3. WHEN a user replies to a ticket, THE Support_System SHALL send email notification to assigned administrator
4. WHEN a ticket status changes to "resolved", THE Support_System SHALL send email notification to the user
5. WHEN email notifications are sent, THE Support_System SHALL include ticket number, subject, and link to ticket
6. WHEN a user has unread messages in tickets, THE Support_System SHALL display notification badge in navigation


### Requirement 11: Прикрепление файлов к тикетам

**User Story:** As a user, I want to attach files to tickets, so that I can provide screenshots or error logs.

#### Acceptance Criteria

1. WHEN creating or replying to a ticket, THE Support_System SHALL allow uploading files
2. WHEN a file is uploaded, THE Support_System SHALL validate file type (images, PDF, documents, logs)
3. WHEN a file is uploaded, THE Support_System SHALL validate file size (max 10MB per file)
4. WHEN a file is uploaded, THE Support_System SHALL store it securely
5. WHEN displaying ticket messages, THE Support_System SHALL show attached files with download links
6. WHEN a user clicks on an image attachment, THE Support_System SHALL display it in a lightbox
7. WHEN a ticket is deleted, THE Support_System SHALL delete all associated files

### Requirement 12: Категории и приоритеты тикетов

**User Story:** As an administrator, I want to categorize and prioritize tickets, so that I can organize work efficiently.

#### Acceptance Criteria

1. THE Support_System SHALL support categories: "technical", "bug", "feature_request", "billing", "other"
2. THE Support_System SHALL support priorities: "low", "medium", "high", "critical"
3. WHEN creating a ticket, THE Support_System SHALL allow selecting a category
4. WHEN creating a ticket, THE Support_System SHALL allow selecting a priority (default: "medium")
5. WHEN an administrator views a ticket, THE Support_System SHALL allow changing category and priority
6. WHEN filtering tickets, THE Support_System SHALL allow filtering by category and priority
7. WHEN displaying tickets list, THE Support_System SHALL visually distinguish critical tickets

### Requirement 13: Поиск по тикетам

**User Story:** As a user, I want to search tickets, so that I can quickly find specific tickets.

#### Acceptance Criteria

1. WHEN a user accesses support page, THE Support_System SHALL display a search field
2. WHEN a user enters search query, THE Support_System SHALL search in ticket subjects and descriptions
3. WHEN a user enters search query, THE Support_System SHALL search in message content
4. WHEN displaying search results, THE Support_System SHALL highlight matching text
5. WHEN search returns no results, THE Support_System SHALL display "No tickets found" message

### Requirement 14: Статистика по тикетам для администратора

**User Story:** As an administrator, I want to see ticket statistics, so that I can monitor support quality.

#### Acceptance Criteria

1. WHEN an administrator accesses admin dashboard, THE Support_System SHALL display total number of tickets
2. WHEN displaying statistics, THE Support_System SHALL show number of open tickets
3. WHEN displaying statistics, THE Support_System SHALL show number of resolved tickets
4. WHEN displaying statistics, THE Support_System SHALL show average response time
5. WHEN displaying statistics, THE Support_System SHALL show average resolution time
6. WHEN displaying statistics, THE Support_System SHALL show tickets by category breakdown
7. WHEN displaying statistics, THE Support_System SHALL show tickets by priority breakdown
8. WHEN displaying statistics, THE Support_System SHALL show tickets by administrator breakdown

### Requirement 15: Автоматическое закрытие неактивных тикетов

**User Story:** As a system, I want to automatically close inactive resolved tickets, so that the ticket list stays clean.

#### Acceptance Criteria

1. WHEN a ticket has status "resolved" for 30 days without user response, THE Support_System SHALL automatically close it
2. WHEN a ticket is auto-closed, THE Support_System SHALL send email notification to the user
3. WHEN a ticket is auto-closed, THE Support_System SHALL add system message explaining auto-closure
4. WHEN a ticket is auto-closed, THE Support_System SHALL allow the user to reopen it within 30 days

### Requirement 16: Шаблоны ответов для администратора

**User Story:** As an administrator, I want to use response templates, so that I can reply faster to common questions.

#### Acceptance Criteria

1. WHEN an administrator accesses admin settings, THE Support_System SHALL allow creating response templates
2. WHEN creating a template, THE Support_System SHALL require template name and content
3. WHEN replying to a ticket, THE Support_System SHALL display a button to insert template
4. WHEN an administrator selects a template, THE Support_System SHALL insert template content into reply field
5. WHEN an administrator uses a template, THE Support_System SHALL allow editing the content before sending
6. THE Support_System SHALL support variables in templates: {user_name}, {ticket_number}, {admin_name}

### Requirement 17: Экспорт тикетов администратором

**User Story:** As an administrator, I want to export ticket data, so that I can analyze it externally or create reports.

#### Acceptance Criteria

1. WHEN an administrator views tickets list, THE Support_System SHALL display an "Export" button
2. WHEN an administrator clicks export, THE Support_System SHALL allow selecting export format (CSV, Excel)
3. WHEN exporting tickets, THE Support_System SHALL include all ticket fields and message count
4. WHEN exporting tickets, THE Support_System SHALL respect current filters
5. WHEN export is complete, THE Support_System SHALL download the file automatically

### Requirement 18: Оценка качества поддержки

**User Story:** As a user, I want to rate the support quality, so that I can provide feedback.

#### Acceptance Criteria

1. WHEN a ticket is closed, THE Support_System SHALL ask the user to rate the support (1-5 stars)
2. WHEN a user rates support, THE Support_System SHALL allow adding optional comment
3. WHEN displaying ticket details, THE Support_System SHALL show rating and comment to administrators
4. WHEN displaying statistics, THE Support_System SHALL show average rating
5. WHEN displaying statistics, THE Support_System SHALL show ratings by administrator

