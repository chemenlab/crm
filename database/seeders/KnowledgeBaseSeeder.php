<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class KnowledgeBaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Создаем категории
        $gettingStarted = \DB::table('kb_categories')->insertGetId([
            'name' => 'Начало работы',
            'slug' => 'getting-started',
            'description' => 'Основы работы с MasterPlan',
            'parent_id' => null,
            'icon' => 'rocket',
            'color' => '#3b82f6',
            'order' => 1,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $calendar = \DB::table('kb_categories')->insertGetId([
            'name' => 'Календарь и записи',
            'slug' => 'calendar',
            'description' => 'Управление записями и расписанием',
            'parent_id' => null,
            'icon' => 'calendar',
            'color' => '#10b981',
            'order' => 2,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $clients = \DB::table('kb_categories')->insertGetId([
            'name' => 'Клиенты',
            'slug' => 'clients',
            'description' => 'Работа с базой клиентов',
            'parent_id' => null,
            'icon' => 'users',
            'color' => '#8b5cf6',
            'order' => 3,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $services = \DB::table('kb_categories')->insertGetId([
            'name' => 'Услуги',
            'slug' => 'services',
            'description' => 'Настройка и управление услугами',
            'parent_id' => null,
            'icon' => 'briefcase',
            'color' => '#f59e0b',
            'order' => 4,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $finance = \DB::table('kb_categories')->insertGetId([
            'name' => 'Финансы',
            'slug' => 'finance',
            'description' => 'Учет доходов и расходов',
            'parent_id' => null,
            'icon' => 'dollar-sign',
            'color' => '#ef4444',
            'order' => 5,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Подкатегории для "Начало работы"
        $registration = \DB::table('kb_categories')->insertGetId([
            'name' => 'Регистрация',
            'slug' => 'registration',
            'description' => 'Создание аккаунта',
            'parent_id' => $gettingStarted,
            'icon' => 'user-plus',
            'color' => '#3b82f6',
            'order' => 1,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $firstSteps = \DB::table('kb_categories')->insertGetId([
            'name' => 'Первые шаги',
            'slug' => 'first-steps',
            'description' => 'Настройка после регистрации',
            'parent_id' => $gettingStarted,
            'icon' => 'footprints',
            'color' => '#3b82f6',
            'order' => 2,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Создаем статьи
        \DB::table('kb_articles')->insert([
            [
                'category_id' => $registration,
                'title' => 'Как зарегистрироваться в MasterPlan',
                'slug' => 'how-to-register',
                'content' => "# Регистрация в MasterPlan\n\nДобро пожаловать в MasterPlan! Следуйте этим простым шагам для создания аккаунта.\n\n## Шаг 1: Откройте страницу регистрации\n\nПерейдите на главную страницу и нажмите кнопку \"Регистрация\".\n\n## Шаг 2: Заполните форму\n\nВведите следующие данные:\n- Имя\n- Email\n- Пароль (минимум 8 символов)\n- Подтверждение пароля\n\n## Шаг 3: Подтвердите email\n\nПосле регистрации на ваш email придет письмо с ссылкой для подтверждения.\n\n## Шаг 4: Войдите в систему\n\nПосле подтверждения email вы можете войти в систему и начать работу!",
                'excerpt' => 'Пошаговая инструкция по регистрации в MasterPlan',
                'status' => 'published',
                'view_count' => 0,
                'reading_time' => 2,
                'is_featured' => true,
                'is_published' => true,
                'published_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category_id' => $firstSteps,
                'title' => 'Настройка профиля после регистрации',
                'slug' => 'profile-setup',
                'content' => "# Настройка профиля\n\nПосле регистрации рекомендуем настроить ваш профиль для комфортной работы.\n\n## Основная информация\n\n1. Перейдите в раздел \"Настройки\"\n2. Заполните информацию о себе:\n   - Фото профиля\n   - Имя и фамилия\n   - Телефон\n   - Часовой пояс\n\n## Настройка уведомлений\n\nВыберите, какие уведомления вы хотите получать:\n- Email уведомления\n- Push уведомления\n- SMS уведомления\n\n## Интеграции\n\nПодключите необходимые интеграции:\n- Telegram бот\n- VK сообщества\n- Календари (Google, Яндекс)\n\n## Готово!\n\nТеперь ваш профиль настроен и вы готовы к работе.",
                'excerpt' => 'Как настроить профиль после создания аккаунта',
                'status' => 'published',
                'view_count' => 0,
                'reading_time' => 3,
                'is_featured' => true,
                'is_published' => true,
                'published_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category_id' => $calendar,
                'title' => 'Как создать запись в календаре',
                'slug' => 'create-appointment',
                'content' => "# Создание записи\n\nУправление записями - основная функция MasterPlan.\n\n## Быстрое создание\n\n1. Откройте раздел \"Календарь\"\n2. Нажмите на нужную дату и время\n3. Заполните форму:\n   - Выберите клиента\n   - Выберите услугу\n   - Укажите длительность\n   - Добавьте комментарий (опционально)\n4. Нажмите \"Создать запись\"\n\n## Дополнительные опции\n\n- **Повторяющиеся записи**: настройте регулярные встречи\n- **Напоминания**: клиент получит уведомление\n- **Предоплата**: запросите предоплату при записи\n\n## Статусы записей\n\n- **Запланирована** - запись создана\n- **Подтверждена** - клиент подтвердил\n- **Завершена** - услуга оказана\n- **Отменена** - запись отменена\n\n## Советы\n\n- Используйте цветовую маркировку для разных типов услуг\n- Настройте автоматические напоминания\n- Включите онлайн-запись для клиентов",
                'excerpt' => 'Инструкция по созданию и управлению записями',
                'status' => 'published',
                'view_count' => 0,
                'reading_time' => 4,
                'is_featured' => false,
                'is_published' => true,
                'published_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category_id' => $clients,
                'title' => 'Добавление нового клиента',
                'slug' => 'add-client',
                'content' => "# Добавление клиента\n\nВедите базу клиентов для удобного управления записями.\n\n## Создание карточки клиента\n\n1. Перейдите в раздел \"Клиенты\"\n2. Нажмите \"Добавить клиента\"\n3. Заполните информацию:\n   - Имя и фамилия (обязательно)\n   - Телефон\n   - Email\n   - Дата рождения\n   - Заметки\n\n## Импорт клиентов\n\nМожно импортировать клиентов из:\n- Excel файла\n- CSV файла\n- Другой CRM системы\n\n## История клиента\n\nВ карточке клиента доступна:\n- История записей\n- История платежей\n- Заметки и комментарии\n- Статистика посещений\n\n## Группы клиентов\n\nСоздавайте группы для:\n- Сегментации клиентов\n- Массовых рассылок\n- Специальных предложений",
                'excerpt' => 'Как добавить и управлять клиентами',
                'status' => 'published',
                'view_count' => 0,
                'reading_time' => 3,
                'is_featured' => false,
                'is_published' => true,
                'published_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category_id' => $services,
                'title' => 'Настройка услуг и прайс-листа',
                'slug' => 'setup-services',
                'content' => "# Настройка услуг\n\nСоздайте каталог ваших услуг с ценами и длительностью.\n\n## Создание услуги\n\n1. Откройте раздел \"Услуги\"\n2. Нажмите \"Добавить услугу\"\n3. Укажите:\n   - Название услуги\n   - Описание\n   - Цена\n   - Длительность\n   - Категория\n\n## Категории услуг\n\nОрганизуйте услуги по категориям:\n- Стрижки\n- Окрашивание\n- Маникюр\n- Педикюр\n- И т.д.\n\n## Дополнительные опции\n\n- **Онлайн-запись**: разрешите клиентам записываться онлайн\n- **Предоплата**: требуйте предоплату\n- **Скидки**: настройте акции и скидки\n- **Абонементы**: создайте пакеты услуг\n\n## Прайс-лист\n\nЭкспортируйте прайс-лист для:\n- Печати\n- Размещения на сайте\n- Отправки клиентам",
                'excerpt' => 'Как создать и настроить каталог услуг',
                'status' => 'published',
                'view_count' => 0,
                'reading_time' => 3,
                'is_featured' => false,
                'is_published' => true,
                'published_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
