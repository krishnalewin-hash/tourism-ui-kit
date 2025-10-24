#!/bin/bash

# Tourism UI Kit - Automated Deploy Script
# This script syncs static files and deploys to Cloudflare

set -e  # Exit on error

echo "🚀 Tourism UI Kit Deployment"
echo "=============================="
echo ""

# Step 1: Sync static files from src/ to cloudflare-api/static/
echo "📦 Step 1: Syncing static files..."
echo ""

# CSS files
echo "  → Copying CSS files..."
cp src/tour-detail/css/block-a.css cloudflare-api/static/css/
cp src/tour-detail/css/block-b.css cloudflare-api/static/css/
cp src/tour-detail/css/block-c.css cloudflare-api/static/css/
cp src/tour-detail-form/css/tour-detail-form.css cloudflare-api/static/css/
cp src/tour-category/css/cards.css cloudflare-api/static/css/

# JS files
echo "  → Copying JS files..."
cp src/tour-detail/js/block-a.js cloudflare-api/static/js/
cp src/tour-detail/js/block-b.js cloudflare-api/static/js/
cp src/tour-detail/js/block-c.js cloudflare-api/static/js/
cp src/tour-detail-form/js/tour-detail-form.js cloudflare-api/static/js/
cp src/tour-category/js/cards.js cloudflare-api/static/js/

echo "  ✅ Static files synced!"
echo ""

# Step 2: Deploy to Cloudflare
echo "☁️  Step 2: Deploying to Cloudflare..."
echo ""

cd cloudflare-api
npx wrangler deploy
cd ..

echo ""
echo "✨ Deployment complete!"
echo ""
echo "🌐 Your files are now live at:"
echo "  CSS: https://tourism-api-production.krishna-0a3.workers.dev/static/css/"
echo "  JS:  https://tourism-api-production.krishna-0a3.workers.dev/static/js/"
echo ""
echo "📝 Next steps:"
echo "  1. Test a file: curl https://tourism-api-production.krishna-0a3.workers.dev/static/js/block-a.js"
echo "  2. Update your GHL pages to use the new URLs"
echo "  3. Changes will be live in ~1 minute!"
echo ""

