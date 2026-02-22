# Инструкция по деплою MasterClient

## 1. Требования к серверу

- PHP 8.2+
- MySQL 8.0+ или PostgreSQL 14+
- Composer
- Node.js 18+ и npm
- Redis (опционально, для очередей)

## 2. Настройка окружения

```bash
# Скопировать .env.example в .env
cp .env.example .env

# Заполнить переменные:
# - APP_URL — URL сайта
# - DB_* — настройки базы данных
# - MAIL_* — настройки почты (SMTP)
# - YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY — ЮKassa
# - TELEGRAM_BOT_TOKEN — Telegram бот
```

## 3. Установка зависимостей

```bash
composer install --optimize-autoloader --no-dev
npm ci
npm run build
```

## 4. Миграции и кэш

```bash
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan storage:link
```

## 5. ⚠️ ВАЖНО: Настройка Cron (Scheduler)

Laravel использует **один cron job** для всех автоматических задач.

### Добавить в crontab сервера:

```bash
crontab -e
```

Добавить строку:
```
* * * * * cd /var/www/mclient && php artisan schedule:run >> /dev/null 2>&1
```

> Замени `/var/www/mclient` на реальный путь к проекту

### Что запускается по расписанию:

| Команда | Расписание | Описание |
|---------|------------|----------|
| `notifications:send-reminders 24h` | Каждый час | Напоминания за 24 часа |
| `notifications:send-reminders 2h` | Каждые 30 мин | Напоминания за 2 часа |
| `telegram:send-daily-summary` | 08:00 МСК | Дневная сводка в Telegram |
| `notifications:cleanup` | 03:00 | Очистка старых логов |
| `subscriptions:check-expired` | Каждый час | Проверка истёкших подписок |
| `subscriptions:process-recurring` | 02:00 | Автопродление подписок |
| `subscriptions:send-reminders` | 10:00 | Напоминания о подписках |
| `subscriptions:reset-usage` | 1-е число, 00:01 | Сброс лимитов |
| `users:cleanup-inactive` | 04:00 | Очистка неактивных аккаунтов |

### Проверить что scheduler работает:

```bash
php artisan schedule:list
```

## 6. Настройка очередей (Queue Worker)

Для отправки email и уведомлений нужен queue worker.

### Вариант 1: Supervisor (рекомендуется)

Создать файл `/etc/supervisor/conf.d/mclient-worker.conf`:

```ini
[program:mclient-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/mclient/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/mclient/storage/logs/worker.log
stopwaitsecs=3600
```

Затем:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start mclient-worker:*
```

### Вариант 2: Systemd

Создать `/etc/systemd/system/mclient-worker.service`:

```ini
[Unit]
Description=MasterClient Queue Worker
After=network.target

[Service]
User=www-data
Group=www-data
Restart=always
ExecStart=/usr/bin/php /var/www/mclient/artisan queue:work --sleep=3 --tries=3

[Install]
WantedBy=multi-user.target
```

Затем:
```bash
sudo systemctl enable mclient-worker
sudo systemctl start mclient-worker
```

## 7. Права на папки

```bash
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

## 8. Nginx конфигурация

```nginx
server {
    listen 80;
    server_name mclient.ru;
    root /var/www/mclient/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

## 9. SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d mclient.ru
```

## 10. Чеклист перед запуском

- [ ] `.env` заполнен корректно
- [ ] База данных создана и мигрирована
- [ ] Cron настроен (`* * * * * ... schedule:run`)
- [ ] Queue worker запущен (Supervisor/Systemd)
- [ ] Storage слинкован (`php artisan storage:link`)
- [ ] SSL сертификат установлен
- [ ] Права на папки настроены
- [ ] Почта работает (проверить восстановление пароля)
- [ ] ЮKassa webhook настроен на `https://site.ru/webhooks/yookassa`

## 11. Полезные команды

```bash
# Посмотреть логи
tail -f storage/logs/laravel.log

# Очистить кэш
php artisan cache:clear
php artisan config:clear

# Проверить очередь
php artisan queue:monitor

# Тест отправки email
php artisan tinker
>>> Mail::raw('Test', fn($m) => $m->to('test@test.com'));

# Тест команды очистки (dry-run)
php artisan users:cleanup-inactive --dry-run
```
