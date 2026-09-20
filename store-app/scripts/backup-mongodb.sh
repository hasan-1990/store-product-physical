#!/bin/bash

# ========================================
# Automated MongoDB Backup Script
# ========================================

# Load environment variables
set -a
source .env 2>/dev/null || true
set +a

# Configuration
BACKUP_DIR="./database-backup"
BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
RETENTION_DAYS=7

# MongoDB credentials from environment
MONGO_USER="${MONGO_ROOT_USER:-admin}"
MONGO_PASS="${MONGO_ROOT_PASSWORD:-your_secure_password}"
MONGO_DB="${MONGO_DB_NAME:-store_db}"
MONGO_HOST="mongodb"

echo "🚀 Starting MongoDB backup..."
echo "📅 Backup name: $BACKUP_NAME"
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR/$BACKUP_NAME"

# Perform backup using docker exec
echo "📦 Creating database dump..."
docker compose exec -T mongodb mongodump \
    --username="$MONGO_USER" \
    --password="$MONGO_PASS" \
    --authenticationDatabase=admin \
    --db="$MONGO_DB" \
    --out="/backup/$BACKUP_NAME"

if [ $? -eq 0 ]; then
    echo "✅ Database dump created successfully!"
    
    # Compress backup
    echo "🗜️  Compressing backup..."
    cd "$BACKUP_DIR"
    tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME"
    
    if [ $? -eq 0 ]; then
        echo "✅ Backup compressed successfully!"
        
        # Remove uncompressed backup
        rm -rf "$BACKUP_NAME"
        
        # Calculate size
        SIZE=$(du -h "$BACKUP_NAME.tar.gz" | cut -f1)
        echo "📊 Backup size: $SIZE"
        
        cd ..
    else
        echo "❌ Failed to compress backup!"
        exit 1
    fi
    
    # Clean old backups
    echo ""
    echo "🧹 Cleaning old backups (older than $RETENTION_DAYS days)..."
    find "$BACKUP_DIR" -name "backup-*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete
    
    echo "✅ Backup completed successfully!"
    echo "📁 Location: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
    echo ""
    
    # Optional: Upload to cloud storage (uncomment if needed)
    # echo "☁️  Uploading to cloud storage..."
    # aws s3 cp "$BACKUP_DIR/$BACKUP_NAME.tar.gz" s3://your-bucket/backups/
    # OR
    # rclone copy "$BACKUP_DIR/$BACKUP_NAME.tar.gz" remote:backups/
    
else
    echo "❌ Backup failed!"
    exit 1
fi

# List recent backups
echo "📋 Recent backups:"
ls -lh "$BACKUP_DIR"/*.tar.gz 2>/dev/null | tail -5

echo ""
echo "✨ All done!"
