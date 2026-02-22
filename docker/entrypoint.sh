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
DB_CONNECTION="${DB_CONNECTION:-mysql}"
DB_HOST="${DB_HOST}"
DB_PORT="${DB_PORT:-3306}"
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
DB_PORT="${DB_PORT:-3306}"
echo "[2/7] Waiting for database connection..."
echo "  DB_CONNECTION=${DB_CONNECTION} DB_HOST=${DB_HOST} DB_PORT=${DB_PORT} DB_DATABASE=${DB_DATABASE}"

MAX_RETRIES=30
RETRY_COUNT=0

# TCP check
echo "Checking TCP connectivity to ${DB_HOST}:${DB_PORT}..."
TCP_OK=0
for i in $(seq 1 10); do
    if nc -z -w3 "${DB_HOST}" "${DB_PORT}" 2>/dev/null; then
        TCP_OK=1
        break
    fi
    echo "  TCP attempt $i/10..."
    sleep 2
done

if [ $TCP_OK -eq 0 ]; then
    echo "✗ Cannot reach ${DB_HOST}:${DB_PORT} — network/DNS issue"
    exit 1
fi
echo "✓ TCP connection OK"

# Build DSN based on DB_CONNECTION
if [ "${DB_CONNECTION}" = "pgsql" ]; then
    DB_DSN="pgsql:host=${DB_HOST};port=${DB_PORT};dbname=${DB_DATABASE}"
else
    DB_DSN="mysql:host=${DB_HOST};port=${DB_PORT};dbname=${DB_DATABASE}"
fi

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

# Save original driver values from .env before any modifications
ORIG_CACHE_STORE=$(grep '^CACHE_STORE=' /var/www/.env | cut -d'=' -f2 | tr -d '"')
ORIG_SESSION_DRIVER=$(grep '^SESSION_DRIVER=' /var/www/.env | cut -d'=' -f2 | tr -d '"')
ORIG_QUEUE_CONNECTION=$(grep '^QUEUE_CONNECTION=' /var/www/.env | cut -d'=' -f2 | tr -d '"')

echo "  Original drivers: CACHE=$ORIG_CACHE_STORE SESSION=$ORIG_SESSION_DRIVER QUEUE=$ORIG_QUEUE_CONNECTION"

REDIS_RETRIES=10
REDIS_COUNT=0
REDIS_OK=0

# Check Redis connectivity using raw PHP (avoids Laravel boot which may crash on missing DB tables)
until [ $REDIS_COUNT -eq $REDIS_RETRIES ]; do
    REDIS_COUNT=$((REDIS_COUNT + 1))
    echo "Waiting for Redis... Attempt $REDIS_COUNT/$REDIS_RETRIES"

    REDIS_HOST_VAL=$(grep '^REDIS_HOST=' /var/www/.env | cut -d'=' -f2 | tr -d '"')
    REDIS_PORT_VAL=$(grep '^REDIS_PORT=' /var/www/.env | cut -d'=' -f2 | tr -d '"')
    REDIS_PASSWORD_VAL=$(grep '^REDIS_PASSWORD=' /var/www/.env | cut -d'=' -f2 | tr -d '"')

    if php -r "
        \$r = new Redis();
        try {
            \$r->connect('${REDIS_HOST_VAL:-127.0.0.1}', (int)'${REDIS_PORT_VAL:-6379}', 3);
            \$pass = '${REDIS_PASSWORD_VAL:-null}';
            if (\$pass && \$pass !== 'null') \$r->auth(\$pass);
            \$r->ping();
            echo 'ok';
            exit(0);
        } catch (Exception \$e) {
            exit(1);
        }
    " 2>/dev/null; then
        REDIS_OK=1
        break
    fi
    sleep 2
done

if [ $REDIS_OK -eq 0 ]; then
    echo "⚠ Redis connection failed - falling back to file-based cache/sessions"
    # Replace ANY cache/session/queue driver with safe fallbacks
    sed -i 's/^CACHE_STORE=.*/CACHE_STORE=file/' /var/www/.env
    sed -i 's/^SESSION_DRIVER=.*/SESSION_DRIVER=file/' /var/www/.env
    sed -i 's/^QUEUE_CONNECTION=.*/QUEUE_CONNECTION=database/' /var/www/.env
    # Update saved values so we restore the correct fallback after migration
    ORIG_CACHE_STORE="file"
    ORIG_SESSION_DRIVER="file"
    ORIG_QUEUE_CONNECTION="database"
else
    echo "✓ Redis connection established"
fi

# =============================================================================
# 4. Run migrations (with safe drivers to avoid chicken-and-egg)
# =============================================================================
echo "[4/7] Running database migrations..."

# CRITICAL FIX: Force array driver during migration to prevent chicken-and-egg problem.
# When CACHE_STORE=database or SESSION_DRIVER=database, Laravel tries to access
# the 'cache' and 'sessions' tables during boot — but they don't exist yet on
# a fresh database. This causes an immediate crash (exit code 255).
# Using 'array' driver keeps everything in-memory during migration.
echo "  Temporarily setting CACHE_STORE=array, SESSION_DRIVER=array for migration..."
sed -i 's/^CACHE_STORE=.*/CACHE_STORE=array/' /var/www/.env
sed -i 's/^SESSION_DRIVER=.*/SESSION_DRIVER=array/' /var/www/.env

# Also clear any cached config to ensure fresh .env values are used
php artisan config:clear 2>/dev/null || true

# Run migration with env overrides as extra safety (belt-and-suspenders)
CACHE_STORE=array SESSION_DRIVER=array QUEUE_CONNECTION=sync \
    php artisan migrate --force --no-interaction -v 2>&1
MIGRATE_EXIT=$?

# Restore original driver values after migration
echo "  Restoring drivers: CACHE=$ORIG_CACHE_STORE SESSION=$ORIG_SESSION_DRIVER QUEUE=$ORIG_QUEUE_CONNECTION"
sed -i "s/^CACHE_STORE=.*/CACHE_STORE=${ORIG_CACHE_STORE}/" /var/www/.env
sed -i "s/^SESSION_DRIVER=.*/SESSION_DRIVER=${ORIG_SESSION_DRIVER}/" /var/www/.env

# Clear config cache again so Laravel picks up the restored values
php artisan config:clear 2>/dev/null || true

if [ $MIGRATE_EXIT -eq 0 ]; then
    echo "✓ Migrations completed"
else
    echo "✗ Migration failed with exit code $MIGRATE_EXIT"
    # Show Laravel log for debugging
    echo "--- Last 30 lines of Laravel log ---"
    tail -n 30 /var/www/storage/logs/laravel.log 2>/dev/null || echo "(no log file)"
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
