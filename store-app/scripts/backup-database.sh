#!/bin/bash

# ========================================
# Database Backup Script
# Backs up MongoDB database
# ========================================

set -e

BACKUP_DIR="./database-backup"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_PATH="${BACKUP_DIR}/backup-${TIMESTAMP}"

echo "📦 Creating database backup..."

# Create backup directory
mkdir -p "$BACKUP_PATH"

# Run mongodump
docker compose exec -T mongodb mongodump \
    --uri="mongodb://${MONGO_ROOT_USER}:${MONGO_ROOT_PASSWORD}@localhost:27017/${MONGO_DB_NAME}?authSource=admin" \
    --out="/backup/backup-${TIMESTAMP}"

# Compress backup
cd "$BACKUP_DIR"
tar -czf "backup-${TIMESTAMP}.tar.gz" "backup-${TIMESTAMP}"
rm -rf "backup-${TIMESTAMP}"

echo "✅ Backup created: ${BACKUP_DIR}/backup-${TIMESTAMP}.tar.gz"

# Keep only last 7 backups
ls -t backup-*.tar.gz | tail -n +8 | xargs -r rm

echo "🧹 Old backups cleaned up (kept last 7)"
