#!/bin/bash
# Auto-cleanup rebuild script for store-app
# این اسکریپت ایمیج‌های قدیمی رو پاک میکنه و rebuild میکنه

set -e  # Stop on error

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 شروع Smart Rebuild..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1: Show disk usage before
echo ""
echo "💾 فضای دیسک قبل از پاک‌سازی:"
docker system df

# Step 2: حذف dangling images
echo ""
echo "🧹 پاک‌سازی dangling images..."
docker image prune -f

# Step 3: Build جدید
echo ""
echo "🔨 شروع rebuild..."
cd "$(dirname "$0")"
docker compose up -d --build app

# Step 4: Wait for startup
echo ""
echo "⏳ صبر برای start شدن..."
sleep 5

# Step 5: حذف ایمیج‌های قدیمی (نگه‌داری فقط آخرین)
echo ""
echo "🗑️  حذف ایمیج‌های قدیمی و استفاده نشده..."
# حذف تمام ایمیج‌های unused بدون استثنا
docker image prune -a -f --filter "until=1h"

# Step 6: Show final disk usage
echo ""
echo "💾 فضای دیسک بعد از پاک‌سازی:"
docker system df

echo ""
echo "📊 ایمیج‌های store-app:"
docker images | grep -E "(REPOSITORY|store)" || echo "هیچ ایمیجی پیدا نشد"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ تمام شد! Container در حال اجراست."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
