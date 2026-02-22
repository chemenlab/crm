#!/bin/sh

echo "=== MasterClient Booking System - Container Initialization ==="

# =============================================================================
# 1. Generate .env from environment variables
# =============================================================================
echo "[1/7] Generating .env file from environment variables..."

cat > /var/www/.env << EOF
# Core
APP_NAME="${APP_NAME:-MasterClient}"
APP_ENV="${APP_ENV:-production}"
APP_KEY="${APP_KEY}"
APP_DEBUG="${APP_DEBUG:-false}"
APP_TIMEZONE="${APP_TIMEZONE:-Europe/Moscow}"
APP_URL="${APP_URL}"
APP_LOCALE="${APP_LOCALE:-ru}"
APP_FALLBACK_LOCALE="${APP_FALLBACK_LOCALE:-en}"
APP_FAKER_LOCALE="${APP_FAKER_LOCALE:-ru_RU}"

# Admin
ADMIN_PANEL_PATH="${ADMIN_PANEL_PATH:-admin}"

# Database
DB_CONNECTION="${DB_CONNECTION:-pgsql}"
DB_HOST="${DB_HOST}"
DB_PORT="${DB_PORT:-5432}"
DB_DATABASE="${DB_DATABASE}"
DB_USERNAME="${DB_USERNAME}"
DB_PASSWORD="${DB_PASSWORD}"

# Redis
REDIS_CLIENT="${REDIS_CLIENT:-phpredis}"
REDIS_HOST="${REDIS_HOST}"
REDIS_PASSWORD="${REDIS_PASSWORD:-null}"
REDIS_PORT="${REDIS_PORT:-6379}"
REDIS_USERNAME="${REDIS_USERNAME:-default}"

# Cache & Queue & Session
CACHE_STORE="${CACHE_STORE:-redis}"
QUEUE_CONNECTION="${QUEUE_CONNECTION:-redis}"
SESSION_DRIVER="${SESSION_DRIVER:-redis}"
SESSION_LIFETIME="${SESSION_LIFETIME:-120}"

# Broadcast
BROADCAST_CONNECTION="${BROADCAST_CONNECTION:-log}"

# Filesystem
FILESYSTEM_DISK="${FILESYSTEM_DISK:-local}"

# Logging
LOG_CHANNEL="${LOG_CHANNEL:-stack}"
LOG_STACK="${LOG_STACK:-single}"
LOG_LEVEL="${LOG_LEVEL:-info}"
LOG_DEPRECATIONS_CHANNEL="${LOG_DEPRECATIONS_CHANNEL:-null}"

# Mail
MAIL_MAILER="${MAIL_MAILER:-log}"
MAIL_HOST="${MAIL_HOST:-}"
MAIL_PORT="${MAIL_PORT:-587}"
MAIL_USERNAME="${MAIL_USERNAME:-}"
MAIL_PASSWORD="${MAIL_PASSWORD:-}"
MAIL_ENCRYPTION="${MAIL_ENCRYPTION:-tls}"
MAIL_FROM_ADDRESS="${MAIL_FROM_ADDRESS:-noreply@example.com}"
MAIL_FROM_NAME="${MAIL_FROM_NAME:-${APP_NAME}}"

# YooKassa
YOOKASSA_SHOP_ID="${YOOKASSA_SHOP_ID:-}"
YOOKASSA_SECRET_KEY="${YOOKASSA_SECRET_KEY:-}"
YOOKASSA_WEBHOOK_SECRET="${YOOKASSA_WEBHOOK_SECRET:-}"

# Telegram
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"

# VK
VK_GROUP_ID="${VK_GROUP_ID:-}"
VK_ACCESS_TOKEN="${VK_ACCESS_TOKEN:-}"
VK_SECRET_KEY="${VK_SECRET_KEY:-}"

# OAuth - Google
GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:-}"
GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:-}"
GOOGLE_REDIRECT_URI="${GOOGLE_REDIRECT_URI:-}"

# OAuth - Yandex
YANDEX_CLIENT_ID="${YANDEX_CLIENT_ID:-}"
YANDEX_CLIENT_SECRET="${YANDEX_CLIENT_SECRET:-}"
YANDEX_REDIRECT_URI="${YANDEX_REDIRECT_URI:-}"

# Vite
VITE_APP_NAME="${VITE_APP_NAME:-${APP_NAME}}"
EOF

echo "✓ .env file generated"

# =============================================================================
# 2. Wait for database to be ready
# =============================================================================
echo "[2/7] Waiting for database connection..."
echo "  DB_HOST=${DB_HOST} DB_PORT=${DB_PORT:-5432} DB_DATABASE=${DB_DATABASE} DB_USERNAME=${DB_USERNAME}"

MAX_RETRIES=30
RETRY_COUNT=0

# First check TCP connectivity to avoid waiting 30x on DNS/network issues
echo "Checking TCP connectivity to ${DB_HOST}:${DB_PORT:-5432}..."
TCP_OK=0
for i in $(seq 1 10); do
    if nc -z -w3 "${DB_HOST}" "${DB_PORT:-5432}" 2>/dev/null; then
        TCP_OK=1
        break
    fi
    echo "  TCP attempt $i/10..."
    sleep 2
done

if [ $TCP_OK -eq 0 ]; then
    echo "✗ Cannot reach ${DB_HOST}:${DB_PORT:-5432} — network/DNS issue"
    exit 1
fi
echo "✓ TCP connection OK"

# Check pdo_pgsql extension
php -r "extension_loaded('pdo_pgsql') ? print('pdo_pgsql: OK'.PHP_EOL) : print('pdo_pgsql: MISSING'.PHP_EOL);"

DB_DSN="pgsql:host=${DB_HOST};port=${DB_PORT:-5432};dbname=${DB_DATABASE}"
until php -r "
try {
    \$pdo = new PDO('${DB_DSN}', '${DB_USERNAME}', '${DB_PASSWORD}');
    echo 'connected';
    exit(0);
} catch (Exception \$e) {
    fwrite(STDERR, \$e->getMessage() . PHP_EOL);
    exit(1);
}" 2>/tmp/db_error.log || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Waiting for database... Attempt $RETRY_COUNT/$MAX_RETRIES"
    if [ -s /tmp/db_error.log ]; then
        echo "  Error: $(cat /tmp/db_error.log)"
    fi
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "✗ Failed to connect to database after $MAX_RETRIES attempts"
    exit 1
fi

echo "✓ Database connection established"

# =============================================================================
# 3. Wait for Redis to be ready
# =============================================================================
echo "[3/7] Waiting for Redis connection..."

REDIS_RETRIES=10
REDIS_COUNT=0

until php artisan tinker --execute="Redis::ping();" >/dev/null 2>&1 || [ $REDIS_COUNT -eq $REDIS_RETRIES ]; do
    REDIS_COUNT=$((REDIS_COUNT + 1))
    echo "Waiting for Redis... Attempt $REDIS_COUNT/$REDIS_RETRIES"
    sleep 2
done

if [ $REDIS_COUNT -eq $REDIS_RETRIES ]; then
    echo "⚠ Redis connection failed - falling back to file-based cache/sessions"
    sed -i 's/CACHE_STORE=redis/CACHE_STORE=file/' /var/www/.env
    sed -i 's/SESSION_DRIVER=redis/SESSION_DRIVER=file/' /var/www/.env
    sed -i 's/QUEUE_CONNECTION=redis/QUEUE_CONNECTION=database/' /var/www/.env
else
    echo "✓ Redis connection established"
fi

# =============================================================================
# 4. Run migrations
# =============================================================================
echo "[4/7] Running database migrations..."

php artisan migrate --force --no-interaction
MIGRATE_EXIT=$?

if [ $MIGRATE_EXIT -eq 0 ]; then
    echo "✓ Migrations completed"
else
    echo "✗ Migration failed with exit code $MIGRATE_EXIT"
    exit 1
fi

# =============================================================================
# 5. Setup storage and cache
# =============================================================================
echo "[5/7] Setting up storage and cache..."

# Create storage symlink
if [ ! -L /var/www/public/storage ]; then
    php artisan storage:link --force
    echo "✓ Storage symlink created"
else
    echo "✓ Storage symlink already exists"
fi

# Clear and cache configurations for production
php artisan config:cache && echo "✓ config cached" || echo "⚠ config:cache failed (non-fatal)"
php artisan route:cache && echo "✓ routes cached" || echo "⚠ route:cache failed (non-fatal)"
php artisan view:cache && echo "✓ views cached" || echo "⚠ view:cache failed (non-fatal)"
echo "✓ Laravel caches step done"

# =============================================================================
# 6. Setup Laravel Scheduler (cron)
# =============================================================================
echo "[6/7] Setting up Laravel Scheduler..."

# Add Laravel scheduler to crontab for www user
echo "* * * * * cd /var/www && php artisan schedule:run >> /var/www/storage/logs/scheduler.log 2>&1" > /tmp/crontab.txt
crontab -u www /tmp/crontab.txt
rm /tmp/crontab.txt

# Start cron daemon
crond -b -l 8

echo "✓ Laravel Scheduler configured"

# =============================================================================
# 7. Final permissions check
# =============================================================================
echo "[7/7] Setting final permissions..."

chown -R www:www /var/www/storage
chmod -R 775 /var/www/storage
chown -R www:www /var/www/bootstrap/cache
chmod -R 775 /var/www/bootstrap/cache

echo "✓ Permissions set"

echo "=== Container initialization completed successfully ==="
echo "Starting services with Supervisor..."

# Execute the main command (supervisord)
exec "$@"
