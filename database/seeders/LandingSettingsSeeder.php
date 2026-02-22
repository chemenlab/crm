<?php

namespace Database\Seeders;

use App\Models\LandingSetting;
use Illuminate\Database\Seeder;

class LandingSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // Hero Section
            [
                'section' => 'hero',
                'key' => 'hero_title',
                'value' => [
                    'text' => 'CRM для мастеров и сферы услуг',
                    'highlight' => 'CRM'
                ],
                'order' => 1,
            ],
            [
                'section' => 'hero',
                'key' => 'hero_subtitle',
                'value' => [
                    'text' => 'Онлайн-запись, учёт клиентов, финансы и аналитика в одном месте. Начните бесплатно — без карты и лишних вопросов.'
                ],
                'order' => 2,
            ],
            [
                'section' => 'hero',
                'key' => 'hero_stats',
                'value' => [
                    ['number' => '15K+', 'label' => 'Активных пользователей'],
                    ['number' => '98%', 'label' => 'Довольных клиентов'],
                    ['number' => '0₽', 'label' => 'Стартовый тариф'],
                ],
                'order' => 3,
            ],

            // Services Section
            [
                'section' => 'services',
                'key' => 'services_title',
                'value' => ['text' => 'Что умеет MClient?'],
                'order' => 1,
            ],
            [
                'section' => 'services',
                'key' => 'services_items',
                'value' => [
                    [
                        'icon' => 'Search',
                        'title' => 'Онлайн-запись 24/7',
                        'description' => 'Клиенты записываются сами через вашу персональную страницу'
                    ],
                    [
                        'icon' => 'Bell',
                        'title' => 'Умные уведомления',
                        'description' => 'Автоматические напоминания в Telegram, SMS и Email'
                    ],
                    [
                        'icon' => 'Calendar',
                        'title' => 'Удобный календарь',
                        'description' => 'Гибкое расписание с защитой от двойных записей'
                    ],
                    [
                        'icon' => 'TrendingUp',
                        'title' => 'Финансовая аналитика',
                        'description' => 'Доходы, расходы, прибыль и налоги под контролем'
                    ],
                ],
                'order' => 2,
            ],

            // Why Us Section
            [
                'section' => 'why_us',
                'key' => 'why_us_title',
                'value' => ['text' => 'Почему выбирают MClient?'],
                'order' => 1,
            ],
            [
                'section' => 'why_us',
                'key' => 'why_us_cards',
                'value' => [
                    [
                        'number' => '01',
                        'title' => 'Простота',
                        'description' => 'Создано специально для частных мастеров. Никаких сложных настроек и лишних кнопок.',
                        'features' => [
                            'Интуитивный интерфейс',
                            'Быстрый старт за 5 минут'
                        ]
                    ],
                    [
                        'number' => '02',
                        'title' => 'Безопасность',
                        'description' => 'Ваши данные под надёжной защитой. Регулярные бэкапы и современное шифрование.',
                        'features' => [
                            'Шифрование AES-256',
                            'Двухфакторная аутентификация'
                        ]
                    ],
                    [
                        'number' => '03',
                        'title' => 'Забота',
                        'description' => 'Мы не просто софт, мы — партнеры. Наша служба поддержки всегда на связи.',
                        'features' => [
                            'Поддержка в чате',
                            'Подробная база знаний'
                        ]
                    ],
                ],
                'order' => 2,
            ],

            // Testimonials
            [
                'section' => 'testimonials',
                'key' => 'testimonials_title',
                'value' => ['text' => 'Доверие профессионалов'],
                'order' => 1,
            ],
            [
                'section' => 'testimonials',
                'key' => 'testimonials_items',
                'value' => [
                    [
                        'name' => 'Анна Козлова',
                        'role' => 'Мастер маникюра',
                        'text' => 'Идеальный сервис для мастера. Всё просто и понятно. Клиенты записываются сами, а я просто получаю уведомления.',
                        'avatar_bg' => 'ecfdf5',
                        'avatar_color' => '059669'
                    ],
                    [
                        'name' => 'Дмитрий Орлов',
                        'role' => 'Барбер',
                        'text' => 'Искал простую CRM без лишних наворотов. MClient подошла идеально. Особенно радует финансовая статистика.',
                        'avatar_bg' => 'f0f9ff',
                        'avatar_color' => '0284c7'
                    ],
                ],
                'order' => 2,
            ],

            // FAQ
            [
                'section' => 'faq',
                'key' => 'faq_title',
                'value' => ['text' => 'Частые вопросы'],
                'order' => 1,
            ],
            [
                'section' => 'faq',
                'key' => 'faq_items',
                'value' => [
                    [
                        'question' => 'Могу ли я попробовать бесплатно?',
                        'answer' => 'Да, у нас есть пробный период 14 дней на всех тарифах, а также полностью бесплатный тариф для начинающих мастеров.'
                    ],
                    [
                        'question' => 'Нужно ли устанавливать программу?',
                        'answer' => 'Нет, MClient работает в облаке. Заходите с любого устройства через браузер.'
                    ],
                    [
                        'question' => 'Как настроить онлайн-запись?',
                        'answer' => 'Всего 3 шага: создайте услуги, настройте расписание, получите персональную ссылку. Готово!'
                    ],
                    [
                        'question' => 'Могу ли я отменить подписку?',
                        'answer' => 'Да, в любой момент без объяснения причин. Никаких скрытых платежей.'
                    ],
                    [
                        'question' => 'Будут ли уведомления клиентам?',
                        'answer' => 'Да, автоматические напоминания через Telegram, SMS или Email за день и за час до записи.'
                    ],
                    [
                        'question' => 'Есть ли мобильное приложение?',
                        'answer' => 'Сайт адаптирован под мобильные устройства. Нативное приложение в разработке.'
                    ],
                ],
                'order' => 2,
            ],

            // For Whom Section
            [
                'section' => 'for_whom',
                'key' => 'for_whom_title',
                'value' => ['text' => 'Для кого создан MClient?'],
                'order' => 1,
            ],
            [
                'section' => 'for_whom',
                'key' => 'for_whom_subtitle',
                'value' => ['text' => 'Идеальное решение для частных мастеров и малого бизнеса в сфере услуг'],
                'order' => 2,
            ],
            [
                'section' => 'for_whom',
                'key' => 'for_whom_cards',
                'value' => [
                    [
                        'title' => 'Бьюти-индустрия',
                        'description' => 'Мастера маникюра, парикмахеры, визажисты',
                        'tags' => ['Онлайн-запись', 'База клиентов', 'Напоминания'],
                        'size' => 'large'
                    ],
                    [
                        'title' => 'Частные мастера',
                        'description' => 'Массажисты, косметологи, стилисты',
                        'tags' => ['Расписание', 'Финансы'],
                        'size' => 'medium'
                    ],
                    [
                        'title' => 'Репетиторы',
                        'description' => 'Коучи, тренеры, преподаватели',
                        'tags' => ['Расписание', 'Оплата', 'Статистика'],
                        'size' => 'medium'
                    ],
                    [
                        'title' => 'Фотостудии',
                        'description' => 'Фотографы, видеографы',
                        'tags' => ['Бронирование', 'Портфолио'],
                        'size' => 'medium'
                    ],
                    [
                        'title' => 'Косметологи',
                        'description' => 'Медицинская косметология',
                        'tags' => ['Карты клиентов', 'История'],
                        'size' => 'medium'
                    ],
                    [
                        'title' => 'И ещё 200+',
                        'description' => 'Автосервисы, ремонт, консультанты...',
                        'size' => 'medium'
                    ],
                ],
                'order' => 3,
            ],
            [
                'section' => 'for_whom',
                'key' => 'for_whom_stats',
                'value' => [
                    ['number' => '15K+', 'label' => 'Пользователей'],
                    ['number' => '200+', 'label' => 'Профессий'],
                    ['number' => '98%', 'label' => 'Довольных'],
                    ['number' => '0₽', 'label' => 'Старт'],
                ],
                'order' => 4,
            ],

            // Features Section
            [
                'section' => 'features',
                'key' => 'features_title',
                'value' => ['text' => 'Всё необходимое в одном месте'],
                'order' => 1,
            ],
            [
                'section' => 'features',
                'key' => 'features_subtitle',
                'value' => ['text' => 'Мощный функционал для эффективного управления вашим бизнесом'],
                'order' => 2,
            ],
            [
                'section' => 'features',
                'key' => 'features_items',
                'value' => [
                    [
                        'title' => 'Умный Календарь',
                        'description' => 'Гибкое расписание с защитой от двойных записей',
                        'icon' => 'Calendar',
                        'size' => 'large'
                    ],
                    [
                        'title' => 'Финансы',
                        'description' => 'Доходы, расходы и прибыль',
                        'icon' => 'TrendingUp',
                        'size' => 'medium'
                    ],
                    [
                        'title' => 'Уведомления',
                        'description' => 'Telegram, SMS, Email',
                        'icon' => 'Bell',
                        'size' => 'medium'
                    ],
                    [
                        'title' => 'Персональная Страница',
                        'description' => 'Ваша визитка в интернете',
                        'icon' => 'User',
                        'size' => 'medium'
                    ],
                    [
                        'title' => 'База Клиентов',
                        'description' => 'История и предпочтения',
                        'icon' => 'Users',
                        'size' => 'medium'
                    ],
                ],
                'order' => 3,
            ],

            // Pricing Section
            [
                'section' => 'pricing',
                'key' => 'pricing_title',
                'value' => ['text' => 'Прозрачные цены'],
                'order' => 1,
            ],
            [
                'section' => 'pricing',
                'key' => 'pricing_subtitle',
                'value' => ['text' => 'Выберите тариф, который подходит именно вам'],
                'order' => 2,
            ],
            [
                'section' => 'pricing',
                'key' => 'pricing_plans',
                'value' => [
                    [
                        'name' => 'Free',
                        'title' => 'Бесплатный',
                        'price_monthly' => '0',
                        'price_yearly' => '0',
                        'description' => 'Для начинающих мастеров',
                        'features' => [
                            'До 50 записей в месяц',
                            'До 30 клиентов',
                            'Базовая аналитика',
                            'Email поддержка',
                        ],
                        'highlighted' => false
                    ],
                    [
                        'name' => 'Pro',
                        'title' => 'Профессиональный',
                        'price_monthly' => '490',
                        'price_yearly' => '4900',
                        'description' => 'Для активных мастеров',
                        'features' => [
                            'Безлимитные записи',
                            'Безлимитные клиенты',
                            'Полная аналитика',
                            'Telegram уведомления',
                            'Приоритетная поддержка',
                        ],
                        'highlighted' => true
                    ],
                    [
                        'name' => 'Business',
                        'title' => 'Бизнес',
                        'price_monthly' => '990',
                        'price_yearly' => '9900',
                        'description' => 'Для команд и студий',
                        'features' => [
                            'Всё из Pro',
                            'До 5 сотрудников',
                            'Расширенная аналитика',
                            'API доступ',
                            'Персональный менеджер',
                        ],
                        'highlighted' => false
                    ],
                ],
                'order' => 3,
            ],

            // News Section
            [
                'section' => 'news',
                'key' => 'news_title',
                'value' => ['text' => 'Новости и статьи'],
                'order' => 1,
            ],
            [
                'section' => 'news',
                'key' => 'news_items',
                'value' => [
                    [
                        'title' => '5 советов по увеличению потока клиентов',
                        'excerpt' => 'Проверенные методы привлечения новых клиентов для мастеров красоты',
                        'date' => '15 января 2026',
                        'category' => 'Советы'
                    ],
                    [
                        'title' => 'Обновление: новый модуль аналитики',
                        'excerpt' => 'Расширенная статистика и прогнозирование доходов теперь доступны',
                        'date' => '10 января 2026',
                        'category' => 'Обновления'
                    ],
                    [
                        'title' => 'История успеха: барбершоп "Стиль"',
                        'excerpt' => 'Как MClient помог увеличить выручку на 40% за 3 месяца',
                        'date' => '5 января 2026',
                        'category' => 'Кейсы'
                    ],
                ],
                'order' => 2,
            ],

            // Footer Section
            [
                'section' => 'footer',
                'key' => 'footer_description',
                'value' => ['text' => 'Современная CRM-система для мастеров и сферы услуг'],
                'order' => 1,
            ],
            [
                'section' => 'footer',
                'key' => 'footer_links',
                'value' => [
                    [
                        'title' => 'Продукт',
                        'links' => [
                            ['text' => 'Возможности', 'url' => '#features'],
                            ['text' => 'Тарифы', 'url' => '#pricing'],
                            ['text' => 'Отзывы', 'url' => '#testimonials'],
                        ]
                    ],
                    [
                        'title' => 'Компания',
                        'links' => [
                            ['text' => 'О нас', 'url' => '/about'],
                            ['text' => 'Блог', 'url' => '/blog'],
                            ['text' => 'Контакты', 'url' => '/contacts'],
                        ]
                    ],
                    [
                        'title' => 'Поддержка',
                        'links' => [
                            ['text' => 'FAQ', 'url' => '#faq'],
                            ['text' => 'База знаний', 'url' => '/kb'],
                            ['text' => 'Связаться', 'url' => '/support'],
                        ]
                    ],
                ],
                'order' => 2,
            ],
            [
                'section' => 'footer',
                'key' => 'footer_social',
                'value' => [
                    ['name' => 'Telegram', 'url' => 'https://t.me/mclient'],
                    ['name' => 'Instagram', 'url' => 'https://instagram.com/mclient'],
                    ['name' => 'VK', 'url' => 'https://vk.com/mclient'],
                ],
                'order' => 3,
            ],
        ];

        foreach ($settings as $setting) {
            LandingSetting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}
