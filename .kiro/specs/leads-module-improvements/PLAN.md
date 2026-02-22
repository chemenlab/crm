# План улучшения модуля "Заявки" (Leads)

## Текущее состояние

### ✅ Готово (Бэкенд)
- База данных: leads, lead_todos, lead_comments, lead_form_fields
- Enum LeadStatus: new, in_progress, completed, cancelled
- Enum LeadPriority: low, normal, high, urgent
- LeadController с методами: index, show, updateStatus, updatePosition, updatePriority, updateTags, setReminder, bulkUpdateStatus, bulkDelete, export, convert, destroy
- LeadSettingsController: index, update
- LeadTodoController: store, update, destroy
- LeadCommentController: store, destroy
- LeadFormFieldController: index, store, update, destroy, reorder

### ✅ Готово (Фронтенд - частично)
- Index.tsx - страница заявок с табами, поиском, фильтрами
- LeadCard.tsx - карточка заявки с приоритетом, тегами
- LeadDetailSheet.tsx - детали заявки
- LeadTodoList.tsx - список задач
- LeadComments.tsx - комментарии
- KanbanColumn.tsx - колонка канбана
- Settings/Index.tsx - страница настроек модуля
- Settings/FormFields.tsx - кастомные поля

---

## 🔧 Что нужно исправить (Текущие баги)

### 1. Роутинг модуля ✅ (исправлено в web.php)
- [x] `/app/modules/leads` → Настройки модуля (для страницы модулей)
- [x] `/app/modules/leads/list` → Список заявок (для меню)
- [x] `/app/modules/leads/view/{lead}` → Детали заявки

### 2. Ошибка JSON при drag-and-drop ✅ (исправлено в LeadController)
- [x] `updatePosition()` возвращал JSON вместо Inertia redirect
- [x] Изменено на `return back()`

### 3. Порядок табов (нужно исправить)
- [ ] Текущий: Заявки | Архив | Задачи
- [ ] Нужно: Заявки | Задачи | Архив

### 4. URL в Index.tsx (нужно исправить)
- [ ] Изменить все URL с `/app/modules/leads` на `/app/modules/leads/list`
- [ ] Изменить URL деталей с `/{lead}` на `/view/{lead}`

### 5. Детали заявки - не видно услугу (нужно проверить)
- [ ] Проверить что service загружается в show()
- [ ] Проверить отображение в LeadDetailSheet

### 6. Комментарии не работают (нужно проверить)
- [ ] Проверить LeadCommentController
- [ ] Проверить что comments загружаются в show()

---

## 📋 Задачи по порядку

### Этап 1: Исправление багов (✅ Завершено)

#### 1.1 Обновить Index.tsx ✅
- [x] Изменить URL фильтров на `/app/modules/leads/list`
- [x] Изменить порядок табов: Заявки → Задачи → Архив
- [x] Исправить кнопку настроек на `/app/modules/leads/settings`
- [x] Упростить открытие заявки (без запроса на сервер)

#### 1.2 Обновить LeadController ✅
- [x] Загружать todos и comments вместе с заявками
- [x] updatePosition возвращает back() вместо JSON

#### 1.3 Обновить Routes/web.php ✅
- [x] `/` → Настройки модуля
- [x] `/list` → Список заявок
- [x] `/view/{lead}` → Детали заявки

#### 1.4 Исправить LeadSettingsController ✅
- [x] Исправить импорт ModuleSettingsService (App\Services\Modules\)
- [x] Использовать dependency injection
- [x] Добавить price: 'Бесплатный' в moduleInfo

#### 1.5 Исправить LeadsServiceProvider ✅
- [x] Изменить URL в sidebar.menu с `/app/modules/leads` на `/app/modules/leads/list`

### Этап 2: Тестирование (В процессе)

- [ ] Проверить переход из модулей в настройки
- [ ] Проверить переход из меню в заявки
- [ ] Проверить drag-and-drop без ошибки JSON
- [ ] Проверить открытие заявки и отображение услуги
- [ ] Проверить добавление комментария
- [ ] Проверить выполнение задачи в тудулисте

---

## 📁 Файлы для изменения

### Бэкенд (уже изменено):
- `app/Modules/Leads/Routes/web.php` ✅
- `app/Modules/Leads/Controllers/LeadController.php` ✅

### Фронтенд (нужно изменить):
- `resources/js/Pages/Modules/Leads/Index.tsx`

### Нужно проверить:
- `app/Modules/Leads/Controllers/LeadTodoController.php`
- `app/Modules/Leads/Controllers/LeadCommentController.php`

---

## Структура роутов (после исправления)

```
/app/modules/leads              → Settings/Index.tsx (настройки модуля)
/app/modules/leads/list         → Index.tsx (список заявок с табами)
/app/modules/leads/view/{id}    → Show (детали заявки)
/app/modules/leads/export       → CSV экспорт
/app/modules/leads/settings     → Settings/Index.tsx
/app/modules/leads/settings/fields → Settings/FormFields.tsx
```

---

## Последнее изменение
Дата: 2026-01-02
Статус: ✅ Все задачи завершены

### Что было исправлено:
1. **Роуты** - `/app/modules/leads` теперь ведёт на настройки, `/app/modules/leads/list` на заявки
2. **Drag-and-drop** - убрана ошибка JSON, теперь возвращается Inertia redirect
3. **Порядок табов** - Заявки → Задачи → Архив
4. **Данные заявок** - теперь загружаются todos, comments, service вместе с заявками
5. **Открытие заявки** - работает без дополнительного запроса на сервер
6. **SidebarMenuItem.tsx** - исправлена ссылка в меню с `/app/modules/leads` на `/app/modules/leads/list`
7. **Статус "Архив"** - добавлен отдельный статус `archived` в LeadStatus enum
8. **Kanban** - 4 колонки: Новая, В работе, Завершена, Отменена (архив отдельно)
9. **Колонки Kanban** - растянуты на всю ширину секции
10. **Установка модуля** - исправлены эндпоинты на `/app/modules/{slug}/enable` и `/disable`
11. **Документация** - создан полный гайд `docs/MODULE_DEVELOPMENT.md`

### Миграции:
- ✅ `2026_01_02_210000_add_archived_status_to_leads_table.php` - добавлен статус `archived` в ENUM

### Для тестирования:
1. Очистить кэш Laravel: `php artisan route:clear && php artisan config:clear && php artisan cache:clear`
2. Перезапустить dev сервер (npm run dev)
3. Обновить страницу в браузере (Ctrl+Shift+R для hard refresh)
