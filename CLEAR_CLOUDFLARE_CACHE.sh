#!/bin/bash
# Clear Cloudflare Worker cache to show updated tour prices

echo "🔄 Purging Cloudflare cache for tourism API..."
echo ""

cd "$(dirname "$0")/cloudflare-api"

# Deploy triggers a cache purge
echo "Redeploying worker (this clears Cloudflare's edge cache)..."
npx wrangler deploy

echo ""
echo "✅ Cache cleared!"
echo ""
echo "📝 What happened:"
echo "   - Cloudflare's edge cache was purged"
echo "   - Fresh data will be served on next request"
echo "   - Your website will now show updated prices"
echo ""
echo "🌐 Test it:"
echo "   curl 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours?client=kamar-tours'"
echo ""
echo "💡 Tip: Any time you update tour prices, run this script"
echo "        Or just redeploy: cd cloudflare-api && npx wrangler deploy"

