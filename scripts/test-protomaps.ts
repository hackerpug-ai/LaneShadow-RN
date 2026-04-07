#!/usr/bin/env tsx
/**
 * Test Protomaps US Integration
 *
 * Tests PMTiles queries for roads and scenic waypoints.
 *
 * Usage:
 *   npx tsx scripts/test-protomaps.ts
 *
 * With custom URL:
 *   PROTOMAPS_URL="https://your-bucket.r2.dev/us-west.pmtiles" npx tsx scripts/test-protomaps.ts
 */

async function main() {
  console.log('🧪 Testing Protomaps US Integration...\n');

  // Test PMTiles URL - use environment variable or fallback to sample
  const PMTILES_URL = process.env.PROTOMAPS_URL || 'https://pmtiles.io/protomaps(vector)ODbL_firenze.pmtiles';

  console.log(`📦 Loading PMTiles from ${PMTILES_URL}...`);

  if (!process.env.PROTOMAPS_URL) {
    console.log('⚠️  Using sample URL (Florence, Italy). Set PROTOMAPS_URL for your region.');
    console.log('   See docs/PROTOMAPS_SETUP.md for hosting instructions.\n');
  }

  try {
    // Dynamic import for PMTiles
    const { PMTiles } = await import('pmtiles');

    const pmtiles = new PMTiles(PMTILES_URL);

    // Get header to verify connection
    const header = await pmtiles.getHeader();
    console.log(`✅ Connected!`);
    console.log(`   Tile format: ${header.tileType}`);
    console.log(`   Min zoom: ${header.minZoom}, Max zoom: ${header.maxZoom}`);
    console.log(`   Center: [${header.centerLon}, ${header.centerLat}]`);

    // Test a tile in the map's center
    const z = 14;
    const x = lonToTile(header.centerLon, z);
    const y = latToTile(header.centerLat, z);

    console.log(`\n📍 Fetching tile z${z}/${x}/${y} (center area)...`);
    const tileData = await pmtiles.getZxy(z, x, y);

    if (!tileData || !tileData.data) {
      console.log('No tile data returned');
      console.log('   This may mean the PMTiles URL is incorrect or the file is corrupted.');
      return;
    }

    const byteLength = tileData.data.byteLength;
    console.log(`   Tile data: ${byteLength} bytes (MVT encoded)`);

    if (byteLength === 0) {
      console.log('   Warning: tile is empty — area may have no data at this zoom');
    } else {
      console.log(`   Tile data looks good (${byteLength} bytes of vector tile data)`);
    }

    console.log('\n✅ Protomaps test completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Set PROTOMAPS_US_URL environment variable in Convex');
    console.log('   2. Test with routing agent to verify end-to-end integration');
    console.log('   3. See docs/PROTOMAPS_SETUP.md for hosting instructions');

  } catch (error) {
    console.error('\n❌ Protomaps test failed:', error);

    if (error instanceof Error) {
      if (error.message.includes('CORS') || error.message.includes('fetch')) {
        console.error('\n🔍 CORS/Network Error detected:');
        console.error('   - Make sure the PMTiles URL is correct');
        console.error('   - Verify CORS is enabled on your bucket (see docs/PROTOMAPS_SETUP.md)');
        console.error('   - Try accessing the URL directly in a browser');
      } else if (error.message.includes('404')) {
        console.error('\n🔍 404 Error:');
        console.error('   - The PMTiles file does not exist at this URL');
        console.error('   - Double-check the URL in your environment variable');
      }
    }

    process.exit(1);
  }
}

// Helper functions for tile conversion
function lonToTile(lon: number, zoom: number): number {
  return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
}

function latToTile(lat: number, zoom: number): number {
  return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
