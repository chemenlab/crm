# =============================================================================
# Stage 1: Builder (Dependencies & Build Frontend)
# =============================================================================
FROM php:8.4-fpm-alpine AS builder

# Install system dependencies
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev \
    zip \
    unzip \
    icu-dev \
    mysql-client \
    nodejs \
    npm \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        gd \
        zip \
        bcmath \
        intl \
        opcache \
        exif

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy composer files
COPY composer.json composer.lock ./

# Install PHP dependencies (production only)
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --optimize-autoloader

# Copy package files
COPY package.json package-lock.json ./

# Install npm dependencies
RUN npm ci

# Copy application code
COPY . .

# Complete composer autoload (skip scripts to avoid Laravel boot during build)
RUN composer dump-autoload --no-dev --optimize --no-scripts

# Build frontend assets
RUN npm run build

# Clean up
RUN rm -rf node_modules tests

# =============================================================================
# Stage 2: Production Image
# =============================================================================
FROM php:8.4-fpm-alpine

# Install runtime dependencies and build dependencies
RUN apk add --no-cache \
    nginx \
    supervisor \
    mysql-client \
    libpng \
    libjpeg-turbo \
    freetype \
    libzip \
    icu-libs \
    dcron \
    busybox-suid \
    # Build dependencies (will be removed after compilation)
    && apk add --no-cache --virtual .build-deps \
    $PHPIZE_DEPS \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev \
    icu-dev \
    zlib-dev \
    # Configure and install PHP extensions
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        gd \
        zip \
        bcmath \
        intl \
        opcache \
        exif \
    # Remove build dependencies to keep image small
    && apk del .build-deps

# Create www user
RUN addgroup -g 1000 www && \
    adduser -u 1000 -G www -s /bin/sh -D www

# Set working directory
WORKDIR /var/www

# Copy application from builder
COPY --from=builder --chown=www:www /var/www /var/www

# Copy configuration files
COPY --chown=www:www docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY --chown=www:www docker/nginx/default.conf /etc/nginx/http.d/default.conf
COPY --chown=www:www docker/php/php.ini /usr/local/etc/php/php.ini
COPY --chown=www:www docker/php/php-fpm.conf /usr/local/etc/php-fpm.d/www.conf
COPY --chown=www:www docker/php/opcache.ini /usr/local/etc/php/conf.d/opcache.ini
COPY --chown=www:www docker/supervisor/supervisord.conf /etc/supervisord.conf

# Copy entrypoint script
COPY --chown=www:www docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Create necessary directories
RUN mkdir -p \
    /var/www/storage/app/public \
    /var/www/storage/framework/cache \
    /var/www/storage/framework/sessions \
    /var/www/storage/framework/views \
    /var/www/storage/logs \
    /var/log/supervisor \
    /var/log/nginx \
    && chown -R www:www /var/www/storage \
    && chmod -R 775 /var/www/storage \
    && chown -R www:www /var/log/supervisor

# Configure PHP-FPM to run as www user
RUN sed -i 's/user = nobody/user = www/g' /usr/local/etc/php-fpm.d/www.conf && \
    sed -i 's/group = nobody/group = www/g' /usr/local/etc/php-fpm.d/www.conf

# Configure Nginx to run as www user
RUN sed -i 's/user nginx;/user www;/g' /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -f http://localhost/up || exit 1

# Set entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# Default command
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
