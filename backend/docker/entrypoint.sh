#!/bin/sh
set -e

php artisan config:clear
php artisan migrate --force
php artisan storage:link || true
# Optional production manager bootstrap (MANAGER_USERNAME / MANAGER_PASSWORD in .env).
php artisan app:ensure-manager || true

exec "$@"
