#!/bin/bash

# ========================================
# Restore Database from Backup
# ========================================

set -e

if [ -z "$1" ]; then
    echo "Usage: ./restore-database.sh <backup-file.tar.gz>"
    echo ""
    echo "Available backups:"
    ls -lh ./database-backup/*.tar.gz 2>/dev/null || echo "  No backups found"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  WARNING: This will replace the current database!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

echo "📦 Extracting backup..."
TEMP_DIR=$(mktemp -d)
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

echo "🔄 Restoring database..."
docker compose exec -T mongodb mongorestore \
    --uri="mongodb://${MONGO_ROOT_USER}:${MONGO_ROOT_PASSWORD}@localhost:27017/${MONGO_DB_NAME}?authSource=admin" \
    --drop \
    "$TEMP_DIR"

# Cleanup
rm -rf "$TEMP_DIR"

echo "✅ Database restored successfully!"
echo "🔄 Restarting app..."
docker compose restart app

echo "✅ Done!"
