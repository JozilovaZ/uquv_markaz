#!/bin/sh
set -e

# Copy built frontend dist into shared volume (only if volume is empty)
if [ -z "$(ls -A /app/frontend/dist 2>/dev/null)" ]; then
    echo "Populating frontend dist volume..."
    cp -r /app/frontend_baked/. /app/frontend/dist/
fi

# Run DB migrations
python manage.py migrate --noinput

# Seed database
python -c "from api.db import init_db; init_db()" || true

# Collect Django static files into shared volume
python manage.py collectstatic --noinput

# Start Gunicorn
exec gunicorn kurstanla.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
