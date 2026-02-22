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
# Defaults are safe (file/database) — if Redis is available, set these explicitly in Dokploy
CACHE_STORE="${CACHE_STORE:-file}"
QUEUE_CONNECTION="${QUEUE_CONNECTION:-database}"
SESSION_DRIVER="${SESSION_DRIVER:-file}"
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

# Read Redis config from .env
REDIS_HOST_VAL=$(grep '^REDIS_HOST=' /var/www/.env | cut -d'=' -f2 | tr -d '"')
REDIS_PORT_VAL=$(grep '^REDIS_PORT=' /var/www/.env | cut -d'=' -f2 | tr -d '"')
REDIS_PASSWORD_VAL=$(grep '^REDIS_PASSWORD=' /var/www/.env | cut -d'=' -f2 | tr -d '"')
REDIS_USERNAME_VAL=$(grep '^REDIS_USERNAME=' /var/www/.env | cut -d'=' -f2 | tr -d '"')

REDIS_OK=0

# Skip Redis check entirely if REDIS_HOST is not configured
if [ -z "$REDIS_HOST_VAL" ] || [ "$REDIS_HOST_VAL" = "" ]; then
    echo "  REDIS_HOST is empty — skipping Redis check"
else
    echo "  Redis config: HOST=$REDIS_HOST_VAL PORT=${REDIS_PORT_VAL:-6379} USER=${REDIS_USERNAME_VAL:-none}"

    # First check if Redis port is reachable via TCP
    REDIS_TCP_OK=0
    for i in 1 2 3 4 5; do
        if nc -z -w3 "$REDIS_HOST_VAL" "${REDIS_PORT_VAL:-6379}" 2>/dev/null; then
            REDIS_TCP_OK=1
            break
        fi
        echo "  TCP to Redis attempt $i/5..."
        sleep 2
    done

    if [ $REDIS_TCP_OK -eq 0 ]; then
        echo "  ✗ Cannot reach Redis at $REDIS_HOST_VAL:${REDIS_PORT_VAL:-6379} — TCP timeout"
    else
        echo "  ✓ Redis TCP connection OK"
        # Now try actual Redis AUTH + PING
        REDIS_RETRIES=5
        REDIS_COUNT=0

        until [ $REDIS_COUNT -eq $REDIS_RETRIES ]; do
            REDIS_COUNT=$((REDIS_COUNT + 1))
            echo "  Redis auth+ping attempt $REDIS_COUNT/$REDIS_RETRIES"

            REDIS_ERR=$(php -r "
                \$r = new Redis();
                try {
                    \$r->connect('${REDIS_HOST_VAL}', (int)'${REDIS_PORT_VAL:-6379}', 5);
                    \$user = '${REDIS_USERNAME_VAL:-}';
                    \$pass = '${REDIS_PASSWORD_VAL:-null}';
                    if (\$pass && \$pass !== 'null') {
                        if (\$user && \$user !== 'default' && \$user !== '') {
                            \$r->auth([\$user, \$pass]);
                        } else {
                            \$r->auth(\$pass);
                        }
                    }
                    \$r->ping();
                    echo 'OK';
                    exit(0);
                } catch (Exception \$e) {
                    fwrite(STDERR, \$e->getMessage());
                    exit(1);
                }
            " 2>&1)

            if [ $? -eq 0 ]; then
                REDIS_OK=1
                break
            fi
            echo "    Error: $REDIS_ERR"
            sleep 2
        done
    fi
fi

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
    # If drivers are set to default (file/database), upgrade to redis for better performance
    if [ "$ORIG_CACHE_STORE" = "file" ] || [ "$ORIG_CACHE_STORE" = "database" ]; then
        echo "  ↑ Upgrading CACHE_STORE to redis"
        sed -i 's/^CACHE_STORE=.*/CACHE_STORE=redis/' /var/www/.env
        ORIG_CACHE_STORE="redis"
    fi
    if [ "$ORIG_SESSION_DRIVER" = "file" ] || [ "$ORIG_SESSION_DRIVER" = "database" ]; then
        echo "  ↑ Upgrading SESSION_DRIVER to redis"
        sed -i 's/^SESSION_DRIVER=.*/SESSION_DRIVER=redis/' /var/www/.env
        ORIG_SESSION_DRIVER="redis"
    fi
    if [ "$ORIG_QUEUE_CONNECTION" = "database" ]; then
        echo "  ↑ Upgrading QUEUE_CONNECTION to redis"
        sed -i 's/^QUEUE_CONNECTION=.*/QUEUE_CONNECTION=redis/' /var/www/.env
        ORIG_QUEUE_CONNECTION="redis"
    fi
fi

# =============================================================================
# 4. Run migrations (with safe drivers to avoid chicken-and-egg)
# =============================================================================
echo "[4/7] Running database migrations..."

# CRITICAL FIX: Force array driver during migration to prevent chicken-and-egg problem.
echo "  Temporarily setting CACHE_STORE=array, SESSION_DRIVER=array for migration..."
sed -i 's/^CACHE_STORE=.*/CACHE_STORE=array/' /var/www/.env
sed -i 's/^SESSION_DRIVER=.*/SESSION_DRIVER=array/' /var/www/.env
sed -i 's/^QUEUE_CONNECTION=.*/QUEUE_CONNECTION=sync/' /var/www/.env

# Ensure bootstrap/cache files exist (package:discover generates packages.php)
# These are REQUIRED for Laravel to boot — without them, artisan crashes with exit 255
if [ ! -f /var/www/bootstrap/cache/packages.php ]; then
    echo "  ⚠ bootstrap/cache/packages.php missing — running package:discover..."
    CACHE_STORE=array SESSION_DRIVER=array QUEUE_CONNECTION=sync \
        php artisan package:discover --ansi 2>&1 || echo "  ⚠ package:discover had issues"
else
    echo "  ✓ bootstrap/cache/packages.php exists"
fi

# --- Diagnostics ---
echo "  [DEBUG] PHP version:"
php -v 2>&1 | head -1
echo "  [DEBUG] PHP extensions check:"
php -m 2>&1 | grep -iE "pdo|mysql|redis|json|mbstring|openssl|tokenizer|xml|ctype|bcmath" | tr '\n' ', '
echo ""
echo "  [DEBUG] .env driver values after sed:"
grep -E '^(CACHE_STORE|SESSION_DRIVER|QUEUE_CONNECTION|DB_)' /var/www/.env
echo "  [DEBUG] Checking artisan can boot..."
php artisan --version 2>&1
ARTISAN_EXIT=$?
echo "  [DEBUG] artisan --version exit code: $ARTISAN_EXIT"

if [ $ARTISAN_EXIT -ne 0 ]; then
    echo "  ✗ artisan failed to boot! Trying with error display..."
    php -d display_errors=1 -d error_reporting=E_ALL artisan --version 2>&1
    echo "  [DEBUG] Trying config:clear with full error output..."
    php -d display_errors=1 -d error_reporting=E_ALL artisan config:clear 2>&1
fi
# --- End Diagnostics ---

# Clear any cached config to ensure fresh .env values are used
echo "  [DEBUG] Running config:clear..."
php artisan config:clear 2>&1 || echo "  ⚠ config:clear failed (see above)"

# Run migration with env overrides as extra safety
echo "  Starting migration..."
CACHE_STORE=array SESSION_DRIVER=array QUEUE_CONNECTION=sync \
    php -d display_errors=1 -d error_reporting=E_ALL \
    artisan migrate --force --no-interaction -v > /tmp/migrate_output.log 2>&1
MIGRATE_EXIT=$?
cat /tmp/migrate_output.log

echo "  Migration exit code: $MIGRATE_EXIT"

# Restore original driver values after migration
echo "  Restoring drivers: CACHE=$ORIG_CACHE_STORE SESSION=$ORIG_SESSION_DRIVER QUEUE=$ORIG_QUEUE_CONNECTION"
sed -i "s/^CACHE_STORE=.*/CACHE_STORE=${ORIG_CACHE_STORE}/" /var/www/.env
sed -i "s/^SESSION_DRIVER=.*/SESSION_DRIVER=${ORIG_SESSION_DRIVER}/" /var/www/.env
sed -i "s/^QUEUE_CONNECTION=.*/QUEUE_CONNECTION=${ORIG_QUEUE_CONNECTION}/" /var/www/.env

# Clear config cache again so Laravel picks up the restored values
php artisan config:clear 2>/dev/null || true

if [ $MIGRATE_EXIT -eq 0 ]; then
    echo "✓ Migrations completed"
else
    echo "✗ Migration failed with exit code $MIGRATE_EXIT"
    echo "--- Migration output ---"
    cat /tmp/migrate_output.log 2>/dev/null || echo "(no output captured)"
    echo "--- Last 50 lines of Laravel log ---"
    tail -n 50 /var/www/storage/logs/laravel.log 2>/dev/null || echo "(no log file)"
    echo "--- PHP error log ---"
    find /var/log -name "php*" -type f -exec tail -n 20 {} \; 2>/dev/null || echo "(no php error log)"
    echo "--- dmesg (last 5 lines, check for OOM/segfault) ---"
    dmesg 2>/dev/null | tail -n 5 || echo "(dmesg not available)"
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
