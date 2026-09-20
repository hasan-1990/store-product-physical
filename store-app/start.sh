#!/bin/sh
set -e

# Initialize postfix directories and permissions
echo "[start.sh] Initializing Postfix..."
mkdir -p /var/spool/postfix/pid
mkdir -p /var/spool/postfix/defer
mkdir -p /var/spool/postfix/active
mkdir -p /var/spool/postfix/bounce
mkdir -p /var/spool/postfix/corrupt
mkdir -p /var/spool/postfix/hold
mkdir -p /var/spool/postfix/incoming
mkdir -p /var/spool/postfix/maildrop
mkdir -p /var/spool/postfix/private
mkdir -p /var/spool/postfix/public
mkdir -p /var/spool/postfix/saved
mkdir -p /var/lib/postfix
chown -R root:root /var/spool/postfix /var/lib/postfix /etc/postfix

# Prepare postfix tables
postmap /etc/postfix/transport 2>/dev/null || true
postmap /etc/postfix/virtual 2>/dev/null || true

# Start postfix (sendmail)
echo "[start.sh] Starting Postfix (sendmail)..."
postfix start || true

# Wait a moment for postfix to start
sleep 2

# run Next.js app
echo "[start.sh] Starting Next.js app..."
exec node server.js
