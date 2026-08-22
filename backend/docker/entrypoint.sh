#!/bin/sh
set -e

php artisan config:clear
php artisan migrate --force
php artisan storage:link || true

exec "$@"
