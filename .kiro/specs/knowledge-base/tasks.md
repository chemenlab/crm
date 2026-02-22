# Implementation Plan: База знаний (Knowledge Base)

## Overview

Реализация системы базы знаний для замены существующей системы подсказок. Включает backend (Laravel), frontend (React + shadcn/ui), миграции БД, и полное удаление старой системы подсказок.

## Tasks

- [x] 1. Удаление старой системы подсказок
  - Удалить все файлы и код связанный с hints
  - Откатить миграции и удалить таблицы БД
  - Очистить маршруты и контроллеры
  - _Requirements: Подготовка к новой системе_

- [x] 1.1 Удалить frontend компоненты подсказок
  - Удалить файлы: `resources/js/Components/Onboarding/Hint.tsx`, `HintsProgress.tsx`, `HintsSettings.tsx`, `WelcomeBanner.tsx`
  - Удалить файлы: `resources/js/config/hints.ts`, `resources/js/hooks/useHints.ts`
  - Удалить импорты `useHints` из всех 10 страниц (Dashboard, Calendar, Clients, Services, Portfolio, Finance, Settings, Notifications, Integrations, Subscriptions)
  - _Requirements: Очистка frontend_

- [x] 1.2 Удалить backend код подсказок
  - Удалить методы из `app/Http/Controllers/App/OnboardingController.php`: `markHintViewed()`, `getViewedHints()`, `getHintsProgress()`, `resetHints()`, `hideAllHints()`
  - Удалить маршруты hints API из `routes/web.php`
  - Удалить модель `app/Models/UserHintViewed.php` (если существует)
  - _Requirements: Очистка backend_

- [x] 1.3 Откатить миграции и удалить таблицы БД
  - Найти миграцию создающую таблицу `user_hint_viewed`
  - Откатить миграцию: `php artisan migrate:rollback --step=1`
  - Удалить файл миграции
  - _Requirements: Очистка БД_

- [x] 1.4 Скомпилировать frontend после удаления
  - Выполнить `npm run build`
  - Проверить отсутствие ошибок компиляции
  - _Requirements: Проверка целостности_

- [x] 2. Создание структуры базы данных
  - Создать миграции для всех таблиц базы знаний
  - Создать сидеры с примерами данных
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 9.1_

- [x] 2.1 Создать миграцию для таблицы категорий
  - Создать миграцию `create_kb_categories_table`
  - Поля: id, name, slug, description, parent_id, icon, color, order, is_active, timestamps
  - Индексы: slug (unique), parent_id, is_active
  - _Requirements: 1.1, 1.2_

- [x] 2.2 Создать миграцию для таблицы статей
  - Создать миграцию `create_kb_articles_table`
  - Поля: id, category_id, title, slug, content, excerpt, status, view_count, reading_time, is_featured, is_published, published_at, timestamps, soft_deletes
  - Индексы: slug (unique), category_id, status, is_published
  - Полнотекстовый индекс: title, content
  - _Requirements: 2.1, 2.2, 2.5, 2.6, 2.7_

- [x] 2.3 Создать миграцию для таблицы медиа
  - Создать миграцию `create_kb_article_media_table`
  - Поля: id, article_id, type (enum: image, video, video_embed), filename, path, url, size, metadata (json), order, timestamps
  - Индексы: article_id, type
  - _Requirements: 2.3, 2.4, 3.1, 3.4, 3.5_

- [x] 2.4 Создать миграцию для таблицы просмотров
  - Создать миграцию `create_kb_article_views_table`
  - Поля: id, article_id, user_id (nullable), ip_address, user_agent, viewed_at
  - Индексы: article_id, user_id, viewed_at
  - _Requirements: 4.6, 5.5_

- [x] 2.5 Создать миграцию для таблицы рейтингов
  - Создать миграцию `create_kb_article_ratings_table`
  - Поля: id, article_id, user_id, is_helpful (boolean), feedback (text, nullable), timestamps
  - Индексы: article_id, user_id
  - Уникальный индекс: article_id + user_id
  - _Requirements: 5.7, 8.4, 8.5_

- [x] 2.6 Создать миграцию для таблицы версий
  - Создать миграцию `create_kb_article_versions_table`
  - Поля: id, article_id, content (text), created_by, created_at
  - Индексы: article_id, created_at
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 2.7 Выполнить миграции и создать сидер
  - Выполнить `php artisan migrate`
  - Создать `KnowledgeBaseSeeder` с примерами категорий и статей
  - Выполнить `php artisan db:seed --class=KnowledgeBaseSeeder`
  - _Requirements: Все требования структуры БД_

- [x] 3. Создание моделей Eloquent
  - Создать все модели с relationships и методами
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 9.1_

- [x] 3.1 Создать модель KnowledgeBaseCategory
  - Файл: `app/Models/KnowledgeBaseCategory.php`
  - Relationships: parent(), children(), articles()
  - Методы: getFullPath(), getArticleCount(), isRoot()
  - Casts: is_active (boolean), order (integer)
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 3.2 Создать модель KnowledgeBaseArticle
  - Файл: `app/Models/KnowledgeBaseArticle.php`
  - Relationships: category(), media(), views(), ratings(), versions()
  - Методы: incrementViewCount(), calculateReadingTime(), getHelpfulPercentage(), createVersion()
  - Casts: is_featured, is_published (boolean), published_at (datetime), view_count, reading_time (integer)
  - SoftDeletes trait
  - _Requirements: 2.1, 2.2, 2.5, 2.6, 2.7, 5.5, 5.6, 5.7_

- [x] 3.3 Создать модель KnowledgeBaseArticleMedia
  - Файл: `app/Models/KnowledgeBaseArticleMedia.php`
  - Relationship: article()
  - Методы: getFullUrl(), getThumbnailUrl()
  - Casts: metadata (array), size, order (integer)
  - _Requirements: 2.3, 2.4, 3.1, 3.2, 3.3_

- [x] 3.4 Создать модели для просмотров и рейтингов
  - Файл: `app/Models/KnowledgeBaseArticleView.php`
  - Файл: `app/Models/KnowledgeBaseArticleRating.php`
  - Relationships: article(), user()
  - Casts: viewed_at (datetime), is_helpful (boolean)
  - _Requirements: 4.6, 5.5, 5.7, 8.1, 8.2_

- [x] 3.5 Создать модель KnowledgeBaseArticleVersion
  - Файл: `app/Models/KnowledgeBaseArticleVersion.php`
  - Relationship: article()
  - Casts: created_at (datetime)
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 4. Checkpoint - Проверка моделей и БД
  - Убедиться что все миграции выполнены успешно
  - Проверить что модели корректно работают с БД
  - Проверить relationships между моделями
  - Спросить пользователя если возникли вопросы

- [x] 5. Создание сервисов
  - Реализовать бизнес-логику в сервисах
  - _Requirements: 2.1, 3.1, 4.1, 5.5, 8.1, 9.1, 10.1_

- [x] 5.1 Создать MediaService
  - Файл: `app/Services/KnowledgeBase/MediaService.php`
  - Методы: uploadImage(), uploadVideo(), createVideoEmbed(), deleteMedia(), optimizeImage(), generateThumbnail()
  - Использовать Intervention Image для оптимизации
  - Валидация типов и размеров файлов
  - _Requirements: 3.1, 3.2, 3.3, 3.6, 3.7_

- [x] 5.2 Создать SearchService
  - Файл: `app/Services/KnowledgeBase/SearchService.php`
  - Методы: search(), indexArticle(), removeFromIndex(), getPopularSearches(), trackSearch()
  - Использовать Laravel Scout (database driver)
  - Поддержка фильтрации по категориям
  - _Requirements: 4.1, 4.2, 4.3, 8.2_

- [x] 5.3 Создать CategoryService
  - Файл: `app/Services/KnowledgeBase/CategoryService.php`
  - Методы: create(), update(), delete(), reorder(), getTree(), getBreadcrumbs()
  - Валидация иерархии (предотвращение циклов)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.6_

- [x] 5.4 Создать ArticleService
  - Файл: `app/Services/KnowledgeBase/ArticleService.php`
  - Методы: create(), update(), delete(), publish(), unpublish(), recordView(), rateArticle(), getRelatedArticles(), getPopularArticles(), getFeaturedArticles()
  - Интеграция с MediaService и SearchService
  - Автоматический расчет reading_time
  - Создание версий при обновлении
  - _Requirements: 2.1, 2.2, 2.5, 2.6, 4.5, 4.6, 5.5, 5.6, 5.7, 9.1_

- [x] 5.5 Создать AnalyticsService
  - Файл: `app/Services/KnowledgeBase/AnalyticsService.php`
  - Методы: getArticleStats(), getCategoryStats(), getOverallStats(), getViewsByPeriod(), getTopArticles(), getLowRatedArticles()
  - Агрегация данных по просмотрам и рейтингам
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 6. Создание контроллеров для пользователей
  - Реализовать публичные endpoints для просмотра статей
  - _Requirements: 4.1, 5.1, 5.2, 5.5, 5.7, 7.1, 7.2, 7.3_

- [x] 6.1 Создать KnowledgeBaseController
  - Файл: `app/Http/Controllers/App/KnowledgeBaseController.php`
  - Методы: index() - главная страница, show() - просмотр статьи, search() - поиск, rate() - оценка статьи
  - Использовать Inertia для рендеринга React компонентов
  - Записывать просмотры статей
  - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 5.5, 5.7, 7.2_

- [x] 6.2 Добавить маршруты для пользователей
  - Файл: `routes/web.php`
  - Маршруты: GET /app/knowledge-base, GET /app/knowledge-base/{slug}, GET /app/knowledge-base/search, POST /app/knowledge-base/{article}/rate
  - Middleware: auth
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 7. Создание админских контроллеров
  - Реализовать CRUD операции для админ-панели
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 8.6_

- [x] 7.1 Создать Admin/KnowledgeBaseArticleController
  - Файл: `app/Http/Controllers/Admin/KnowledgeBaseArticleController.php`
  - Методы: index(), create(), store(), edit(), update(), destroy(), publish(), unpublish(), uploadMedia(), deleteMedia()
  - Валидация форм
  - Bulk операции (publish, unpublish, delete)
  - _Requirements: 2.1, 2.2, 2.5, 6.1, 6.2, 6.4, 6.5, 6.7_

- [x] 7.2 Создать Admin/KnowledgeBaseCategoryController
  - Файл: `app/Http/Controllers/Admin/KnowledgeBaseCategoryController.php`
  - Методы: index(), store(), update(), destroy(), reorder()
  - JSON API для управления категориями
  - _Requirements: 1.1, 1.2, 6.6_

- [x] 7.3 Создать Admin/KnowledgeBaseAnalyticsController
  - Файл: `app/Http/Controllers/Admin/KnowledgeBaseAnalyticsController.php`
  - Методы: index() - дашборд, article() - статистика статьи, export() - экспорт данных
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 7.4 Добавить админские маршруты
  - Файл: `routes/web.php`
  - Группа маршрутов: /admin/knowledge-base/*
  - Middleware: auth, admin
  - Resource routes для articles и categories
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 8. Checkpoint - Проверка backend
  - Протестировать все API endpoints через Postman/Insomnia
  - Проверить валидацию форм
  - Проверить загрузку медиа
  - Проверить поиск
  - Спросить пользователя если возникли вопросы

- [x] 9. Создание пользовательских React компонентов
  - Реализовать UI для просмотра статей (shadcn/ui)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.7, 7.2_

- [x] 9.1 Создать KnowledgeBasePage
  - Файл: `resources/js/Pages/App/KnowledgeBase/Index.tsx`
  - Компоненты: Card, Badge, Button, Input для поиска
  - Отображение категорий, популярных и избранных статей
  - Интеграция с SearchWidget и CategoryTree
  - _Requirements: 4.1, 4.3, 4.6, 7.2, 7.5_

- [x] 9.2 Создать ArticleViewer
  - Файл: `resources/js/Pages/App/KnowledgeBase/Show.tsx`
  - Компоненты: Card, Badge, Separator, ScrollArea
  - Рендеринг Markdown с react-markdown
  - Breadcrumb навигация
  - Отображение related articles
  - _Requirements: 4.4, 5.1, 5.2, 5.3, 5.4, 5.6_

- [x] 9.3 Создать Category Page
  - Файл: `resources/js/Pages/App/KnowledgeBase/Category.tsx`
  - Компоненты: Card, Badge, Button
  - Отображение статей по категории с пагинацией
  - Breadcrumb навигация
  - _Requirements: 4.3, 4.4_

- [x] 9.4 Создать ArticleRating
  - Файл: `resources/js/Components/KnowledgeBase/ArticleRating.tsx`
  - Компоненты: Button, Textarea, Dialog, Badge
  - Кнопки "Полезно" / "Не полезно"
  - Опциональная форма обратной связи
  - _Requirements: 5.7, 8.5_

- [x] 10. Создание админских React компонентов
  - Реализовать UI для управления контентом (shadcn/ui)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 8.6_

- [x] 10.1 Создать ArticleEditor
  - Файл: `resources/js/Pages/Admin/KnowledgeBase/ArticleEditor.tsx`
  - Компоненты: Card, Input, Select, Textarea, Button, Tabs, Switch, Badge
  - Форма создания/редактирования статьи
  - Интеграция с MarkdownEditor и MediaUploader
  - Превью перед публикацией
  - _Requirements: 2.1, 2.2, 2.5, 6.4, 6.5, 6.7_

- [x] 10.2 Создать MarkdownEditor
  - Файл: `resources/js/Components/KnowledgeBase/MarkdownEditor.tsx`
  - Компоненты: Tabs, Textarea, Button, Card
  - Вкладки: Edit / Preview
  - Toolbar с кнопками форматирования
  - Поддержка загрузки изображений
  - _Requirements: 2.2, 6.4_

- [x] 10.3 Создать MediaUploader
  - Файл: `resources/js/Components/KnowledgeBase/MediaUploader.tsx`
  - Компоненты: Card, Button, Progress, Dialog, Badge
  - Загрузка файлов
  - Превью загруженных файлов
  - Поддержка YouTube/Vimeo embeds
  - _Requirements: 2.3, 2.4, 3.1, 3.5, 6.5_

- [x] 10.4 Создать CategoryManager
  - Файл: `resources/js/Pages/Admin/KnowledgeBase/Categories.tsx`
  - Компоненты: Dialog, Input, Select, Button, Table, Badge
  - CRUD операции для категорий
  - Выбор иконки и цвета
  - Иерархическое отображение
  - _Requirements: 1.1, 1.2, 1.5, 6.6_

- [x] 10.5 Создать AnalyticsDashboard
  - Файл: `resources/js/Pages/Admin/KnowledgeBase/Analytics.tsx`
  - Компоненты: Card, Tabs, Table, Badge, Select для фильтров
  - Общая статистика (просмотры, рейтинги)
  - Топ статей
  - Статьи с низким рейтингом
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 10.6 Создать список статей для админа
  - Файл: `resources/js/Pages/Admin/KnowledgeBase/Index.tsx`
  - Компоненты: Table, Badge, Button, Select, Input
  - Таблица всех статей с фильтрами
  - Операции publish/unpublish
  - Статистика по каждой статье
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 11. Интеграция в приложение
  - Добавить доступ к базе знаний из навигации
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 11.1 Добавить кнопку Help в навигацию
  - Обновить главное меню приложения
  - Добавить иконку "?" или "Help"
  - Ссылка на /app/knowledge-base
  - _Requirements: 7.1_

- [ ] 11.2 Реализовать контекстную помощь
  - Создать mapping страниц к релевантным статьям
  - Показывать "Полезные статьи" на каждой странице
  - _Requirements: 7.3_

- [ ] 11.3 Добавить виджет поиска в header
  - Интегрировать SearchWidget в главный header
  - Быстрый доступ к поиску (Ctrl+K / Cmd+K)
  - _Requirements: 7.4_

- [ ] 11.4 Создать раздел "Начало работы"
  - Специальная категория для новых пользователей
  - Показывать при первом входе
  - _Requirements: 7.5_

- [ ] 12. Checkpoint - Проверка интеграции
  - Протестировать навигацию между страницами
  - Проверить поиск из header
  - Проверить контекстную помощь
  - Скомпилировать frontend: `npm run build`
  - Спросить пользователя если возникли вопросы

- [ ] 13. Реализация версионирования
  - Добавить функционал истории изменений
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 13.1 Добавить автосохранение версий
  - Обновить ArticleService для создания версий при update()
  - Сохранять предыдущий content перед обновлением
  - _Requirements: 9.1_

- [ ] 13.2 Создать UI для просмотра версий
  - Файл: `resources/js/Components/KnowledgeBase/VersionHistory.tsx`
  - Компоненты: Dialog, Table, Button, Badge
  - Список версий с timestamps
  - Кнопка "Restore" для восстановления
  - _Requirements: 9.2, 9.3, 9.4_

- [ ] 13.3 Реализовать diff между версиями
  - Использовать библиотеку для diff (например, diff-match-patch)
  - Подсветка изменений
  - _Requirements: 9.5_

- [ ] 14. Реализация экспорта/импорта
  - Добавить функционал резервного копирования
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 14.1 Реализовать экспорт в JSON
  - Метод в ArticleService: exportToJson()
  - Включать статью, медиа, метаданные
  - _Requirements: 10.1, 10.5_

- [ ] 14.2 Реализовать экспорт в Markdown
  - Метод в ArticleService: exportToMarkdown()
  - Конвертация в чистый Markdown
  - _Requirements: 10.2_

- [ ] 14.3 Реализовать импорт из JSON
  - Метод в ArticleService: importFromJson()
  - Валидация структуры данных
  - Обработка медиа файлов
  - _Requirements: 10.3, 10.4, 10.5_

- [ ] 14.4 Создать UI для экспорта/импорта
  - Добавить кнопки в админ-панель
  - Прогресс-бар для импорта
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 15. Финальное тестирование и оптимизация
  - Комплексное тестирование всей системы
  - Оптимизация производительности

- [ ] 15.1 Тестирование пользовательских сценариев
  - Просмотр статей
  - Поиск и навигация
  - Оценка статей
  - Просмотр на мобильных устройствах

- [ ] 15.2 Тестирование админских сценариев
  - Создание и редактирование статей
  - Загрузка медиа
  - Управление категориями
  - Просмотр аналитики
  - Bulk операции

- [ ] 15.3 Оптимизация производительности
  - Добавить eager loading для relationships
  - Кэширование популярных статей
  - Оптимизация поисковых запросов
  - Lazy loading для изображений

- [ ] 15.4 Проверка безопасности
  - Валидация всех пользовательских вводов
  - Защита от XSS в Markdown
  - Проверка прав доступа (только админы могут редактировать)
  - Ограничение размеров файлов

- [ ] 16. Финальная компиляция и документация
  - Финальная сборка и создание документации

- [ ] 16.1 Финальная компиляция frontend
  - Выполнить `npm run build`
  - Проверить отсутствие ошибок
  - Проверить размер bundle

- [ ] 16.2 Создать документацию для пользователей
  - Написать первые статьи в базе знаний
  - "Как создать статью"
  - "Как загрузить изображения"
  - "Как организовать категории"

- [ ] 16.3 Создать документацию для разработчиков
  - README с описанием архитектуры
  - Примеры использования API
  - Инструкции по добавлению новых функций

## Notes

- Задачи с `*` являются опциональными и могут быть пропущены для быстрого MVP
- Каждая задача ссылается на конкретные требования для отслеживаемости
- Checkpoints обеспечивают инкрементальную валидацию
- Все UI компоненты используют shadcn/ui библиотеку
- Frontend компилируется через `npm run build` после изменений
- База данных: MySQL через MAMP (DB: team, user: root, password: root)
