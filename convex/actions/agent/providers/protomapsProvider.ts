'use node';

/**
 * Protomaps OSM Provider
 *
 * Fast OSM data queries using Protomaps vector tiles (PMTiles) hosted on
 * Cloudflare R2. Provides US West coverage for road, POI, and scenic
 * waypoint lookups used by the routing agent.
 *
 * ## Architecture
 *
 *   Convex Action → presigned R2 URL → PMTiles HTTP range requests → vector tiles
 *
 * ## Required Env Vars (set in Convex dashboard)
 *
 *   PROTOMAPS_US_URL  — R2 object URL, e.g.
 *     https://<account>.r2.cloudflarestorage.com/laneshadow/map-data/us-canada.pmtiles
 *   R2_S3_API         — R2 S3-compatible endpoint
 *   R2_S3_KEY_ID      — R2 access key ID
 *   R2_S3_SECRET      — R2 secret access key
 *   R2_S3_BUCKET_NAME — "laneshadow"
 *
 * ## Refreshing Map Data
 *
 *   The PMTiles file on R2 is a static extract of Protomaps daily builds.
 *   A weekly Convex cron (convex/crons.ts) checks freshness. To update:
 *
 *     # 1. Extract US + Canada from latest build (~8 GB, 10-30 min)
 *     pmtiles extract "https://build.protomaps.com/$(date +%Y%m%d).pmtiles" \
 *       /tmp/us-canada.pmtiles --bbox="-170,24,-52,72" --maxzoom=14
 *
 *     # 2. Upload to R2
 *     export AWS_ACCESS_KEY_ID=<R2_S3_KEY_ID>
 *     export AWS_SECRET_ACCESS_KEY=<R2_S3_SECRET>
 *     pmtiles upload /tmp/us-canada.pmtiles map-data/us-canada.pmtiles \
 *       --bucket='s3://laneshadow?endpoint=https://<account>.r2.cloudflarestorage.com&region=auto'
 *
 *   See docs/PROTOMAPS_SETUP.md for full guide.
 *
 * ## CORS (already configured on R2 bucket "laneshadow")
 *
 *   origins: ["*"], methods: ["GET","HEAD"], headers: ["range","if-match"]
 *   exposeHeaders: ["etag"], maxAgeSeconds: 3000
 *   Config file: scripts/r2-cors.json
 *   Applied via: wrangler r2 bucket cors set laneshadow --file scripts/r2-cors.json
 */

import { PMTiles } from 'pmtiles';
import { VectorTile } from '@mapbox/vector-tile';
import Pbf from 'pbf';
import { S2LatLng, S2CellId } from 'nodes2ts';

// Protomaps layer names (from https://protomaps.com/styles/)
const LAYERS = {
  ROADS: 'roads',
  PLACES: 'places',
  POIS: 'pois',
  NATURAL: 'natural',
} as const;

// S2 level for tile calculations (z14 tiles ≈ 1km resolution)
const TILE_ZOOM = 14;
const S2_LEVEL = 10;

interface BoundingBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

interface OsmNode {
  osmId: number;
  type: 'viewpoint' | 'peak' | 'mountain_pass';
  name?: string;
  lat: number;
  lon: number;
  tags: Record<string, any>;
}

interface OsmWay {
  osmId: number;
  name?: string;
  highwayClass?: string;
  surface?: string;
  geometry: number[][];
  bounds: BoundingBox;
}

/**
 * Convert bbox to tile coordinates
 */
function bboxToTiles(bbox: BoundingBox, zoom: number): { minX: number; minY: number; maxX: number; maxY: number } {
  const minX = lonToTile(bbox.west, zoom);
  const maxX = lonToTile(bbox.east, zoom);
  const minY = latToTile(bbox.north, zoom);
  const maxY = latToTile(bbox.south, zoom);

  return { minX, minY, maxX, maxY };
}

function lonToTile(lon: number, zoom: number): number {
  return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
}

function latToTile(lat: number, zoom: number): number {
  return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
}

/**
 * Convert tile pixel coordinates to geographic coordinates.
 * MVT features use loadGeometry() which returns Points in tile-local coords (0-4096 extent).
 */
function tilePixelToLonLat(px: number, py: number, tileX: number, tileY: number, zoom: number, extent: number = 4096): [number, number] {
  const n = Math.pow(2, zoom);
  const lon = (tileX + px / extent) / n * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * (tileY + py / extent) / n)));
  const lat = latRad * 180 / Math.PI;
  return [lon, lat];
}

/** Feature with tile context for coordinate conversion */
type TileFeature = {
  feature: any;
  tileX: number;
  tileY: number;
  tileZoom: number;
  extent: number;
};

/**
 * Decode raw MVT ArrayBuffer into a VectorTile, then extract features from a layer.
 */
function extractFeaturesFromTile(
  tileData: any,
  layer: string,
  tileX: number,
  tileY: number,
  tileZoom: number,
  filter?: (feature: any) => boolean
): TileFeature[] {
  if (!tileData || !tileData.data || tileData.data.byteLength === 0) return [];

  // Decode the raw protobuf MVT bytes
  const tile = new VectorTile(new Pbf(tileData.data));
  const layerData = tile.layers[layer];
  if (!layerData) return [];

  const features: TileFeature[] = [];
  for (let i = 0; i < layerData.length; i++) {
    const feature = layerData.feature(i);
    if (!filter || filter(feature)) {
      features.push({ feature, tileX, tileY, tileZoom, extent: layerData.extent });
    }
  }

  return features;
}

/**
 * Build the R2 PMTiles URL from environment variables.
 *
 * If R2 credentials are available and PROTOMAPS_US_URL points to R2,
 * generates a presigned URL for authenticated access.
 * Otherwise uses PROTOMAPS_US_URL directly (for public URLs).
 */
export async function getProtomapsPresignedUrl(): Promise<string> {
  const baseUrl = process.env.PROTOMAPS_US_URL;
  const r2Endpoint = process.env.R2_S3_API;
  const r2KeyId = process.env.R2_S3_KEY_ID;
  const r2Secret = process.env.R2_S3_SECRET;
  const r2Bucket = process.env.R2_S3_BUCKET_NAME;

  // If URL points to R2 and we have credentials, generate presigned URL
  if (baseUrl && r2Endpoint && r2KeyId && r2Secret && r2Bucket && baseUrl.includes('r2.cloudflarestorage.com')) {
    const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

    const client = new S3Client({
      region: 'auto',
      endpoint: r2Endpoint,
      credentials: { accessKeyId: r2KeyId, secretAccessKey: r2Secret },
    });

    // Extract key from URL: endpoint/bucket/key → key
    const key = baseUrl.replace(`${r2Endpoint}/${r2Bucket}/`, '');

    const command = new GetObjectCommand({ Bucket: r2Bucket, Key: key });
    const presignedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

    console.log(`[Protomaps] Generated presigned R2 URL for ${key}`);
    return presignedUrl;
  }

  // Direct URL (public hosting, custom CDN, etc.)
  if (baseUrl) {
    return baseUrl;
  }

  // Fallback sample (Florence, Italy — for dev only)
  return 'https://pmtiles.io/protomaps(vector)ODbL_firenze.pmtiles';
}

/**
 * Synchronous URL getter for provider initialization.
 * Use getProtomapsPresignedUrl() for R2 authenticated access.
 */
export function getProtomapsUrl(): string {
  // Direct URL override (e.g., public R2 URL or custom hosting)
  if (process.env.PROTOMAPS_US_URL) {
    return process.env.PROTOMAPS_US_URL;
  }

  // Fallback sample (Florence, Italy — for dev only)
  return 'https://pmtiles.io/protomaps(vector)ODbL_firenze.pmtiles';
}

/**
 * Create Protomaps OSM provider
 */
export function createProtomapsProvider(pmtilesUrl: string) {
  let pmtiles: PMTiles | null = null;
  let currentUrl: string = pmtilesUrl;

  /**
   * Initialize PMTiles connection
   */
  async function init(url?: string): Promise<void> {
    // Re-initialize if URL changed (e.g., new presigned URL)
    if (url && url !== currentUrl) {
      pmtiles = null;
      currentUrl = url;
    }

    if (pmtiles) return;

    pmtiles = new PMTiles(currentUrl);

    // Warm up the connection
    await pmtiles.getHeader();

    console.log(`[Protomaps] Connected to ${currentUrl.substring(0, 80)}...`);
  }

  /**
   * Query scenic nodes in bbox
   */
  async function queryNodesInBbox(
    bbox: BoundingBox,
    types?: string[]
  ): Promise<OsmNode[]> {
    await init();
    if (!pmtiles) throw new Error('Protomaps not initialized');

    const tiles = bboxToTiles(bbox, TILE_ZOOM);
    const nodes: OsmNode[] = [];

    // Fetch all tiles in bbox
    for (let x = tiles.minX; x <= tiles.maxX; x++) {
      for (let y = tiles.minY; y <= tiles.maxY; y++) {
        const tileData = await pmtiles.getZxy(TILE_ZOOM, x, y);

        // Extract POIs (viewpoints, mountain passes)
        const pois = extractFeaturesFromTile(tileData, LAYERS.POIS, x, y, TILE_ZOOM, (f) => {
          const props = f.properties;
          return (
            props.tourism === 'viewpoint' ||
            props.mountain_pass === 'yes' ||
            (props.natural === 'peak' && props.name)
          );
        });

        for (const { feature: poi, tileX, tileY, tileZoom, extent } of pois) {
          const props = poi.properties;
          const geom = poi.loadGeometry();
          if (geom.length === 0 || geom[0].length === 0) continue;

          const pt = geom[0][0];
          const [lon, lat] = tilePixelToLonLat(pt.x, pt.y, tileX, tileY, tileZoom, extent);

          // Classify node type
          let type: 'viewpoint' | 'peak' | 'mountain_pass' = 'viewpoint';
          if (props.natural === 'peak') type = 'peak';
          else if (props.mountain_pass === 'yes') type = 'mountain_pass';

          // Filter by type if specified
          if (types && !types.includes(type)) continue;

          nodes.push({
            osmId: props.id || Math.random(),
            type,
            name: props.name,
            lat,
            lon,
            tags: props,
          });
        }

        // Extract natural features (peaks)
        const natural = extractFeaturesFromTile(tileData, LAYERS.NATURAL, x, y, TILE_ZOOM, (f) => {
          const props = f.properties;
          return props.natural === 'peak' && props.name;
        });

        for (const { feature: feat, tileX: tx, tileY: ty, tileZoom: tz, extent: ext } of natural) {
          const props = feat.properties;
          const geom = feat.loadGeometry();
          if (geom.length === 0 || geom[0].length === 0) continue;

          const pt = geom[0][0];
          const [lon, lat] = tilePixelToLonLat(pt.x, pt.y, tx, ty, tz, ext);

          // Filter by type if specified
          if (types && !types.includes('peak')) continue;

          nodes.push({
            osmId: props.id || Math.random(),
            type: 'peak',
            name: props.name,
            lat,
            lon,
            tags: props,
          });
        }
      }
    }

    return nodes;
  }

  /**
   * Query road ways in bbox
   */
  async function queryWaysInBbox(
    bbox: BoundingBox,
    highwayClasses?: string[]
  ): Promise<OsmWay[]> {
    await init();
    if (!pmtiles) throw new Error('Protomaps not initialized');

    const tiles = bboxToTiles(bbox, TILE_ZOOM);
    const waysMap = new Map<number, OsmWay>();

    // Fetch all tiles in bbox
    for (let x = tiles.minX; x <= tiles.maxX; x++) {
      for (let y = tiles.minY; y <= tiles.maxY; y++) {
        const tileData = await pmtiles.getZxy(TILE_ZOOM, x, y);

        // Extract roads
        const roads = extractFeaturesFromTile(tileData, LAYERS.ROADS, x, y, TILE_ZOOM, (f) => {
          const props = f.properties;
          if (!props.highway) return false;
          if (highwayClasses && !highwayClasses.includes(props.highway)) return false;
          return true;
        });

        for (const { feature: road, tileX, tileY, tileZoom, extent } of roads) {
          const props = road.properties;
          const geometry = road.loadGeometry();

          // loadGeometry returns Point[][] — first array is the line ring
          if (geometry.length === 0 || geometry[0].length < 2) continue;

          // Convert tile pixel coords to [[lon, lat], ...]
          const coords: number[][] = geometry[0].map((pt: any) =>
            tilePixelToLonLat(pt.x, pt.y, tileX, tileY, tileZoom, extent)
          );

          // Calculate bounds
          const lats = coords.map((c) => c[1]);
          const lons = coords.map((c) => c[0]);
          const bounds: BoundingBox = {
            south: Math.min(...lats),
            west: Math.min(...lons),
            north: Math.max(...lats),
            east: Math.max(...lons),
          };

          // Use pmtiles id as osmId
          const osmId = props.id || Math.random();

          // Merge if we already have this road
          if (waysMap.has(osmId)) {
            const existing = waysMap.get(osmId)!;
            // Expand bounds
            existing.bounds.south = Math.min(existing.bounds.south, bounds.south);
            existing.bounds.west = Math.min(existing.bounds.west, bounds.west);
            existing.bounds.north = Math.max(existing.bounds.north, bounds.north);
            existing.bounds.east = Math.max(existing.bounds.east, bounds.east);
          } else {
            waysMap.set(osmId, {
              osmId,
              name: props.name,
              highwayClass: props.highway,
              surface: props.surface,
              geometry: coords,
              bounds,
            });
          }
        }
      }
    }

    return Array.from(waysMap.values());
  }

  /**
   * Query ways by name
   */
  async function queryWaysByName(name: string, bbox: BoundingBox): Promise<OsmWay[]> {
    const ways = await queryWaysInBbox(bbox);
    return ways.filter((w) => w.name?.toLowerCase().includes(name.toLowerCase()));
  }

  return {
    init,
    queryNodesInBbox,
    queryWaysInBbox,
    queryWaysByName,
  };
}
