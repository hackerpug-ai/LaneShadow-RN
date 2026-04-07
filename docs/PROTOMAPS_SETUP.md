# Hosting Protomaps PMTiles for LaneShadow

## Overview

Protomaps provides daily builds of OpenStreetMap data as PMTiles archives. LaneShadow uses these for fast OSM queries (roads, viewpoints, peaks, mountain passes) instead of the slow Overpass API.

**Important**: You cannot hotlink to the official Protomaps builds. You must host your own copy.

## Quick Start (Recommended)

### Option 1: Extract Western US Only (~5GB)

The fastest option for development - covers West Coast where most motorcycle routes are:

```bash
# Install PMTiles CLI
npm install -g pmtiles

# Extract western US from latest build
npx pmtiles extract https://build.protomaps.com/20260407.pmtiles us-west.pmtiles \
  --bbox="-125,32,-100,49" \
  --maxzoom=14

# Upload to your R2/S3 bucket
aws s3 cp us-west.pmtiles s3://your-bucket/us-west.pmtiles \
  --content-type "application/pmtiles"

# Set environment variable
export PROTOMAPS_US_URL="https://your-bucket.r2.dev/us-west.pmtiles"
```

### Option 2: Full US Extract (~15GB)

For production when you need nationwide coverage:

```bash
# Extract full US
npx pmtiles extract https://build.protomaps.com/20260407.pmtiles us.pmtiles \
  --bbox="-125,25,-66,49" \
  --maxzoom=14

# Upload to R2/S3
aws s3 cp us.pmtiles s3://your-bucket/us.pmtiles \
  --content-type "application/pmtiles"

# Set environment variable
export PROTOMAPS_US_URL="https://your-bucket.r2.dev/us.pmtiles"
```

### Option 3: Full Planet (~125GB)

Only needed if you're expanding internationally:

```bash
# Download full planet (takes hours)
wget https://build.protomaps.com/20260407.pmtiles

# Upload to R2/S3
aws s3 cp 20260407.pmtiles s3://your-bucket/planet.pmtiles \
  --content-type "application/pmtiles"

# Set environment variable
export PROTOMAPS_US_URL="https://your-bucket.r2.dev/planet.pmtiles"
```

## R2/S3 Setup with CORS

### Cloudflare R2 (Recommended)

Create an R2 bucket and enable CORS:

```bash
# Create bucket
wrangler r2 bucket create laneshadow-maps

# Set CORS (save to cors.json)
cat > cors.json <<EOF
{
  "AllowedOrigins": ["*"],
  "AllowedMethods": ["GET", "HEAD"],
  "AllowedHeaders": ["Range", "Content-Type"],
  "ExposeHeaders": ["Accept-Ranges", "Content-Range", "Content-Length"],
  "MaxAgeSeconds": 86400
}
EOF

# Apply CORS
wrangler r2 bucket cors put laneshadow-maps --config cors.json

# Upload PMTiles
wrangler r2 object put laneshadow-maps/us-west.pmtiles --file=us-west.pmtiles
```

Your URL will be: `https://<account-id>.r2.dev/us-west.pmtiles`

### AWS S3

```bash
# Create bucket
aws s3 mb s3://laneshadow-maps

# Set CORS
aws s3api put-bucket-cors --bucket laneshadow-maps --cors-configuration '{
  "CORSRules": [{
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["Range"],
    "ExposeHeaders": ["Accept-Ranges", "Content-Range"],
    "MaxAgeSeconds": 86400
  }]
}'

# Upload PMTiles
aws s3 cp us-west.pmtiles s3://laneshadow-maps/us-west.pmtiles
```

## Environment Variables

### Local Development

```bash
# .env.local
PROTOMAPS_US_URL=https://your-bucket.r2.dev/us-west.pmtiles
```

### Convex Deployment

```bash
# Set in Convex dashboard or via CLI
npx convex env set PROTOMAPS_US_URL "https://your-bucket.r2.dev/us-west.pmtiles"
```

## Verification

Test your PMTiles URL:

```bash
# Should return PMTiles header info
curl -I "https://your-bucket.r2.dev/us-west.pmtiles"

# Test with the test script
npx tsx scripts/test-protomaps.ts
```

## Cost Estimates

### R2 (Recommended)
- Storage: ~$0.015/GB/month
- Requests: 10,000 Class B operations free, then $4.50/M
- Bandwidth: **FREE** (no egress fees)
- **Monthly cost for western US**: ~$0.08 for 5GB storage + negligible requests

### S3
- Storage: ~$0.023/GB/month
- Requests: $0.0004/1K requests
- Bandwidth: ~$0.09/GB (expensive for maps!)
- **Monthly cost for western US**: ~$0.12 for 5GB + $9/100GB transfer

## Updates

Protomaps publishes daily builds. Update your copy periodically:

```bash
# Download latest build
BUILD_DATE=$(date +%Y%m%d)
wget https://build.protomaps.com/${BUILD_DATE}.pmtiles

# Re-extract your region
npx pmtiles extract ${BUILD_DATE}.pmtiles us-west.pmtiles \
  --bbox="-125,32,-100,49" --maxzoom=14

# Upload (overwrites existing)
aws s3 cp us-west.pmtiles s3://your-bucket/us-west.pmtiles
```

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser, verify:

```bash
# Check CORS headers
curl -I -H "Origin: https://example.com" \
  "https://your-bucket.r2.dev/us-west.pmtiles"

# Should include:
# Access-Control-Allow-Origin: *
# Access-Control-Expose-Headers: Accept-Ranges, Content-Range
```

### 404 Errors

- Verify the URL is correct
- Check the file exists in your bucket
- Ensure CORS is configured on the bucket

### Empty Results

- Verify bbox coordinates are correct (west,south,east,north)
- Check that maxzoom includes detail level you need (14 is good for roads)
- Test with the `scripts/test-protomaps.ts` script

## References

- [Protomaps Documentation](https://docs.protomaps.com/)
- [Daily Builds](https://maps.protomaps.com/builds)
- [PMTiles Specification](https://github.com/protomaps/PMTiles)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
