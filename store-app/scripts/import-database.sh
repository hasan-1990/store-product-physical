#!/bin/bash

# ========================================
# MongoDB Database Import Script
# ========================================

set -e

echo "🔄 Starting database import process..."

# Wait for MongoDB to be fully ready
sleep 10

MONGO_HOST="mongodb"
MONGO_PORT="27017"
BACKUP_DIR="/backup"

# Check if backup directory exists and has files
if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR)" ]; then
    echo "⚠️  No backup directory found or it's empty. Skipping import."
    exit 0
fi

echo "📁 Found backup directory: $BACKUP_DIR"

# Find the latest backup folder (format: backup-YYYY-MM-DD...)
LATEST_BACKUP=$(ls -td $BACKUP_DIR/backup-*/ 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "⚠️  No backup-* folders found. Checking for direct backup files..."
    
    # Check for mongodump format (bson files)
    if ls $BACKUP_DIR/*.bson 1> /dev/null 2>&1; then
        echo "✅ Found BSON backup files"
        BACKUP_PATH="$BACKUP_DIR"
    # Check for JSON exports
    elif ls $BACKUP_DIR/*.json 1> /dev/null 2>&1; then
        echo "✅ Found JSON backup files"
        BACKUP_PATH="$BACKUP_DIR"
    else
        echo "⚠️  No valid backup files found. Skipping import."
        exit 0
    fi
else
    echo "✅ Using latest backup: $LATEST_BACKUP"
    BACKUP_PATH="$LATEST_BACKUP"
fi

# Build MongoDB connection string
MONGO_URI="mongodb://${MONGO_ROOT_USER}:${MONGO_ROOT_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB_NAME}?authSource=admin"

echo "🔄 Importing database from: $BACKUP_PATH"

# Try mongorestore first (for BSON dumps)
if ls $BACKUP_PATH/*.bson 1> /dev/null 2>&1 || ls $BACKUP_PATH/*/*.bson 1> /dev/null 2>&1; then
    echo "📦 Restoring from mongodump format..."
    
    mongorestore \
        --uri="$MONGO_URI" \
        --nsInclude="${MONGO_DB_NAME}.*" \
        --drop \
        "$BACKUP_PATH"
    
    if [ $? -eq 0 ]; then
        echo "✅ Database restored successfully from mongodump!"
        exit 0
    else
        echo "❌ Failed to restore from mongodump"
    fi
fi

# Try JSON import
if ls $BACKUP_PATH/*.json 1> /dev/null 2>&1; then
    echo "📦 Importing from JSON files..."
    
    for json_file in $BACKUP_PATH/*.json; do
        # Get collection name from filename
        collection_name=$(basename "$json_file" .json)
        
        echo "📥 Importing collection: $collection_name"
        
        mongoimport \
            --uri="$MONGO_URI" \
            --collection="$collection_name" \
            --file="$json_file" \
            --jsonArray \
            --drop
        
        if [ $? -eq 0 ]; then
            echo "✅ Collection $collection_name imported successfully"
        else
            echo "⚠️  Failed to import collection $collection_name"
        fi
    done
    
    echo "✅ JSON import completed!"
    exit 0
fi

echo "⚠️  No valid backup format found to import"
exit 0
