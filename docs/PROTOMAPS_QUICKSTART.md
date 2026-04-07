# Quick Start: Protomaps R2 Setup for LaneShadow

This guide will walk you through setting up Cloudflare R2 to host PMTiles for LaneShadow.

## Prerequisites

```bash
# Install Wrangler CLI
npm install -g wrangler

# Authenticate with Cloudflare
wrangler login
```

## Step 1: Create R2 Bucket

```bash
# Create bucket
wrangler r2 bucket create laneshadow-maps
```

## Step 2: Configure CORS

Create `cors.json`:
```json
{
  "AllowedOrigins": ["*"],
  "AllowedMethods": ["GET", "HEAD"],
  "AllowedHeaders": ["Range", "Content-Type"],
  "ExposeHeaders": ["Accept-Ranges", "Content-Range", "Content-Length"],
  "MaxAgeSeconds": 86400
}
```

Apply CORS:
```bash
wrangler r2 bucket cors put laneshadow-maps --config cors.json
```

## Step 3: Extract Western US Region

```bash
# Install PMTiles CLI (if not already installed)
npm install -g pmtiles

# Extract western US (~5GB, takes 10-20 minutes)
BUILD_DATE=$(date +%Y%m%d)
npx pmtiles extract "https://build.protomaps.com/${BUILD_DATE}.pmtiles" "us-west-${BUILD_DATE}.pmtiles" \
  --bbox="-125,32,-100,49" \
  --maxzoom=14
```

**BBOX Explanation**: `-125,32,-100,49` covers:
- West Coast from California to Washington
- Inland to Idaho/Montana
- South to Northern California
- North to Canadian border

## Step 4: Upload to R2

```bash
# Upload (~5-10 minutes)
wrangler r2 object put laneshadow-maps/us-west.pmtiles --file="us-west-${BUILD_DATE}.pmtiles"
```

## Step 5: Get Your R2 URL

```bash
# Get your account ID
wrangler whoami
```

Your URL will be: `https://<account-id>.r2.dev/us-west.pmtiles`

## Step 6: Set Convex Environment Variable

```bash
# Set in production
PMTILES_URL="https://<account-id>.r2.dev/us-west.pmtiles"
npx convex env set PROTOMAPS_US_URL "$PMTILES_URL" --prod

# Verify
npx convex env get PROTOMAPS_US_URL --prod
```

## Step 7: Test Integration

```bash
# Test with your URL
PROTOMAPS_URL="$PMTILES_URL" npx tsx scripts/test-protomaps.ts

# Or test default (should now use your R2 URL)
npx tsx scripts/test-protomaps.ts
```

## Optional: Set Local Development Variable

Create `convex/.env.local`:
```bash
echo "PROTOMAPS_US_URL=$PMTILES_URL" > convex/.env.local
```

## Cost Estimate

For western US extract (~5GB):
- **Storage**: $0.075/month (5GB × $0.015/GB)
- **Requests**: ~$0.50/month (estimate)
- **Egress**: $0 (free on R2)
- **Total**: ~$0.58/month

## Troubleshooting

### "wrangler: command not found"
```bash
npm install -g wrangler
```

### CORS errors in browser
- Verify CORS is configured: `wrangler r2 bucket cors get laneshadow-maps`
- Check your bucket allows GET requests from your domain

### 404 on PMTiles URL
- Verify file exists: `wrangler r2 object list laneshadow-maps`
- Check the URL format: `https://<account-id>.r2.dev/us-west.pmtiles`

### Slow tile loading
- Normal for R2: p50 = 0.51s, p95 = 0.75s
- If slower than 2s consistently, check Cloudflare status

## Updates

To update your PMTiles monthly:

```bash
# Download new build
BUILD_DATE=$(date +%Y%m%d)
npx pmtiles extract "https://build.protomaps.com/${BUILD_DATE}.pmtiles" "us-west-${BUILD_DATE}.pmtiles" \
  --bbox="-125,32,-100,49" --maxzoom=14

# Upload (overwrites existing)
wrangler r2 object put laneshadow-maps/us-west.pmtiles --file="us-west-${BUILD_DATE}.pmtiles"
```

## Alternative Regions

### Full US (~15GB)
```bash
npx pmtiles extract "https://build.protomaps.com/${BUILD_DATE}.pmtiles" "us-${BUILD_DATE}.pmtiles" \
  --bbox="-125,25,-66,49" \
  --maxzoom=14
```

### Pacific Northwest Only (~2GB)
```bash
npx pmtiles extract "https://build.protomaps.com/${BUILD_DATE}.pmtiles" "pnw-${BUILD_DATE}.pmtiles" \
  --bbox="-124,41,-116,49" \
  --maxzoom=14
```

### California Only (~2GB)
```bash
npx pmtiles extract "https://build.protomaps.com/${BUILD_DATE}.pmtiles" "ca-${BUILD_DATE}.pmtiles" \
  --bbox="-125,32,-114,42" \
  --maxzoom=14
```
