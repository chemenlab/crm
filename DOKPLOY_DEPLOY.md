# 🚀 Инструкция по развертыванию CRM в Dokploy

## Доступ к Dokploy
- **URL**: http://37.48.254.100:3000
- **Email**: semenfrilans@gmail.com
- **Пароль**: TpL53RPPDysHkzLi

## GitHub репозиторий
- **URL**: https://github.com/chemenlab/crm.git
- **Домен**: mclient.pro

---

## Шаг 1: Подключение GitHub

1. Войдите в Dokploy по адресу http://37.48.254.100:3000
2. Перейдите в раздел **Settings** → **Git Providers**
3. Нажмите **Create GitHub App**
4. Введите имя приложения (например, `Dokploy-MClient-CRM`)
5. Нажмите **Install** и выберите репозиторий `chemenlab/crm`
6. Подтвердите установку

---

## Шаг 2: Создание проекта

1. На главной странице Dokploy нажмите **Create Project**
2. Введите название: `MClient CRM`
3. Опционально добавьте описание: `Laravel CRM with React and Inertia.js`
4. Нажмите **Create**

---

## Шаг 3: Создание приложения

1. Внутри созданного проекта нажмите **Create Application**
2. Выберите **Application** (не Docker Compose)
3. Заполните поля:
   - **Name**: `mclient-crm`
   - **Description**: `Main CRM application`

---

## Шаг 4: Настройка Git источника

1. В настройках приложения перейдите в раздел **Source**
2. Выберите **Git Provider**: GitHub
3. Выберите репозиторий: `chemenlab/crm`
4. Выберите ветку: `main`
5. **Build Path**: `/` (корень репозитория)
6. Включите **Auto Deploy** (автоматический деплой при push)

---

## Шаг 5: Настройка сборки

1. Перейдите в раздел **Build**
2. **Build Type**: `Dockerfile`
3. **Dockerfile Path**: `./Dockerfile` (уже есть в репозитории)
4. **Port**: `80` (как в Dockerfile)

---

## Шаг 6: Настройка домена

1. Перейдите в раздел **Domains**
2. Нажмите **Add Domain**
3. Введите домен: `mclient.pro`
4. Также добавьте: `www.mclient.pro`
5. Включите **HTTPS** (Dokploy автоматически настроит Let's Encrypt)
6. Сохраните

### Настройка DNS
⚠️ **Важно**: Настройте A-записи у вашего DNS провайдера:
```
A    mclient.pro      → 37.48.254.100
A    www.mclient.pro  → 37.48.254.100
```

---

## Шаг 7: Создание базы данных PostgreSQL

1. Вернитесь на страницу проекта `MClient CRM`
2. Нажмите **Create Database**
3. Выберите **PostgreSQL**
4. Заполните:
   - **Name**: `mclient-postgres`
   - **Database Name**: `mclient_crm`
   - **Username**: `postgres`
   - **Password**: (сгенерируйте надежный пароль)
5. Нажмите **Create**

---

## Шаг 8: Настройка переменных окружения

1. В настройках приложения `mclient-crm` перейдите в **Environment**
2. Скопируйте переменные из файла `.env.production.example`
3. Обязательно настройте:

### Основные переменные:
```bash
APP_NAME=MasterClient
APP_ENV=production
APP_DEBUG=false
APP_URL=https://mclient.pro
APP_LOCALE=ru
```

### Сгенерируйте APP_KEY:
```bash
# Выполните на сервере или локально:
php artisan key:generate --show
```

### База данных (используйте данные из созданной PostgreSQL):
```bash
DB_CONNECTION=pgsql
DB_HOST=mclient-postgres  # имя сервиса PostgreSQL в Dokploy
DB_PORT=5432
DB_DATABASE=mclient_crm
DB_USERNAME=postgres
DB_PASSWORD=ваш_пароль_из_шага_7
```

### Настройки сессий и кэша:
```bash
SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
```

### Email (настройте SMTP):
```bash
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=ваш_email@gmail.com
MAIL_PASSWORD=app_specific_password
MAIL_FROM_ADDRESS=noreply@mclient.pro
```

### Платежи YooKassa:
```bash
YOOKASSA_SHOP_ID=ваш_shop_id
YOOKASSA_SECRET_KEY=ваш_secret_key
YOOKASSA_WEBHOOK_SECRET=ваш_webhook_secret
YOOKASSA_RETURN_URL=https://mclient.pro/subscriptions/payment/success
```

### Telegram:
```bash
TELEGRAM_BOT_TOKEN=ваш_telegram_bot_token
TELEGRAM_WEBHOOK_URL=https://mclient.pro/webhooks/telegram
```

### Admin панель:
```bash
ADMIN_PANEL_PATH=control-panel-x7k9m2
```

---

## Шаг 9: Advanced настройки

### Health Check
В разделе **Advanced** → **Health Check**:
- **Path**: `/up`
- **Interval**: `30s`
- **Timeout**: `5s`
- **Retries**: `3`

### Resource Limits (опционально):
- **Memory**: `512MB` - `1GB`
- **CPU**: `0.5` - `1.0`

---

## Шаг 10: Запуск деплоя

1. Убедитесь, что все настройки сохранены
2. Нажмите **Deploy** в правом верхнем углу
3. Следите за логами сборки в разделе **Deployments**
4. Ждите завершения (может занять 5-10 минут)

---

## Шаг 11: Миграция базы данных

После первого успешного деплоя нужно запустить миграции:

1. В Dokploy перейдите в приложение `mclient-crm`
2. Перейдите в раздел **Terminal**
3. Выполните команды:
```bash
php artisan migrate --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Или через SSH на сервере:
```bash
# Подключитесь к серверу
ssh root@37.48.254.100

# Найдите контейнер приложения
docker ps | grep mclient-crm

# Выполните миграции (замените CONTAINER_ID на реальный ID)
docker exec -it CONTAINER_ID php artisan migrate --force
docker exec -it CONTAINER_ID php artisan storage:link
```

---

## Шаг 12: Проверка работы

1. Откройте https://mclient.pro в браузере
2. Проверьте доступность админ-панели: https://mclient.pro/control-panel-x7k9m2
3. Проверьте health check: https://mclient.pro/up

---

## Troubleshooting

### Если приложение не запускается:
1. Проверьте логи в разделе **Logs**
2. Убедитесь, что APP_KEY сгенерирован
3. Проверьте подключение к БД

### Если домен не работает:
1. Убедитесь, что DNS настроен правильно
2. Подождите распространения DNS (до 24 часов)
3. Проверьте статус SSL сертификата в Dokploy

### Если миграции не применились:
1. Проверьте логи БД
2. Убедитесь, что DB_CONNECTION=pgsql
3. Проверьте credentials базы данных

---

## Автоматические обновления

После настройки любой `git push` в ветку `main` будет автоматически деплоить изменения:

```bash
git add .
git commit -m "Update: описание изменений"
git push origin main
```

Dokploy автоматически:
1. Обнаружит изменения
2. Соберет новый Docker образ
3. Запустит новую версию
4. Сделает zero-downtime deployment

---

## Полезные команды

### Просмотр логов:
```bash
docker logs -f CONTAINER_NAME
```

### Очистка кэша:
```bash
docker exec -it CONTAINER_ID php artisan cache:clear
docker exec -it CONTAINER_ID php artisan config:clear
docker exec -it CONTAINER_ID php artisan route:clear
docker exec -it CONTAINER_ID php artisan view:clear
```

### Резервное копирование БД:
```bash
docker exec POSTGRES_CONTAINER pg_dump -U postgres mclient_crm > backup.sql
```

---

## 🎉 Готово!

Ваша CRM теперь развернута и доступна по адресу https://mclient.pro
