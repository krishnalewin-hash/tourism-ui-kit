#!/bin/bash

# Smart CDN URL generator for development vs production

COMMIT=$(git rev-parse HEAD)
SHORT_COMMIT=$(git rev-parse --short HEAD)
BRANCH=$(git branch --show-current)

BASE="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit"

echo "🎯 CDN URL Options:"
echo ""

if [ "$1" = "dev" ] || [ "$1" = "development" ]; then
    echo "🔨 DEVELOPMENT MODE (immediate updates):"
    echo "CSS: ${BASE}@${COMMIT}/src/tour-category/css/cards.css"
    echo "JS:  ${BASE}@${COMMIT}/src/tour-category/js/cards.js"
    echo ""
    echo "📋 Dev Embed Code:"
    echo "<link rel=\"stylesheet\" href=\"${BASE}@${COMMIT}/src/tour-category/css/cards.css\">"
    echo "<script defer src=\"${BASE}@${COMMIT}/src/tour-category/js/cards.js\"></script>"
elif [ "$1" = "prod" ] || [ "$1" = "production" ]; then
    echo "🚀 PRODUCTION MODE (cached, stable):"
    echo "CSS: ${BASE}@main/src/tour-category/css/cards.css"
    echo "JS:  ${BASE}@main/src/tour-category/js/cards.js"
    echo ""
    echo "📋 Prod Embed Code:"
    echo "<link rel=\"stylesheet\" href=\"${BASE}@main/src/tour-category/css/cards.css\">"
    echo "<script defer src=\"${BASE}@main/src/tour-category/js/cards.js\"></script>"
else
    echo "Usage: $0 [dev|prod]"
    echo ""
    echo "Examples:"
    echo "  $0 dev   # Get commit-specific URLs for development"
    echo "  $0 prod  # Get @main URLs for production"
    echo ""
    echo "💡 Current status:"
    echo "   Commit: ${SHORT_COMMIT} (${COMMIT})"
    echo "   Branch: ${BRANCH}"
fi