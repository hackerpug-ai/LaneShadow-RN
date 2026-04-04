#!/bin/bash
# Sync environment variables from Convex to .env.local
# Usage: ./scripts/sync-env-from-convex.sh

echo "📡 Fetching environment variables from Convex..."

# Check if Convex is configured
if ! npx convex env list &>/dev/null; then
    echo "❌ Convex not configured. Please run 'npx convex dev' first."
    exit 1
fi

# Get the Convex deployment URL
CONVEX_URL=$(npx convex env get CONVEX_DEPLOYMENT 2>/dev/null || echo "")
if [ -z "$CONVEX_URL" ]; then
    # Try to get from convex.json
    if [ -f "convex.json" ]; then
        CONVEX_URL=$(grep -o '"deploymentName"[^,]*' convex.json | cut -d'"' -f4 | head -1)
        if [ -n "$CONVEX_URL" ]; then
            CONVEX_URL="https://$CONVEX_URL.convex.cloud"
        fi
    fi
fi

if [ -z "$CONVEX_URL" ]; then
    echo "❌ Could not determine Convex deployment URL"
    exit 1
fi

echo "✅ Found Convex deployment: $CONVEX_URL"

# Update .env.local with Convex URL
if [ -f ".env.local" ]; then
    # Update existing EXPO_PUBLIC_CONVEX_URL or add it
    if grep -q "EXPO_PUBLIC_CONVEX_URL" .env.local; then
        sed -i.bak "s|EXPO_PUBLIC_CONVEX_URL=.*|EXPO_PUBLIC_CONVEX_URL=$CONVEX_URL|" .env.local
    else
        echo "EXPO_PUBLIC_CONVEX_URL=$CONVEX_URL" >> .env.local
    fi
    echo "✅ Updated .env.local with Convex URL"
else
    echo "❌ .env.local not found. Creating from template..."
    cp .env.example .env.local
    sed -i.bak "s|EXPO_PUBLIC_CONVEX_URL=.*|EXPO_PUBLIC_CONVEX_URL=$CONVEX_URL|" .env.local
    echo "✅ Created .env.local with Convex URL"
fi

# List all Convex environment variables
echo ""
echo "📋 Current Convex environment variables:"
npx convex env list

echo ""
echo "✅ Environment sync complete!"
echo ""
echo "⚠️  Make sure to also set these required variables in .env.local:"
echo "   - EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY"
echo "   - CLERK_SECRET_KEY"
echo "   - EXPO_PUBLIC_GOOGLE_PLACES_API_KEY"
