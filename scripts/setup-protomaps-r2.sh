#!/bin/bash
set -e

echo "🗺️  LaneShadow Protomaps R2 Setup"
echo "=================================="
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi

if ! command -v wrangler &> /dev/null; then
    echo "📦 Installing Wrangler CLI..."
    npm install -g wrangler
fi

echo "✅ Prerequisites check passed"
echo ""

# Prompt for bucket name
read -p "📝 Enter R2 bucket name [laneshadow-maps]: " BUCKET_NAME
BUCKET_NAME=${BUCKET_NAME:-laneshadow-maps}

echo ""
echo "🪣 Creating R2 bucket: $BUCKET_NAME"

# Create bucket
wrangler r2 bucket create "$BUCKET_NAME" 2>/dev/null || echo "   Bucket may already exist"

echo "✅ Bucket ready"
echo ""

# Create CORS configuration
echo "⚙️  Configuring CORS..."

cat > /tmp/laneshadow-cors.json <<EOF
{
  "AllowedOrigins": ["*"],
  "AllowedMethods": ["GET", "HEAD"],
  "AllowedHeaders": ["Range", "Content-Type"],
  "ExposeHeaders": ["Accept-Ranges", "Content-Range", "Content-Length"],
  "MaxAgeSeconds": 86400
}
EOF

wrangler r2 bucket cors put "$BUCKET_NAME" --config /tmp/laneshadow-cors.json

echo "✅ CORS configured"
echo ""

# Extract western US region
echo "🌍 Extracting western US region from Protomaps..."
echo "   This will download ~5GB of data"

BUILD_DATE=$(date +%Y%m%d)
PMTILES_FILE="us-west-${BUILD_DATE}.pmtiles"

# Check if pmtiles CLI is installed
if ! command -v pmtiles &> /dev/null; then
    echo "📦 Installing PMTiles CLI..."
    npm install -g pmtiles
fi

echo "   Downloading and extracting (this may take 10-20 minutes)..."
npx pmtiles extract "https://build.protomaps.com/${BUILD_DATE}.pmtiles" "$PMTILES_FILE" \
  --bbox="-125,32,-100,49" \
  --maxzoom=14

echo "✅ Extraction complete: $PMTILES_FILE"
ls -lh "$PMTILES_FILE"
echo ""

# Upload to R2
echo "☁️  Uploading to R2 (this may take 5-10 minutes)..."

wrangler r2 object put "$BUCKET_NAME/us-west.pmtiles" --file="$PMTILES_FILE"

echo "✅ Upload complete"
echo ""

# Get account ID for URL
ACCOUNT_ID=$(wrangler whoami | grep "Account ID" | awk '{print $3}' | tr -d '()')

if [ -z "$ACCOUNT_ID" ]; then
    echo "⚠️  Could not auto-detect account ID"
    echo ""
    echo "📝 To get your R2 URL:"
    echo "   1. Run: wrangler whoami"
    echo "   2. Copy your Account ID"
    echo "   3. Your URL will be: https://<account-id>.r2.dev/us-west.pmtiles"
else
    PMTILES_URL="https://${ACCOUNT_ID}.r2.dev/us-west.pmtiles"
    echo "🔗 Your PMTiles URL: $PMTILES_URL"
    echo ""

    # Set Convex environment variable
    echo "⚙️  Setting PROTOMAPS_US_URL in Convex..."
    npx convex env set PROTOMAPS_US_URL "$PMTILES_URL" --prod

    echo "✅ Convex environment variable set"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Test the connection: npx tsx scripts/test-protomaps.ts"
echo "   2. Test with the routing agent"
echo "   3. Monitor your R2 usage: wrangler r2 bucket list"
echo ""
echo "💰 Cost estimate: ~$0.58/month for western US region"
echo ""

# Cleanup
rm -f /tmp/laneshadow-cors.json
