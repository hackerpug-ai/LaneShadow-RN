#!/usr/bin/env tsx
/**
 * OSM Data Import Script
 *
 * Imports OpenStreetMap data into Convex for fast, reliable queries.
 * Replaces slow Overpass API calls with local Convex queries.
 *
 * Usage:
 *   npx tsx scripts/import-osm-data.ts --region=washington
 *
 * Prerequisites:
 *   - npm install osmtogeojson nodes2ts
 *   - OSM data from https://download.geofabrik.de/
 *
 * Data Sources:
 *   - Washington: https://download.geofabrik.de/north-america/us/washington-latest.osm.pbf
 *   - Oregon: https://download.geofabrik.de/north-america/us/oregon-latest.osm.pbf
 *   - California: https://download.geofabrik.de/north-america/us/california-latest.osm.pbf
 */

import osmtogeojson from "osmtogeojson";
import { S2LatLng, S2CellId } from "nodes2ts";
import fs from "fs";
import path from "path";

interface ImportOptions {
  region: string;
  sourceUrl?: string;
  convexUrl: string;
  convexAdminKey: string;
}

interface BoundingBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

// S2 level 10 ≈ 10km cells - balances query efficiency and precision
const S2_LEVEL = 10;

/**
 * Generate S2 token for spatial indexing
 */
function generateS2Token(lat: number, lon: number): string {
  const cellId = S2CellId.fromPoint(
    S2LatLng.fromDegrees(lat, lon).toPoint()
  ).parentL(S2_LEVEL);
  return cellId.toToken();
}

/**
 * Simplify geometry to first, last, and midpoint (reduces storage)
 */
function simplifyGeometry(coords: number[][]): number[][] {
  if (coords.length <= 3) return coords;
  return [
    coords[0],
    coords[Math.floor(coords.length / 2)],
    coords[coords.length - 1],
  ];
}

/**
 * Calculate bounding box from geometry coordinates
 */
function calculateBounds(coords: number[][]): BoundingBox {
  const lats = coords.map((c) => c[1]);
  const lons = coords.map((c) => c[0]);
  return {
    south: Math.min(...lats),
    west: Math.min(...lons),
    north: Math.max(...lats),
    east: Math.max(...lons),
  };
}

/**
 * Download OSM PBF file
 */
async function downloadOsmPbf(url: string, outputPath: string): Promise<void> {
  console.log(`📥 Downloading OSM data from: ${url}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(buffer));

  const sizeMB = (buffer.byteLength / 1024 / 1024).toFixed(2);
  console.log(`✅ Downloaded ${sizeMB}MB to: ${outputPath}`);
}

/**
 * Extract scenic nodes from GeoJSON
 */
function extractScenicNodes(features: any[]): any[] {
  const nodes: any[] = [];

  for (const feature of features) {
    const { type, geometry, properties } = feature;

    // Only process node features with Point geometry
    if (type !== "node" || geometry?.type !== "Point") continue;

    const [lon, lat] = geometry.coordinates;

    // Classify node type
    let nodeType: string | null = null;
    if (properties?.tourism === "viewpoint") {
      nodeType = "viewpoint";
    } else if (properties?.mountain_pass === "yes") {
      nodeType = "mountain_pass";
    } else if (properties?.natural === "peak" && properties?.name) {
      nodeType = "peak";
    }

    if (nodeType) {
      nodes.push({
        osmId: properties?.id,
        type: nodeType,
        name: properties?.name,
        lat,
        lon,
        tags: properties,
        s2Token: generateS2Token(lat, lon),
        importedAt: Date.now(),
      });
    }
  }

  return nodes;
}

/**
 * Extract road ways from GeoJSON
 */
function extractRoadWays(features: any[]): any[] {
  const ways: any[] = [];

  for (const feature of features) {
    const { type, geometry, properties } = feature;

    // Only process way features with LineString geometry
    if (type !== "way" || geometry?.type !== "LineString") continue;

    // Skip unnamed ways or ways without highway tag
    if (!properties?.highway) continue;

    const coords = geometry.coordinates as number[][];
    const bounds = calculateBounds(coords);

    // Generate S2 tokens for bbox coverage (ways can span cells)
    const s2Tokens = [
      generateS2Token(bounds.south, bounds.west),
      generateS2Token(bounds.north, bounds.east),
    ];

    ways.push({
      osmId: properties?.id,
      name: properties?.name,
      highwayClass: properties?.highway,
      surface: properties?.surface,
      geometry: simplifyGeometry(coords),
      bounds,
      s2Tokens,
      importedAt: Date.now(),
    });
  }

  return ways;
}

/**
 * Import batch to Convex via HTTP endpoint
 */
async function importBatch(
  convexUrl: string,
  convexAdminKey: string,
  endpoint: string,
  data: any[]
): Promise<{ inserted: number; updated: number; total: number }> {
  const response = await fetch(`${convexUrl}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Convex ${convexAdminKey}`,
    },
    body: JSON.stringify({ [endpoint === "/osm/importNodes" ? "nodes" : "ways"]: data }),
  });

  if (!response.ok) {
    throw new Error(`Import failed: ${response.statusText}`);
  }

  return (await response.json()) as { inserted: number; updated: number; total: number };
}

/**
 * Main import function
 */
async function main(options: ImportOptions): Promise<void> {
  console.log(`\n🌍 OSM Data Import for: ${options.region}`);
  console.log(`━`.repeat(50));

  // Default Geofabrik URLs if not provided
  const sourceUrl =
    options.sourceUrl ||
    `https://download.geofabrik.de/north-america/us/${options.region}-latest.osm.pbf`;

  const tmpDir = "/tmp";
  const pbfPath = path.join(tmpDir, `${options.region}.osm.pbf`);

  try {
    // Step 1: Download OSM PBF
    await downloadOsmPbf(sourceUrl, pbfPath);

    // Step 2: Convert to GeoJSON
    console.log(`\n🔄 Converting OSM PBF to GeoJSON...`);
    const pbfBuffer = fs.readFileSync(pbfPath);
    const geojson = osmtogeojson(pbfBuffer);
    console.log(`✅ Converted ${geojson.features.length} features`);

    // Step 3: Extract nodes and ways
    console.log(`\n🔍 Extracting scenic nodes...`);
    const nodes = extractScenicNodes(geojson.features);
    console.log(`✅ Found ${nodes.length} scenic nodes`);

    console.log(`\n🔍 Extracting road ways...`);
    const ways = extractRoadWays(geojson.features);
    console.log(`✅ Found ${ways.length} road ways`);

    // Step 4: Import to Convex in batches
    const BATCH_SIZE = 100;

    console.log(`\n📦 Importing nodes to Convex...`);
    let nodesInserted = 0;
    let nodesUpdated = 0;
    for (let i = 0; i < nodes.length; i += BATCH_SIZE) {
      const batch = nodes.slice(i, i + BATCH_SIZE);
      const result = await importBatch(
        options.convexUrl,
        options.convexAdminKey,
        "/osm/importNodes",
        batch
      );
      nodesInserted += result.inserted;
      nodesUpdated += result.updated;
      process.stdout.write(`\r   Progress: ${Math.min(i + BATCH_SIZE, nodes.length)}/${nodes.length}`);
    }
    console.log(`\n✅ Nodes: ${nodesInserted} inserted, ${nodesUpdated} updated`);

    console.log(`\n📦 Importing ways to Convex...`);
    let waysInserted = 0;
    let waysUpdated = 0;
    for (let i = 0; i < ways.length; i += BATCH_SIZE) {
      const batch = ways.slice(i, i + BATCH_SIZE);
      const result = await importBatch(
        options.convexUrl,
        options.convexAdminKey,
        "/osm/importWays",
        batch
      );
      waysInserted += result.inserted;
      waysUpdated += result.updated;
      process.stdout.write(`\r   Progress: ${Math.min(i + BATCH_SIZE, ways.length)}/${ways.length}`);
    }
    console.log(`\n✅ Ways: ${waysInserted} inserted, ${waysUpdated} updated`);

    // Summary
    console.log(`\n` + "━".repeat(50));
    console.log(`✨ Import complete!`);
    console.log(`   Nodes: ${nodesInserted + nodesUpdated} total`);
    console.log(`   Ways: ${waysInserted + waysUpdated} total`);
    console.log(`\n🎯 Next steps:`);
    console.log(`   1. Test queries with: npx tsx scripts/benchmark-osm.ts`);
    console.log(`   2. Monitor import jobs in Convex dashboard`);
  } finally {
    // Cleanup temp file
    if (fs.existsSync(pbfPath)) {
      fs.unlinkSync(pbfPath);
    }
  }
}

/**
 * CLI entry point
 */
async function cli() {
  const args = process.argv.slice(2);
  const regionArg = args.find((a) => a.startsWith("--region="));

  if (!regionArg) {
    console.error("Usage: npx tsx scripts/import-osm-data.ts --region=washington");
    process.exit(1);
  }

  const region = regionArg.split("=")[1];

  // Get Convex deployment URL and admin key from environment
  const convexUrl = process.env.CONVEX_DEPLOYMENT || "";
  const convexAdminKey = process.env.CONVEX_ADMIN_KEY || "";

  if (!convexUrl || !convexAdminKey) {
    console.error("Error: CONVEX_DEPLOYMENT and CONVEX_ADMIN_KEY environment variables required");
    console.error("\nGet them from:");
    console.error("  npx convex dev  # for development");
    console.error("  npx convex deploy  # for production");
    process.exit(1);
  }

  await main({
    region,
    convexUrl,
    convexAdminKey,
  });
}

if (require.main === module) {
  cli().catch((error) => {
    console.error("\n❌ Import failed:", error.message);
    process.exit(1);
  });
}

export { main };
