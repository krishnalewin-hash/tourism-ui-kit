#!/bin/bash
# Script to update your admin API key

cd "$(dirname "$0")/cloudflare-api"

echo "🔑 Updating Admin API Key..."
echo ""
echo "Enter a strong password (min 20 characters, mix of letters/numbers/symbols):"
echo ""

npx wrangler secret put ADMIN_API_KEY

echo ""
echo "✅ API key updated!"
echo ""
echo "⚠️  Don't forget to update the key in your admin dashboard:"
echo "1. Open the admin UI"
echo "2. Enter your new API key in the configuration section"
echo "3. Click 'Save Configuration'"

