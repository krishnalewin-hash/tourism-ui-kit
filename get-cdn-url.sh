#!/bin/bash

# Get current commit hash
COMMIT=$(git rev-parse HEAD)

# Base URL
BASE="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit"

echo "🎯 Current commit URLs for immediate use:"
echo ""
echo "CSS: ${BASE}@${COMMIT}/src/tour-category/css/cards.css"
echo "JS:  ${BASE}@${COMMIT}/src/tour-category/js/cards.js"
echo ""
echo "📋 Copy this for your embed script:"
echo "<link rel=\"stylesheet\" href=\"${BASE}@${COMMIT}/src/tour-category/css/cards.css\">"
echo "<script defer src=\"${BASE}@${COMMIT}/src/tour-category/js/cards.js\"></script>"
echo ""
echo "⏰ @main URLs (may take 12+ hours to update):"
echo "CSS: ${BASE}@main/src/tour-category/css/cards.css"
echo "JS:  ${BASE}@main/src/tour-category/js/cards.js"