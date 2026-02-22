│ Plan: Landing Page Enhancements + News System                                                                                                                          │
│                                                                                                                                                                        │
│ Context                                                                                                                                                                │
│                                                                                                                                                                        │
│ The landing page (Welcome.tsx, 1070 lines) is 100% hardcoded — pricing, news, all sections. Need to:                                                                   │
│ 1. Fix "Почему выбирают MClient?" scroll animation (cards should stack/overlap on scroll)                                                                              │
│ 2. Pull real pricing from subscription_plans table into the landing                                                                                                    │
│ 3. Show "14 дней бесплатно" CTA on the maximum plan, linking to /register                                                                                              │
│ 4. Create a News system (new model, admin CRUD, public page) and show real news on landing                                                                             │
│                                                                                                                                                                        │
│ ---                                                                                                                                                                    │
│ Part 1: "Почему выбирают MClient?" Scroll Animation                                                                                                                    │
│                                                                                                                                                                        │
│ The 3 cards already use sticky top-32/36/40 + class stack-card. The stacking effect is partially there but needs proper scroll-driven offsets so each card overlaps    │
│ the previous one smoothly.                                                                                                                                             │
│                                                                                                                                                                        │
│ Changes                                                                                                                                                                │
│                                                                                                                                                                        │
│ - Edit: resources/js/Pages/Marketing/Welcome.tsx                                                                                                                       │
│   - Cards already have sticky positioning with incremental top values (top-32, top-36, top-40)                                                                         │
│   - Add scale-down + opacity reduction via IntersectionObserver or CSS scroll-snap                                                                                     │
│   - Each card gets z-index increasing so card 3 covers card 2 covers card 1                                                                                            │
│   - Add transition: previous card scales down to ~0.95 and dims as next card scrolls over                                                                              │
│   - Add <style> block with .stack-card CSS: transition: transform 0.3s, opacity 0.3s                                                                                   │
│   - Use JS IntersectionObserver to add .stacked class (scale-down + slight brightness reduction) when card is no longer the topmost visible                            │
│                                                                                                                                                                        │
│ ---                                                                                                                                                                    │
│ Part 2: Real Pricing from DB                                                                                                                                           │
│                                                                                                                                                                        │
│ Backend                                                                                                                                                                │
│                                                                                                                                                                        │
│ - Edit: app/Http/Controllers/Marketing/WelcomeController.php                                                                                                           │
│   - Query SubscriptionPlan::active()->ordered()->get()                                                                                                                 │
│   - Pass plans to Inertia response alongside existing landingSettings                                                                                                  │
│                                                                                                                                                                        │
│ Frontend                                                                                                                                                               │
│                                                                                                                                                                        │
│ - Edit: resources/js/Pages/Marketing/Welcome.tsx                                                                                                                       │
│   - Accept plans prop (array of { id, name, slug, description, price, features })                                                                                      │
│   - Replace hardcoded pricing section (lines 830-890) with dynamic rendering from plans                                                                                │
│   - Map feature limits into human-readable bullets:                                                                                                                    │
│       - clients: -1 → "Неограниченно клиентов", clients: 30 → "До 30 клиентов"                                                                                         │
│     - analytics: true → "Расширенная аналитика"                                                                                                                        │
│     - priority_support: true → "Приоритетная поддержка"                                                                                                                │
│   - Keep the visual styling (free=dark, middle=featured lime, max=dark)                                                                                                │
│   - For slug === 'maximum': show badge "14 дней бесплатно", CTA links to /register                                                                                     │
│   - For other plans: CTA links to /register                                                                                                                            │
│   - Remove monthly/yearly toggle (DB only has monthly plans currently)                                                                                                 │
│                                                                                                                                                                        │
│ ---                                                                                                                                                                    │
│ Part 3: News System                                                                                                                                                    │
│                                                                                                                                                                        │
│ 3a. Migration: news table                                                                                                                                              │
│                                                                                                                                                                        │
│ - Create: database/migrations/xxxx_create_news_table.php                                                                                                               │
│ - Schema:                                                                                                                                                              │
│ id, title, slug (unique), excerpt, content (longText),                                                                                                                 │
│ cover_image (nullable), category (string, e.g. "Советы"/"Обновление"/"Кейс"),                                                                                          │
│ is_published (bool), published_at (datetime nullable),                                                                                                                 │
│ view_count (int default 0), reading_time (int default 1),                                                                                                              │
│ created_at, updated_at                                                                                                                                                 │
│                                                                                                                                                                        │
│ 3b. Model: app/Models/News.php                                                                                                                                         │
│                                                                                                                                                                        │
│ - Fillable: all fields above                                                                                                                                           │
│ - Casts: is_published => boolean, published_at => datetime                                                                                                             │
│ - Scopes: published(), latest()                                                                                                                                        │
│ - Method: calculateReadingTime() (reuse pattern from KnowledgeBaseArticle)                                                                                             │
│                                                                                                                                                                        │
│ 3c. Admin Controller: app/Http/Controllers/Admin/NewsController.php                                                                                                    │
│                                                                                                                                                                        │
│ - index() — list all news, filter by status/search, paginate                                                                                                           │
│ - create() → Inertia render Admin/News/Create                                                                                                                          │
│ - store() — validate, create, auto-slug, calculate reading_time, handle cover_image upload                                                                             │
│ - edit($news) → Inertia render Admin/News/Edit                                                                                                                         │
│ - update($news) — validate, update                                                                                                                                     │
│ - destroy($news) — delete + remove cover image                                                                                                                         │
│ - publish($news) / unpublish($news) — toggle status                                                                                                                    │
│                                                                                                                                                                        │
│ 3d. Admin Routes (inside admin prefix group in web.php)                                                                                                                │
│                                                                                                                                                                        │
│ Route::prefix('news')->group(function () {                                                                                                                             │
│     Route::get('/', [NewsController::class, 'index'])->name('admin.news.index');                                                                                       │
│     Route::get('/create', [NewsController::class, 'create'])->name('admin.news.create');                                                                               │
│     Route::post('/', [NewsController::class, 'store'])->name('admin.news.store');                                                                                      │
│     Route::get('/{news}/edit', [NewsController::class, 'edit'])->name('admin.news.edit');                                                                              │
│     Route::put('/{news}', [NewsController::class, 'update'])->name('admin.news.update');                                                                               │
│     Route::delete('/{news}', [NewsController::class, 'destroy'])->name('admin.news.destroy');                                                                          │
│     Route::post('/{news}/publish', [NewsController::class, 'publish'])->name('admin.news.publish');                                                                    │
│     Route::post('/{news}/unpublish', [NewsController::class, 'unpublish'])->name('admin.news.unpublish');                                                              │
│ });                                                                                                                                                                    │
│                                                                                                                                                                        │
│ 3e. Admin Pages (follow KnowledgeBase pattern from resources/js/Pages/Admin/KnowledgeBase/)                                                                            │
│                                                                                                                                                                        │
│ - Create: resources/js/Pages/Admin/News/Index.tsx                                                                                                                      │
│   - Table: title, category, status badge, published_at, view_count, actions                                                                                            │
│   - Search + filter by status                                                                                                                                          │
│   - Publish/unpublish toggle, edit, delete buttons                                                                                                                     │
│   - ConfirmDialog for deletions                                                                                                                                        │
│ - Create: resources/js/Pages/Admin/News/Create.tsx                                                                                                                     │
│   - Form: title, category (select), excerpt (textarea), content (MarkdownEditor or textarea), cover_image upload, is_published toggle                                  │
│ - Create: resources/js/Pages/Admin/News/Edit.tsx                                                                                                                       │
│   - Same form pre-filled, update on submit                                                                                                                             │
│                                                                                                                                                                        │
│ 3f. Admin Sidebar                                                                                                                                                      │
│                                                                                                                                                                        │
│ - Edit: resources/js/Layouts/AdminLayout.tsx                                                                                                                           │
│   - Add nav item: { name: 'Новости', href: route('admin.news.index'), icon: Newspaper }                                                                                │
│                                                                                                                                                                        │
│ 3g. Public News Controller                                                                                                                                             │
│                                                                                                                                                                        │
│ - Create: app/Http/Controllers/Public/NewsController.php                                                                                                               │
│   - index() — published news, paginated, ordered by published_at desc → Inertia Marketing/News/Index                                                                   │
│   - show($slug) — single news article, increment view_count → Inertia Marketing/News/Show                                                                              │
│                                                                                                                                                                        │
│ 3h. Public Routes (no auth required)                                                                                                                                   │
│                                                                                                                                                                        │
│ Route::get('/news', [Public\NewsController::class, 'index'])->name('news.index');                                                                                      │
│ Route::get('/news/{slug}', [Public\NewsController::class, 'show'])->name('news.show');                                                                                 │
│                                                                                                                                                                        │
│ 3i. Public News Pages                                                                                                                                                  │
│                                                                                                                                                                        │
│ - Create: resources/js/Pages/Marketing/News/Index.tsx                                                                                                                  │
│   - Dark theme matching landing page style                                                                                                                             │
│   - Grid of news cards with cover image, category badge, date, title, excerpt                                                                                          │
│   - Pagination                                                                                                                                                         │
│ - Create: resources/js/Pages/Marketing/News/Show.tsx                                                                                                                   │
│   - Full article view, dark theme                                                                                                                                      │
│   - Back link, category, date, reading time, view count                                                                                                                │
│   - Content rendered as markdown/HTML                                                                                                                                  │
│                                                                                                                                                                        │
│ 3j. Landing News Section — use real data                                                                                                                               │
│                                                                                                                                                                        │
│ - Edit: app/Http/Controllers/Marketing/WelcomeController.php                                                                                                           │
│   - Query News::published()->latest()->take(3)->get()                                                                                                                  │
│   - Pass news to Inertia response                                                                                                                                      │
│ - Edit: resources/js/Pages/Marketing/Welcome.tsx                                                                                                                       │
│   - Replace hardcoded news array (lines 952-970) with dynamic rendering from news prop                                                                                 │
│   - "Все статьи" link → /news                                                                                                                                          │
│   - Each article links to /news/{slug}                                                                                                                                 │
│                                                                                                                                                                        │
│ ---                                                                                                                                                                    │
│ Files Summary                                                                                                                                                          │
│                                                                                                                                                                        │
│ New Files (9)                                                                                                                                                          │
│                                                                                                                                                                        │
│ 1. database/migrations/xxxx_create_news_table.php                                                                                                                      │
│ 2. app/Models/News.php                                                                                                                                                 │
│ 3. app/Http/Controllers/Admin/NewsController.php                                                                                                                       │
│ 4. app/Http/Controllers/Public/NewsController.php                                                                                                                      │
│ 5. resources/js/Pages/Admin/News/Index.tsx                                                                                                                             │
│ 6. resources/js/Pages/Admin/News/Create.tsx                                                                                                                            │
│ 7. resources/js/Pages/Admin/News/Edit.tsx                                                                                                                              │
│ 8. resources/js/Pages/Marketing/News/Index.tsx                                                                                                                         │
│ 9. resources/js/Pages/Marketing/News/Show.tsx                                                                                                                          │
│                                                                                                                                                                        │
│ Modified Files (4)                                                                                                                                                     │
│                                                                                                                                                                        │
│ 1. resources/js/Pages/Marketing/Welcome.tsx — scroll animation, real pricing, real news                                                                                │
│ 2. app/Http/Controllers/Marketing/WelcomeController.php — pass plans + news                                                                                            │
│ 3. resources/js/Layouts/AdminLayout.tsx — add News nav item                                                                                                            │
│ 4. routes/web.php — admin news routes + public news routes                                                                                                             │
│                                                                                                                                                                        │
│ ---                                                                                                                                                                    │
│ Verification                                                                                                                                                           │
│                                                                                                                                                                        │
│ 1. php artisan migrate — creates news table                                                                                                                            │
│ 2. Open landing / — pricing section shows 3 plans from DB, scroll animation works on "Почему выбирают" cards                                                           │
│ 3. Maximum plan card shows "14 дней бесплатно" badge, CTA links to /register                                                                                           │
│ 4. Admin panel → Новости → create a test news article, publish it                                                                                                      │
│ 5. Landing page news section shows the published article                                                                                                               │
│ 6. /news shows paginated news list                                                                                                                                     │
│ 7. /news/{slug} shows full article                                                                                                                                     │
│ 8. npx vite build passes without errors    