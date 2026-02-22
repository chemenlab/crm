Контекст

 Проект MasterClient Booking System требует подготовки к production развертыванию на сервере с использованием панели Dokploy.

 Текущее состояние:
 - Laravel 12 + React 19 + Inertia.js + Vite
 - PHP 8.2+, 108 миграций БД
 - 13 cron задач (scheduler): уведомления каждые 30 мин/час, подписки, очистка
 - Queue workers для фоновой обработки (Telegram, email уведомления)
 - Интеграции: YooKassa, Telegram Bot, VK API, OAuth (Google/Yandex)
 - Нет Docker конфигурации для production

 Зачем это нужно:
 Dokploy — это self-hosted PaaS (альтернатива Heroku) на Docker + Traefik с удобным UI для управления развертыванием. Предоставляет:
 - Встроенные сервисы (PostgreSQL, Redis) в один клик
 - GitHub Auto Deploy через webhooks
 - Автоматический SSL (Let's Encrypt)
 - Управление переменными окружения через UI
 - Volumes для persistent storage
 - Мониторинг и логи

 Архитектурные решения

 1. Dockerfile: Multi-stage Build

 Почему: Минимизация размера образа и безопасность

 Stage 1 (builder):
   - Alpine Linux + PHP 8.3 + Node.js
   - Установка Composer/npm зависимостей
   - Сборка фронтенда (npm run build)
   - Удаление dev зависимостей

 Stage 2 (production):
   - Alpine Linux + PHP 8.3-FPM + Nginx + Supervisor
   - Только production код и зависимости
   - PHP extensions: pdo_pgsql, gd, zip, mbstring, bcmath, intl, opcache
   - Ожидаемый размер: ~200-300 MB (vs 800+ MB без multi-stage)

 2. Supervisor для управления процессами

 Почему: Нужно запустить 5 процессов одновременно

 1. PHP-FPM (обработка PHP)
 2. Nginx (веб-сервер)
 3. Laravel Queue Workers x2 (фоновые задачи)
 4. Cron (scheduler для 13 команд)

 Альтернатива (отклонена): Отдельные контейнеры для каждого процесса
 - Минусы: сложнее управление, больше ресурсов, проблемы с shared storage

 3. PostgreSQL вместо SQLite

 Почему: Production требования

 - SQLite не поддерживает concurrent writes (проблемы с queue workers)
 - PostgreSQL масштабируется лучше
 - Dokploy предоставляет managed PostgreSQL с backup

 4. Redis для cache/queue/sessions

 Почему: Производительность и масштабируемость

 - Database driver медленный для высоконагруженных очередей
 - Redis поддерживает multiple app instances (горизонтальное масштабирование)
 - Dokploy предоставляет managed Redis

 5. Entrypoint скрипт для инициализации

 Проблема: Laravel требует .env файл, но Dokploy инжектирует ENV через Docker

 Решение: entrypoint.sh динамически генерирует .env из ENV переменных при старте:
 cat > .env << EOF
 APP_NAME="${APP_NAME}"
 DB_HOST="${DB_HOST}"
 ...
 EOF

 Также выполняет:
 - Проверку подключения к БД (retry 30 раз)
 - Миграции (только при первом запуске через маркер файл)
 - Storage symlink
 - Кэширование конфигурации для production
 - Настройку cron для scheduler

 Критические файлы для создания

 1. /Dockerfile (250 строк)

 - Multi-stage: builder + production
 - Alpine Linux 3.x для минимального размера
 - PHP 8.3-FPM + Nginx
 - Supervisor для управления процессами
 - Health check endpoint: /up

 2. /docker/entrypoint.sh (120 строк)

 - Генерация .env из ENV
 - Инициализация БД и миграций
 - Настройка cron для Laravel Scheduler
 - Проверка готовности сервисов

 3. /docker/supervisor/supervisord.conf

 - 5 программ: PHP-FPM, Nginx, Queue Workers x2, Cron
 - Автоматический рестарт при падении
 - Логирование в stdout/stderr

 4. /docker/nginx/default.conf

 - Laravel rewrite rules
 - FastCGI для PHP-FPM
 - Gzip compression
 - Static assets caching (1 year)
 - Security headers

 5. /docker/php/php.ini

 - memory_limit: 256M
 - upload_max_filesize: 50M
 - timezone: Europe/Moscow
 - Redis sessions
 - opcache для production

 6. /.dockerignore

 - Исключение: vendor, node_modules, .git, storage/logs
 - Оптимизация: размер контекста сборки уменьшается на ~600 MB

 7. /docker-compose.yml (опционально)

 - Для локальной разработки и тестирования
 - Определяет volumes для storage и logs
 - Сеть для связи app -> postgres -> redis

 Пошаговый план реализации

 Шаг 1: Создание Docker конфигурации

 1. Создать структуру:
 /Dockerfile
 /.dockerignore
 /docker/entrypoint.sh
 /docker/supervisor/supervisord.conf
 /docker/nginx/nginx.conf
 /docker/nginx/default.conf
 /docker/php/php.ini
 /docker/php/php-fpm.conf
 /docker/php/opcache.ini
 /docker-compose.yml
 2. Сделать entrypoint.sh исполняемым:
 chmod +x docker/entrypoint.sh
 3. Обновить .env.example с полным списком переменных для Dokploy

 Шаг 2: Тестирование локально

 # Собрать образ
 docker build -t booking-app:test .

 # Запустить с docker-compose
 docker-compose up -d

 # Проверить логи
 docker-compose logs -f app

 # Проверить health
 curl http://localhost/up

 # Проверить supervisor
 docker-compose exec app supervisorctl status

 Шаг 3: Коммит в Git

 git add Dockerfile .dockerignore docker/ docker-compose.yml
 git commit -m "Add Dokploy deployment configuration"
 git push origin main

 Шаг 4: Настройка в Dokploy

 4.1 Создание баз данных:
 - PostgreSQL: booking-postgres (16-alpine)
   - Сохранить: DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DATABASE
 - Redis: booking-redis (7-alpine)
   - Сохранить: REDIS_HOST, REDIS_PASSWORD

 4.2 Создание Application:
 - Name: masterclient-booking
 - Source: GitHub Repository
 - Branch: main
 - Dockerfile Path: ./Dockerfile
 - Build Context: .
 - Port Mapping: 80:80

 4.3 Volumes:
 - /var/www/storage/app/public → booking-storage (persistent)
 - /var/www/storage/logs → booking-logs (persistent)

 4.4 Environment Variables (30+ переменных):
 # Core
 APP_NAME=MasterClient
 APP_ENV=production
 APP_DEBUG=false
 APP_KEY=base64:CHANGEME
 APP_URL=https://yourdomain.com

 # Database (из Dokploy PostgreSQL)
 DB_CONNECTION=pgsql
 DB_HOST=booking-postgres
 DB_PORT=5432
 DB_DATABASE=...
 DB_USERNAME=...
 DB_PASSWORD=...

 # Redis (из Dokploy Redis)
 REDIS_HOST=booking-redis
 REDIS_PASSWORD=...
 CACHE_STORE=redis
 QUEUE_CONNECTION=redis
 SESSION_DRIVER=redis

 # Logs
 LOG_CHANNEL=stdout
 LOG_LEVEL=info

 # Mail (SMTP)
 MAIL_MAILER=smtp
 MAIL_HOST=...
 MAIL_USERNAME=...
 MAIL_PASSWORD=...

 # Integrations
 TELEGRAM_BOT_TOKEN=...
 YOOKASSA_SHOP_ID=...
 YOOKASSA_SECRET_KEY=...
 YOOKASSA_WEBHOOK_SECRET=...
 VK_GROUP_ID=...
 VK_ACCESS_TOKEN=...
 GOOGLE_CLIENT_ID=...
 GOOGLE_CLIENT_SECRET=...
 YANDEX_CLIENT_ID=...
 YANDEX_CLIENT_SECRET=...

 # Admin
 ADMIN_PANEL_PATH=control-panel-x7k9m2

 4.5 SSL:
 - Domain: booking.yourdomain.com
 - Enable Let's Encrypt

 4.6 GitHub Auto Deploy:
 - Enable в Application Settings
 - Добавить webhook в GitHub: Settings → Webhooks
 - Events: Push to main branch

 Шаг 5: Первый Deploy

 1. Нажать Deploy в Dokploy
 2. Дождаться сборки (5-10 минут)
 3. Проверить логи на ошибки

 Шаг 6: Верификация

 Проверка сервисов:
 # Подключиться к контейнеру
 docker exec -it <container> bash

 # Supervisor статус (должно быть 5 RUNNING)
 supervisorctl status

 # БД подключение
 php artisan db:show

 # Миграции
 php artisan migrate:status

 # Scheduler
 php artisan schedule:list

 # Queue
 php artisan queue:monitor

 # Cron
 crontab -l -u www

 Проверка веб-интерфейса:
 - Health: https://yourdomain.com/up → OK
 - Главная: https://yourdomain.com/ → React страница
 - Login: https://yourdomain.com/login → форма входа
 - Storage: https://yourdomain.com/storage/ → symlink работает

 Проверка интеграций:
 # Telegram webhook
 php artisan telegram:webhook:set

 # Тест email
 php artisan tinker
 >>> Mail::raw('Test', fn($m) => $m->to('test@example.com'));

 Потенциальные проблемы и решения

 Проблема 1: APP_KEY not set

 Симптом: Error на главной странице

 Решение:
 docker exec -it <container> php artisan key:generate --force
 # Скопировать ключ в Dokploy ENV и пересоздать контейнер

 Проблема 2: Storage symlink не работает

 Симптом: 404 на /storage/...

 Решение:
 docker exec -it <container> php artisan storage:link --force

 Проблема 3: Queue workers не обрабатывают задачи

 Диагностика:
 docker exec -it <container> supervisorctl status laravel-worker:*

 Решение:
 docker exec -it <container> supervisorctl restart laravel-worker:*

 Проблема 4: Миграции не применились

 Решение:
 # Удалить маркер и запустить вручную
 docker exec -it <container> bash
 rm /var/www/storage/.migrations_completed
 php artisan migrate --force

 Проблема 5: Scheduler не запускается

 Диагностика:
 ps aux | grep cron
 tail -f /var/www/storage/logs/scheduler.log

 Решение:
 supervisorctl restart laravel-scheduler

 Мониторинг и поддержка

 Логи:
 - Laravel: tail -f storage/logs/laravel.log
 - Workers: tail -f storage/logs/worker.log
 - Nginx: tail -f storage/logs/nginx-access.log
 - Scheduler: tail -f storage/logs/scheduler.log
 - Docker: Dokploy UI → Logs

 Backup:
 - PostgreSQL: Dokploy → Database → Backups (daily, retention 7 days)
 - Storage: Volumes автоматически persistent
 - Manual dump: pg_dump -U user db > backup.sql

 Ресурсы (рекомендации):
 - Минимум: 2 CPU cores, 2 GB RAM
 - Рекомендуется: 4 CPU cores, 4 GB RAM
 - Хранилище: 20 GB (БД + uploads + logs)

 Uptime monitoring:
 - Настроить UptimeRobot или Pingdom
 - Endpoint: https://yourdomain.com/up
 - Interval: каждые 5 минут

 Чеклист готовности к production

 Docker конфигурация:
 - Dockerfile создан с multi-stage build
 - .dockerignore настроен
 - Все конфиги в /docker/ созданы
 - entrypoint.sh исполняемый (chmod +x)
 - docker-compose.yml для локального тестирования

 Тестирование:
 - Локальная сборка успешна (docker build)
 - Запуск локально работает (docker-compose up)
 - Health check отвечает 200 OK
 - Supervisor запустил все 5 процессов
 - Миграции применились
 - Storage symlink создан

 Dokploy настройка:
 - PostgreSQL создан и доступен
 - Redis создан и доступен
 - Application создан и связан с GitHub
 - Volumes настроены для storage
 - 30+ ENV переменных заполнены
 - SSL сертификат активирован
 - GitHub Auto Deploy включен

 Интеграции:
 - YooKassa webhook: https://domain/webhooks/yookassa
 - Telegram webhook: https://domain/webhooks/telegram
 - VK webhook: https://domain/webhooks/vk
 - OAuth redirect URIs настроены (Google, Yandex)
 - Email SMTP проверен (test через tinker)

 Мониторинг:
 - Uptime monitoring настроен
 - PostgreSQL backup включен
 - Логи доступны через Dokploy UI

 Production проверка:
 - Главная страница загружается
 - Логин работает
 - Storage файлы доступны
 - Queue workers обрабатывают задачи
 - Scheduler выполняет команды по расписанию
 - Webhooks принимаются (test через curl)

 Приоритеты для вашего проекта

 На основе ваших ответов:
 - ✅ Фокус на production окружении (staging можно добавить позже)
 - ✅ YooKassa уже настроен (Shop ID, Secret Key готовы)
 - ✅ Домен готов (можно сразу настроить SSL)
 - ⚠️  Telegram Bot, VK API, OAuth будут настраиваться после деплоя

 Критичные переменные окружения для первого запуска:
 # Обязательно для работы
 APP_NAME=MasterClient
 APP_ENV=production
 APP_URL=https://yourdomain.com
 DB_CONNECTION=pgsql
 REDIS_HOST=booking-redis
 LOG_CHANNEL=stdout

 # YooKassa (уже готовы)
 YOOKASSA_SHOP_ID=<ваш Shop ID>
 YOOKASSA_SECRET_KEY=<ваш Secret Key>
 YOOKASSA_WEBHOOK_SECRET=<ваш Webhook Secret>

 # Email (можно настроить позже)
 MAIL_MAILER=log  # временно логировать вместо отправки

 Интеграции для настройки после деплоя:
 1. Telegram Bot - создать бота через @BotFather, настроить webhook
 2. VK API - создать группу, получить токены
 3. OAuth - настроить redirect URIs в Google/Yandex консолях
 4. Email SMTP - подключить почтовый провайдер

 Следующие шаги после деплоя

 1. Настройка недостающих интеграций:
   - Telegram Bot: получить token от @BotFather → php artisan telegram:webhook:set
   - VK API: создать группу и получить access token
   - OAuth: настроить redirect URIs (будут доступны после деплоя)
   - Email SMTP: подключить провайдер (Sendgrid, Mailgun, или свой SMTP)
 2. Проверка платежей YooKassa:
   - Настроить webhook: https://yourdomain.com/webhooks/yookassa
   - Протестировать тестовым платежом
 3. Настройка мониторинга:
   - Подключить Sentry для отслеживания ошибок
   - Настроить UptimeRobot для проверки доступности
   - Настроить alerts в Telegram при падении сервисов
 4. Оптимизация (опционально):
   - Включить CDN для static assets
   - Настроить Redis Sentinel для HA (если нужна высокая доступность)
   - Добавить горизонтальное масштабирование (несколько app instances)
 5. Документация:
   - Обновить DEPLOY.md с финальной конфигурацией Dokploy
   - Добавить runbook для типичных проблем
   - Создать инструкцию для команды по деплою обновлений

 ---
 Время реализации: 2-3 часа (создание файлов + тестирование + первый deploy)

 Время первого деплоя: 10-15 минут (сборка Docker образа в Dokploy)

 Последующие деплои: 5-7 минут (через GitHub Auto Deploy)
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌