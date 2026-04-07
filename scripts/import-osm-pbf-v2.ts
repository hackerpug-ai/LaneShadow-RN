#!/usr/bin/env tsx
/**
 * OSM Data Import Script (PBF Parser v2)
 *
 * Imports OpenStreetMap data using osm-pbf-parser library.
 * Simple streaming parser for OSM PBF files.
 *
 * Usage:
 *   npx tsx scripts/import-osm-pbf-v2.ts --region=district-of-columbia
 */

import osmPbfParser from 'osm-pbf-parser';
import { S2LatLng, S2CellId } from "nodes2ts";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

interface ImportOptions {
  region: string;
  sourceUrl?: string;
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
 * Parse OSM PBF file and extract nodes and ways
 */
async function parseOsmPbf(pbfPath: string): Promise<{
  nodes: any[];
  ways: any[];
}> {
  console.log(`\n🔄 Parsing OSM PBF file...`);

  const scenicNodes: any[] = [];
  const roadWays: any[] = [];
  const nodeMap = new Map<number, { lat: number; lon: number }>();

  let featureCount = 0;

  return new Promise((resolve, reject) => {
    const parser = osmPbfParser();

    parser.on('data', (data: any) => {
      featureCount++;

      if (data.type === 'node') {
        nodeMap.set(data.id, { lat: data.lat, lon: data.lon });

        // Check if this is a scenic node
        const tags = data.tags || {};
        let nodeType: string | null = null;
        if (tags.tourism === 'viewpoint') {
          nodeType = 'viewpoint';
        } else if (tags.mountain_pass === 'yes') {
          nodeType = 'mountain_pass';
        } else if (tags.natural === 'peak' && tags.name) {
          nodeType = 'peak';
        }

        if (nodeType) {
          scenicNodes.push({
            osmId: data.id,
            type: nodeType,
            name: tags.name,
            lat: data.lat,
            lon: data.lon,
            tags,
            s2Token: generateS2Token(data.lat, data.lon),
            importedAt: Date.now(),
          });
        }
      } else if (data.type === 'way') {
        const tags = data.tags || {};

        // Only process ways with highway tag
        if (tags.highway) {
          // Build geometry from node references
          const geometry: number[][] = [];
          for (const nodeId of data.nodeRefs || []) {
            const node = nodeMap.get(nodeId);
            if (node) {
              geometry.push([node.lon, node.lat]);
            }
          }

          // Skip if geometry is too small
          if (geometry.length >= 2) {
            const bounds = calculateBounds(geometry);

            // Generate S2 tokens for bbox coverage
            const s2Tokens = [
              generateS2Token(bounds.south, bounds.west),
              generateS2Token(bounds.north, bounds.east),
            ];

            roadWays.push({
              osmId: data.id,
              name: tags.name,
              highwayClass: tags.highway,
              surface: tags.surface,
              geometry,
              bounds,
              s2Tokens,
              importedAt: Date.now(),
            });
          }
        }
      }

      // Progress update every 1000 features
      if (featureCount % 1000 === 0) {
        process.stdout.write(`\r   Processed: ${featureCount} features`);
      }
    });

    parser.on('end', () => {
      console.log(`\r✅ Processed ${featureCount} features`);
      console.log(`   Found ${scenicNodes.length} scenic nodes`);
      console.log(`   Found ${roadWays.length} road ways`);
      resolve({ nodes: scenicNodes, ways: roadWays });
    });

    parser.on('error', (error: Error) => {
      console.error(`\n⚠️  PBF parsing error:`, error.message);
      reject(error);
    });

    // Pipe the file to the parser
    const fileStream = fs.createReadStream(pbfPath);
    fileStream.pipe(parser);
  });
}

/**
 * Import batch to Convex via CLI
 */
function importBatchViaCli(
  action: string,
  data: any[]
): { inserted: number; updated: number; total: number } {
  if (data.length === 0) {
    return { inserted: 0, updated: 0, total: 0 };
  }

  const argsKey = action === "importNodes" ? "nodes" : "ways";
  const argsJson = JSON.stringify({ [argsKey]: data });

  try {
    const result = execSync(
      `npx convex run actions/osm:${action} '${argsJson.replace(/'/g, "'\"'\"'")}'`,
      { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }
    );
    return JSON.parse(result) as { inserted: number; updated: number; total: number };
  } catch (error: any) {
    console.error(`\n⚠️  Batch import failed: ${error.message}`);
    return { inserted: 0, updated: 0, total: data.length };
  }
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

    // Step 2: Parse PBF file
    const { nodes, ways } = await parseOsmPbf(pbfPath);

    // Step 3: Import to Convex in batches
    const BATCH_SIZE = 100;

    if (nodes.length > 0) {
      console.log(`\n📦 Importing nodes to Convex...`);
      let nodesInserted = 0;
      let nodesUpdated = 0;
      for (let i = 0; i < nodes.length; i += BATCH_SIZE) {
        const batch = nodes.slice(i, i + BATCH_SIZE);
        const result = importBatchViaCli("importNodes", batch);
        nodesInserted += result.inserted;
        nodesUpdated += result.updated;
        process.stdout.write(`\r   Progress: ${Math.min(i + BATCH_SIZE, nodes.length)}/${nodes.length}`);
      }
      console.log(`\n✅ Nodes: ${nodesInserted} inserted, ${nodesUpdated} updated`);
    } else {
      console.log(`\n⚠️  No scenic nodes found to import`);
    }

    if (ways.length > 0) {
      console.log(`\n📦 Importing ways to Convex...`);
      let waysInserted = 0;
      let waysUpdated = 0;
      for (let i = 0; i < ways.length; i += BATCH_SIZE) {
        const batch = ways.slice(i, i + BATCH_SIZE);
        const result = importBatchViaCli("importWays", batch);
        waysInserted += result.inserted;
        waysUpdated += result.updated;
        process.stdout.write(`\r   Progress: ${Math.min(i + BATCH_SIZE, ways.length)}/${ways.length}`);
      }
      console.log(`\n✅ Ways: ${waysInserted} inserted, ${waysUpdated} updated`);
    } else {
      console.log(`\n⚠️  No road ways found to import`);
    }

    // Summary
    console.log(`\n` + "━".repeat(50));
    console.log(`✨ Import complete!`);
    console.log(`   Nodes: ${nodes.length} processed`);
    console.log(`   Ways: ${ways.length} processed`);
    console.log(`\n🎯 Next steps:`);
    console.log(`   1. Verify data in Convex dashboard`);
    console.log(`   2. Test queries with the routing agent`);
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
    console.error("Usage: npx tsx scripts/import-osm-pbf-v2.ts --region=district-of-columbia");
    process.exit(1);
  }

  const region = regionArg.split("=")[1];

  await main({ region });
}

if (require.main === module) {
  cli().catch((error) => {
    console.error("\n❌ Import failed:", error.message);
    process.exit(1);
  });
}

export { main };
