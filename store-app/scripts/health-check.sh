#!/bin/bash

# ========================================
# Complete System Check Script
# ========================================

set -e

echo "🔍 System Health Check"
echo "========================================"

# Check Docker
echo ""
echo "📦 Docker Status:"
docker --version
docker compose version

# Check running containers
echo ""
echo "🐳 Running Containers:"
docker compose ps

# Check service health
echo ""
echo "🏥 Service Health:"

# App health
APP_HEALTH=$(curl -s http://localhost:3000/api/health | jq -r '.status' 2>/dev/null || echo "unavailable")
echo "  App: $APP_HEALTH"

# Deploy readiness (secrets, dev routes, maintenance settings)
DEPLOY_READY=$(curl -s http://localhost:3000/api/health/deploy | jq -r '.ready' 2>/dev/null || echo "unavailable")
if [ "$DEPLOY_READY" == "true" ]; then
    echo "  Deploy checks: passed"
else
    echo "  Deploy checks: FAILED"
    curl -s http://localhost:3000/api/health/deploy | jq '.checks[] | select(.ok==false)' 2>/dev/null || true
fi

# MongoDB health
MONGO_HEALTH=$(docker compose exec -T mongodb mongosh --quiet --eval "db.adminCommand('ping').ok" 2>/dev/null || echo "0")
if [ "$MONGO_HEALTH" == "1" ]; then
    echo "  MongoDB: healthy"
else
    echo "  MongoDB: unhealthy"
fi

# Redis health
REDIS_HEALTH=$(docker compose exec -T redis redis-cli -a "${REDIS_PASSWORD}" ping 2>/dev/null || echo "unavailable")
if [ "$REDIS_HEALTH" == "PONG" ]; then
    echo "  Redis: healthy"
else
    echo "  Redis: unhealthy"
fi

# Check disk space
echo ""
echo "💾 Disk Usage:"
df -h | grep -E '^/dev/'

# Check memory
echo ""
echo "🧠 Memory Usage:"
free -h

# Check SSL certificate
echo ""
echo "🔒 SSL Certificate:"
if [ -d "./certbot/conf/live/${DOMAIN_NAME}" ]; then
    CERT_EXPIRY=$(docker compose exec -T certbot openssl x509 -enddate -noout -in "/etc/letsencrypt/live/${DOMAIN_NAME}/fullchain.pem" 2>/dev/null | cut -d= -f2 || echo "Not found")
    echo "  Expires: $CERT_EXPIRY"
else
    echo "  Status: Not configured"
fi

# Check active cron jobs
echo ""
echo "⏰ Active Cron Jobs:"
CRON_COUNT=$(docker compose exec -T mongodb mongosh --quiet -u "${MONGO_ROOT_USER}" -p "${MONGO_ROOT_PASSWORD}" --authenticationDatabase admin "${MONGO_DB_NAME}" --eval "db.cronJobs.countDocuments({enabled: true})" 2>/dev/null || echo "0")
echo "  Enabled: $CRON_COUNT"

echo ""
echo "========================================"
echo "✅ Health check completed"
echo ""
