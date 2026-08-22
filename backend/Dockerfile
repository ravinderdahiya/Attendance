# Build context: backend/
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --ignore-platform-reqs
COPY . .
RUN composer dump-autoload --optimize --no-dev

FROM php:8.3-fpm-alpine
RUN apk add --no-cache postgresql-dev icu-dev oniguruma-dev libzip-dev \
    && docker-php-ext-install pdo pdo_pgsql intl mbstring bcmath zip

WORKDIR /var/www/html
COPY --from=vendor /app ./
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh \
    && chown -R www-data:www-data storage bootstrap/cache

EXPOSE 9000
ENTRYPOINT ["/entrypoint.sh"]
CMD ["php-fpm"]
