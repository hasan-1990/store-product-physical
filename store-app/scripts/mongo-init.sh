#!/bin/bash

# ========================================
# MongoDB Initialization Script
# ========================================

set -e

echo "🔧 Initializing MongoDB..."

# This script runs automatically when MongoDB container starts for the first time
# It creates the database and ensures proper indexing

mongosh <<EOF
use ${MONGO_INITDB_DATABASE}

// Create indexes for better performance
db.products.createIndex({ "active": 1, "createdAt": -1 })
db.products.createIndex({ "slug": 1 }, { unique: true })
db.products.createIndex({ "sequentialId": 1 })
db.categories.createIndex({ "slug": 1 }, { unique: true })
db.orders.createIndex({ "orderNumber": 1 }, { unique: true })
db.orders.createIndex({ "userId": 1, "createdAt": -1 })
db.users.createIndex({ "email": 1 }, { unique: true, sparse: true })
db.users.createIndex({ "mobile": 1 }, { unique: true, sparse: true })
db.cronJobs.createIndex({ "enabled": 1, "schedule": 1 })
db.tickets.createIndex({ "userId": 1, "status": 1 })

print("✅ MongoDB indexes created successfully")
EOF

echo "✅ MongoDB initialization completed!"
