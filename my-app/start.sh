#!/bin/sh
set -e

echo "========================================"
echo "Dota 2 Leaderboard Startup Script"
echo "========================================"

# Run database migration first
echo ""
echo "[1/3] Running database migration..."
cd /app
npx prisma migrate deploy || echo "Migration may have already been applied or failed - continuing..."

# Run crawler if CRAWL_ON_STARTUP is set
echo ""
echo "[2/3] Checking if crawler should run..."
if [ "$CRAWL_ON_STARTUP" = "true" ]; then
    echo "CRAWL_ON_STARTUP=true, running crawler..."
    npx tsx scripts/crawler.ts || echo "Crawler failed - continuing to start app..."
else
    echo "CRAWL_ON_STARTUP not set, skipping crawler"
fi

# Start the application
echo ""
echo "[3/3] Starting Next.js application..."
exec node server.js
