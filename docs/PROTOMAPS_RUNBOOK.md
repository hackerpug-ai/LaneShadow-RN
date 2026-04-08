# Protomaps Production Operations Runbook

This runbook covers incident response procedures for the Protomaps map data system.

## Incident: Protomaps Fallback Rate High

### Detection

**Alert Condition**: Protomaps fallback rate exceeds 10% for 5 minutes

**Monitoring**:
```bash
# Check recent fallback rate in logs
npx convex logs --kind protomaps.fallback --minutes 10

# View error logs
npx convex logs --kind protomaps.error --minutes 10
```

**Symptoms**:
- Increased latency on map loads
- Users seeing blank map tiles
- Logs showing repeated `protomaps.fallback` messages

### Diagnosis

1. **Check Convex environment variables**
   ```bash
   npx convex env get R2_S3_ACCESS_KEY_ID
   npx convex env get R2_S3_SECRET_ACCESS_KEY
   npx convex env get R2_S3_ENDPOINT
   npx convex env get R2_S3_BUCKET
   npx convex env get R2_S3_REGION
   npx convex env get PROTOMAPS_US_URL
   ```

2. **Test R2 connectivity**
   ```bash
   # List bucket contents (requires AWS CLI configured)
   aws s3 ls s3://laneshadow/map-data/ --endpoint-url=$(npx convex env get R2_S3_ENDPOINT)

   # Test file accessibility
   curl -I "$(npx convex env get PROTOMAPS_US_URL)"
   ```

3. **Check PMTiles file integrity**
   ```bash
   # Run diagnostic script
   npx tsx scripts/test-protomaps.ts
   ```

4. **Review error patterns**
   ```bash
   # Look for specific error types
   npx convex logs --kind protomaps.error --minutes 30 | grep -E "credentials|CORS|403|404"
   ```

### Resolution

**If credentials expired or invalid**:
1. Access [Cloudflare R2 Dashboard](https://dash.cloudflare.com/)
2. Generate new API token with R2 read permissions
3. Update credentials in Convex dashboard:
   - Navigate to project Settings → Environment Variables
   - Update `R2_S3_ACCESS_KEY_ID` and `R2_S3_SECRET_ACCESS_KEY`
4. Verify with: `npx tsx scripts/test-protomaps.ts`

**If bucket is missing or empty**:
1. Check if bucket exists: `aws s3 ls s3://laneshadow/`
2. If missing, restore from backup:
   - Locate backup in R2 or local storage
   - Re-run sync process following [PROTOMAPS_QUICKSTART.md](PROTOMAPS_QUICKSTART.md)
3. If partial data exists, re-sync PMTiles file

**If CORS error**:
1. Re-apply CORS configuration to R2 bucket:
   ```bash
   aws s3api put-bucket-cors \
     --bucket laneshadow \
     --endpoint-url=$(npx convex env get R2_S3_ENDPOINT) \
     --cors-configuration file:infra/r2-cors.json
   ```
2. Verify CORS headers:
   ```bash
   curl -I "$(npx convex env get PROTOMAPS_US_URL)" | grep -i access-control
   ```

**If PMTiles file corrupted**:
1. Delete corrupted file from R2
2. Re-download fresh PMTiles from Protomaps
3. Re-upload to R2 following sync procedures

### Verification

```bash
# Full end-to-end test
PROTOMAPS_URL=$(npx convex env get PROTOMAPS_US_URL) npx tsx scripts/test-protomaps.ts

# Monitor fallback rate for 10 minutes
npx convex logs --kind protomaps.fallback --minutes 10

# Test in production environment
# Load map in app and verify tiles render correctly
```

**Success Criteria**:
- Fallback rate < 5%
- No `protomaps.error` logs for 10 minutes
- Test script passes all checks
- Map tiles render in production

---

## Incident: Users Report Wrong Routes

### Detection

**Symptoms**:
- Users report routes appearing in incorrect geographic locations
- Routes not matching road network
- Coordinate values seem offset or transformed incorrectly

**Detection Methods**:
- User support tickets
- Manual spot-check of route visualizations
- Log monitoring for coordinate transformation errors

### Diagnosis

1. **Test coordinate transformation with known values**
   ```bash
   # Run coordinate transform tests
   npm test -- --testNamePattern="coordinate.*transform"

   # Check for recent changes to transform logic
   git log --oneline --all -- convex/lib/coordinates.ts
   ```

2. **Verify MVT decoding with sample tiles**
   ```bash
   # Test MVT tile decoding
   npx tsx scripts/test-mvt-decoding.ts

   # Compare tile coordinates with known ground truth
   npx tsx scripts/verify-tile-coordinates.ts
   ```

3. **Check for regressions in tile processing**
   ```bash
   # Review recent changes to map tile code
   git log --oneline --all --since="2 weeks ago" -- convex/lib/map-tiles.ts

   # Run map tile tests
   npm test -- convex/lib/map-tiles.test.ts
   ```

4. **Inspect actual coordinate values from logs**
   ```bash
   # Look for suspicious coordinate values in logs
   npx convex logs --kind map.debug --minutes 60 | grep -E "coordinate|lat|lng"
   ```

### Resolution

**If coordinate transformation bug found**:
1. Identify root cause in transform logic
2. Write regression test for the bug
3. Fix the transformation function
4. Verify fix with test suite
5. Deploy patch to production
6. Monitor for recurrence

**If MVT decoding issue**:
1. Verify MVT spec compliance
2. Check Protobuf schema changes
3. Update decoder if needed
4. Test with multiple tile zoom levels
5. Deploy fix

**If data corruption in PMTiles**:
1. Verify source data from Protomaps
2. Re-download and re-sync PMTiles file
3. Clear any cached tile data
4. Verify routes render correctly after sync

**If regression from recent deploy**:
1. Identify offending commit
2. Revert or fix the regression
3. Add regression test
4. Deploy fix

### Verification

```bash
# Run full map test suite
npm test -- --testPathPattern="map|tile|coordinate"

# Manually verify known routes
# 1. Load map in production
# 2. Plot test routes in known locations
# 3. Verify coordinates match ground truth

# Check logs for continued errors
npx convex logs --kind map.error --minutes 30
```

**Success Criteria**:
- All coordinate tests pass
- Manual verification of test routes succeeds
- No user reports for 24 hours
- No coordinate errors in logs

---

## Incident: Map Data Stale

### Detection

**Automated Monitoring**:
- Weekly cron job checks data freshness
- Alert if data exceeds 30 days old

**Manual Check**:
```bash
# Check data freshness
npx convex run actions/mapData:checkFreshness

# View last sync timestamp
npx convex run queries/mapData:getLastSync

# Check PMTiles file metadata
npx tsx scripts/check-protomaps-freshness.ts
```

**Symptoms**:
- Missing new roads or features
- Out-of-date place names
- Recent construction not shown

### Diagnosis

1. **Check last successful sync**
   ```bash
   npx convex run queries/mapData:getLastSync
   ```

2. **Verify sync cron job status**
   ```bash
   # Check GitHub Actions workflow runs
   gh run list --workflow=sync-protomaps.yml

   # View recent workflow logs
   gh run view --workflow=sync-protomaps.yml --log
   ```

3. **Check available Protomaps releases**
   ```bash
   # View latest releases
   curl -s https://github.com/protomaps/basemaps/releases | grep -oP '"tag_name":\s*"\K[^"]*'

   # Compare with current version
   npx convex env get PROTOMAPS_VERSION
   ```

4. **Verify R2 bucket write access**
   ```bash
   # Test write permissions
   aws s3 cp /tmp/test.txt s3://laneshadow/map-data/test.txt \
     --endpoint-url=$(npx convex env get R2_S3_ENDPOINT)

   aws s3 rm s3://laneshadow/map-data/test.txt \
     --endpoint-url=$(npx convex env get R2_S3_ENDPOINT)
   ```

### Resolution

**Manual sync (quick method)**:
1. Follow [PROTOMAPS_QUICKSTART.md](PROTOMAPS_QUICKSTART.md)
2. Key steps:
   ```bash
   # Download latest PMTiles
   wget https://build.protomaps.com/20241120.pmtiles north-america.pmtiles

   # Upload to R2
   aws s3 cp north-america.pmtiles s3://laneshadow/map-data/ \
     --endpoint-url=$(npx convex env get R2_S3_ENDPOINT)

   # Update version in Convex
   npx convex env set PROTOMAPS_VERSION "20241120"
   ```

**Trigger GitHub Actions workflow**:
1. Navigate to repository Actions tab
2. Select "Sync Protomaps Data" workflow
3. Click "Run workflow"
4. Select branch (usually `main`)
5. Click "Run workflow"
6. Monitor execution in Actions logs

**If sync fails**:
1. Check GitHub Actions logs for errors
2. Verify R2 credentials in workflow secrets
3. Check available storage in R2 bucket
4. Verify network connectivity from GitHub runner
5. Re-run workflow after fixing issues

### Verification

```bash
# Verify new version is active
npx convex env get PROTOMAPS_VERSION

# Check data freshness
npx convex run actions/mapData:checkFreshness

# Test map rendering
# Load map in app and verify new features appear

# Verify file accessibility
curl -I "$(npx convex env get PROTOMAPS_US_URL)"
```

**Success Criteria**:
- `checkFreshness` returns data < 30 days old
- New map features visible in production
- PMTiles URL returns 200 OK
- No sync errors in logs

---

## General Troubleshooting Commands

### Quick Health Check
```bash
# Check all Protomaps-related environment variables
npx convex env get PROTOMAPS_US_URL
npx convex env get R2_S3_ENDPOINT
npx convex env get R2_S3_BUCKET

# Test R2 connectivity
aws s3 ls s3://laneshadow/map-data/ --endpoint-url=$(npx convex env get R2_S3_ENDPOINT)

# Run diagnostic script
npx tsx scripts/test-protomaps.ts

# Check recent error logs
npx convex logs --kind protomaps.error --minutes 30
```

### Log Monitoring
```bash
# All Protomaps logs
npx convex logs --kind protomaps --minutes 60

# Fallback rate
npx convex logs --kind protomaps.fallback --minutes 60 | wc -l

# Errors only
npx convex logs --kind protomaps.error --minutes 60

# Map debugging
npx convex logs --kind map.debug --minutes 30
```

### Data Integrity
```bash
# Test PMTiles file
npx tsx scripts/test-protomaps.ts

# Check data freshness
npx convex run actions/mapData:checkFreshness

# Verify coordinate transformations
npm test -- --testNamePattern="coordinate"
```

---

## Related Documentation

- [PROTOMAPS_QUICKSTART.md](PROTOMAPS_QUICKSTART.md) - Setup and sync procedures
- [Convex logs documentation](https://docs.convex.dev/production/logging)
- [R2 documentation](https://developers.cloudflare.com/r2/)

---

## Escalation

**If unable to resolve within 30 minutes**:
1. Escalate to infrastructure lead
2. Create incident ticket with details
3. Document all attempted resolutions
4. Preserve logs and error messages

**Post-Incident**:
1. Document root cause
2. Update this runbook if new issue type discovered
3. Add monitoring/alerting for detected issues
4. Create follow-up tasks for prevention
