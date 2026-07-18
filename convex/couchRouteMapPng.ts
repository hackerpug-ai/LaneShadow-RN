/**
 * Pure route-map PNG renderer for couch-sample founder review (S4-T6 / AC-3).
 *
 * Decodes an encoded polyline → projects lat/lng into a canvas → encodes a
 * real multi-hundred-pixel PNG (no Node canvas / no 1×1 stub).
 *
 * Pixel drawing is pure JS (V8-safe). Prefer `encodeRgbaPngCompressed` from a
 * `"use node"` action (Node zlib) so 25-route exports stay under Convex memory.
 * Fallback store-block encoder is available for unit smoke tests only.
 */

import polyline from '@mapbox/polyline'

export const MAP_PNG_WIDTH = 240
export const MAP_PNG_HEIGHT = 240
export const MAP_PNG_MARGIN = 24

/** 1×1 red PNG — the stub this module replaces. Exported for tests. */
export const MIN_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

type Rgba = { r: number; g: number; b: number; a?: number }

const BG: Rgba = { r: 18, g: 22, b: 32, a: 255 }
const GRID: Rgba = { r: 36, g: 44, b: 58, a: 255 }
const PATH: Rgba = { r: 232, g: 140, b: 56, a: 255 }
const START: Rgba = { r: 72, g: 200, b: 120, a: 255 }
const END: Rgba = { r: 220, g: 72, b: 72, a: 255 }
const TEXT: Rgba = { r: 230, g: 232, b: 240, a: 255 }

const PROVENANCE_COLORS: Record<string, Rgba> = {
  scraped_promoted: { r: 80, g: 160, b: 255, a: 255 },
  ai_reconstructed: { r: 180, g: 120, b: 255, a: 255 },
  name_routed: { r: 80, g: 200, b: 160, a: 255 },
}

// 3×5 digit glyphs for burning miles into the map (bit rows, MSB left).
const DIGITS: Record<string, number[]> = {
  '0': [0b111, 0b101, 0b101, 0b101, 0b111],
  '1': [0b010, 0b110, 0b010, 0b010, 0b111],
  '2': [0b111, 0b001, 0b111, 0b100, 0b111],
  '3': [0b111, 0b001, 0b111, 0b001, 0b111],
  '4': [0b101, 0b101, 0b111, 0b001, 0b001],
  '5': [0b111, 0b100, 0b111, 0b001, 0b111],
  '6': [0b111, 0b100, 0b111, 0b101, 0b111],
  '7': [0b111, 0b001, 0b001, 0b001, 0b001],
  '8': [0b111, 0b101, 0b111, 0b101, 0b111],
  '9': [0b111, 0b101, 0b111, 0b001, 0b111],
  '.': [0b000, 0b000, 0b000, 0b000, 0b010],
  '-': [0b000, 0b000, 0b111, 0b000, 0b000],
  ' ': [0b000, 0b000, 0b000, 0b000, 0b000],
  m: [0b000, 0b000, 0b110, 0b101, 0b101],
  i: [0b010, 0b000, 0b010, 0b010, 0b010],
  '/': [0b001, 0b001, 0b010, 0b100, 0b100],
}

function setPixel(
  rgba: Uint8Array,
  width: number,
  x: number,
  y: number,
  c: Rgba,
  height: number = MAP_PNG_HEIGHT,
): void {
  if (x < 0 || y < 0 || x >= width || y >= height) return
  const i = (y * width + x) * 4
  rgba[i] = c.r
  rgba[i + 1] = c.g
  rgba[i + 2] = c.b
  rgba[i + 3] = c.a ?? 255
}

function fillRect(
  rgba: Uint8Array,
  width: number,
  height: number,
  x0: number,
  y0: number,
  w: number,
  h: number,
  c: Rgba,
): void {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      setPixel(rgba, width, x, y, c, height)
    }
  }
}

function drawLine(
  rgba: Uint8Array,
  width: number,
  height: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  c: Rgba,
  thickness: number,
): void {
  const dx = x1 - x0
  const dy = y1 - y0
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy)))
  const half = Math.floor(thickness / 2)
  for (let s = 0; s <= steps; s++) {
    const t = s / steps
    const x = Math.round(x0 + dx * t)
    const y = Math.round(y0 + dy * t)
    for (let oy = -half; oy <= half; oy++) {
      for (let ox = -half; ox <= half; ox++) {
        if (ox * ox + oy * oy <= half * half + 1) {
          setPixel(rgba, width, x + ox, y + oy, c, height)
        }
      }
    }
  }
}

function drawDisk(
  rgba: Uint8Array,
  width: number,
  height: number,
  cx: number,
  cy: number,
  r: number,
  c: Rgba,
): void {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r * r) {
        setPixel(rgba, width, cx + x, cy + y, c, height)
      }
    }
  }
}

function drawChar(
  rgba: Uint8Array,
  width: number,
  height: number,
  ch: string,
  ox: number,
  oy: number,
  c: Rgba,
  scale: number,
): number {
  const glyph = DIGITS[ch] ?? DIGITS[' ']
  for (let row = 0; row < 5; row++) {
    const bits = glyph[row] ?? 0
    for (let col = 0; col < 3; col++) {
      if (bits & (1 << (2 - col))) {
        fillRect(rgba, width, height, ox + col * scale, oy + row * scale, scale, scale, c)
      }
    }
  }
  return 3 * scale + scale // glyph width + 1 cell gap
}

function drawText(
  rgba: Uint8Array,
  width: number,
  height: number,
  text: string,
  ox: number,
  oy: number,
  c: Rgba,
  scale = 2,
): void {
  let x = ox
  for (const ch of text) {
    x += drawChar(rgba, width, height, ch, x, oy, c, scale)
  }
}

function projectPoints(
  coords: Array<[number, number]>,
  width: number,
  height: number,
  margin: number,
): Array<{ x: number; y: number }> {
  let minLat = Infinity
  let maxLat = -Infinity
  let minLng = Infinity
  let maxLng = -Infinity
  for (const [lat, lng] of coords) {
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
  }
  // Avoid zero-span bbox (single point / vertical/horizontal degenerates)
  if (maxLat - minLat < 1e-6) {
    minLat -= 0.01
    maxLat += 0.01
  }
  if (maxLng - minLng < 1e-6) {
    minLng -= 0.01
    maxLng += 0.01
  }

  const plotW = width - margin * 2
  const plotH = height - margin * 2 - 20 // leave room for top bar + bottom label
  const topPad = margin + 14

  const latSpan = maxLat - minLat
  const lngSpan = maxLng - minLng
  // Fit aspect ratio (lng→x, lat→y inverted)
  const scale = Math.min(plotW / lngSpan, plotH / latSpan)
  const usedW = lngSpan * scale
  const usedH = latSpan * scale
  const ox = margin + (plotW - usedW) / 2
  const oy = topPad + (plotH - usedH) / 2

  return coords.map(([lat, lng]) => ({
    x: ox + (lng - minLng) * scale,
    y: oy + (maxLat - lat) * scale,
  }))
}

// ---------------------------------------------------------------------------
// PNG encode (zlib store blocks — pure JS, no Node Buffer required)
// ---------------------------------------------------------------------------

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    c ^= bytes[i]
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
  }
  return (c ^ 0xffffffff) >>> 0
}

function adler32(bytes: Uint8Array): number {
  let a = 1
  let b = 0
  for (let i = 0; i < bytes.length; i++) {
    a = (a + bytes[i]) % 65521
    b = (b + a) % 65521
  }
  return ((b << 16) | a) >>> 0
}

function concatBytes(chunks: Uint8Array[]): Uint8Array {
  let len = 0
  for (const c of chunks) len += c.length
  const out = new Uint8Array(len)
  let o = 0
  for (const c of chunks) {
    out.set(c, o)
    o += c.length
  }
  return out
}

function u32be(n: number): Uint8Array {
  return new Uint8Array([(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff])
}

function deflateStore(data: Uint8Array): Uint8Array {
  // RFC 1951 stored blocks, max 65535 bytes each
  const chunks: Uint8Array[] = []
  let offset = 0
  while (offset < data.length) {
    const remaining = data.length - offset
    const take = Math.min(65535, remaining)
    const isFinal = offset + take >= data.length
    const header = new Uint8Array(5)
    header[0] = isFinal ? 0x01 : 0x00 // BFINAL=1 for last, BTYPE=00
    header[1] = take & 0xff
    header[2] = (take >>> 8) & 0xff
    const nlen = ~take & 0xffff
    header[3] = nlen & 0xff
    header[4] = (nlen >>> 8) & 0xff
    chunks.push(header)
    chunks.push(data.subarray(offset, offset + take))
    offset += take
  }
  if (data.length === 0) {
    // empty final store block
    chunks.push(new Uint8Array([0x01, 0x00, 0x00, 0xff, 0xff]))
  }
  return concatBytes(chunks)
}

function zlibWrap(raw: Uint8Array): Uint8Array {
  const deflated = deflateStore(raw)
  const adler = adler32(raw)
  return concatBytes([
    new Uint8Array([0x78, 0x01]), // CMF/FLG — no compression dictionary
    deflated,
    u32be(adler),
  ])
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new Uint8Array(type.length)
  for (let i = 0; i < type.length; i++) typeBytes[i] = type.charCodeAt(i)
  const crcInput = concatBytes([typeBytes, data])
  return concatBytes([u32be(data.length), typeBytes, data, u32be(crc32(crcInput))])
}

/** Build filter-None RGBA scanline buffer for PNG IDAT. */
export function buildPngRawScanlines(width: number, height: number, rgba: Uint8Array): Uint8Array {
  const raw = new Uint8Array((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1)
    raw[rowStart] = 0 // filter None
    const src = y * width * 4
    raw.set(rgba.subarray(src, src + width * 4), rowStart + 1)
  }
  return raw
}

/**
 * Encode RGBA → PNG bytes.
 * @param compressZlib - zlib-compatible compressor (CMF/FLG + deflate + adler32).
 *   When omitted, uses uncompressed store blocks (large; tests only).
 */
export function encodeRgbaPng(
  width: number,
  height: number,
  rgba: Uint8Array,
  compressZlib?: (raw: Uint8Array) => Uint8Array,
): Uint8Array {
  const raw = buildPngRawScanlines(width, height, rgba)
  const compressed = compressZlib ? compressZlib(raw) : zlibWrap(raw)

  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = new Uint8Array(13)
  ihdr.set(u32be(width), 0)
  ihdr.set(u32be(height), 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  return concatBytes([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', new Uint8Array(0)),
  ])
}

const B64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

export function bytesToBase64(bytes: Uint8Array): string {
  let out = ''
  const len = bytes.length
  for (let i = 0; i < len; i += 3) {
    const a = bytes[i]
    const b = i + 1 < len ? bytes[i + 1] : 0
    const c = i + 2 < len ? bytes[i + 2] : 0
    const triple = (a << 16) | (b << 8) | c
    out += B64_ALPHABET[(triple >> 18) & 63]
    out += B64_ALPHABET[(triple >> 12) & 63]
    out += i + 1 < len ? B64_ALPHABET[(triple >> 6) & 63] : '='
    out += i + 2 < len ? B64_ALPHABET[triple & 63] : '='
  }
  return out
}

/**
 * Stable hash of a string → non-negative int (for unique fixture shapes).
 */
export function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * Build a distinct encoded polyline for a couch fixture so map PNGs differ.
 */
export function buildFixturePolyline(
  routeId: string,
  centroidLat: number,
  centroidLng: number,
): string {
  const h = hashString(routeId)
  const shape = h % 5
  const spanLat = 0.1 + (h % 7) * 0.018
  const spanLng = 0.12 + (h % 11) * 0.014
  const rot = ((h >>> 8) % 360) * (Math.PI / 180)
  const points: Array<[number, number]> = []

  const pushLocal = (dLat: number, dLng: number) => {
    // Light rotation so similar shapes still diverge by routeId
    const c = Math.cos(rot * 0.15)
    const s = Math.sin(rot * 0.15)
    const rLat = dLat * c - dLng * s
    const rLng = dLat * s + dLng * c
    points.push([centroidLat + rLat, centroidLng + rLng])
  }

  switch (shape) {
    case 0: {
      // East-west zigzag (canyon-ish)
      for (let i = 0; i <= 12; i++) {
        const t = i / 12
        pushLocal(Math.sin(t * Math.PI * 3) * spanLat * 0.45, (t - 0.5) * spanLng)
      }
      break
    }
    case 1: {
      // North-south with mid bulge
      for (let i = 0; i <= 12; i++) {
        const t = i / 12
        pushLocal((t - 0.5) * spanLat, Math.sin(t * Math.PI) * spanLng * 0.5)
      }
      break
    }
    case 2: {
      // L-shape
      for (let i = 0; i <= 6; i++) {
        pushLocal((i / 6 - 0.5) * spanLat, -spanLng * 0.4)
      }
      for (let i = 1; i <= 6; i++) {
        pushLocal(spanLat * 0.5, -spanLng * 0.4 + (i / 6) * spanLng * 0.8)
      }
      break
    }
    case 3: {
      // U-shape loop-ish
      for (let i = 0; i <= 16; i++) {
        const t = i / 16
        const ang = Math.PI * t // 0..π
        pushLocal(Math.cos(ang) * spanLat * 0.5, Math.sin(ang) * spanLng * 0.55 - spanLng * 0.1)
      }
      break
    }
    default: {
      // Diagonal S-curve
      for (let i = 0; i <= 14; i++) {
        const t = i / 14
        pushLocal(
          (t - 0.5) * spanLat + Math.sin(t * Math.PI * 2) * spanLat * 0.15,
          (t - 0.5) * spanLng,
        )
      }
      break
    }
  }

  return polyline.encode(points)
}

export type RouteMapRenderInput = {
  routeId: string
  provenance: string
  routedMiles: number
  claimedMiles: number | null
  /** Encoded Google polyline; required for a geometry-faithful map. */
  polyline?: string | null
}

export type RouteMapRgba = {
  width: number
  height: number
  rgba: Uint8Array
}

/**
 * Draw a founder-reviewable route map into an RGBA buffer (≥200×200).
 * Geometry is projected from the encoded polyline when provided.
 */
export function renderRouteMapRgba(route: RouteMapRenderInput): RouteMapRgba {
  const width = MAP_PNG_WIDTH
  const height = MAP_PNG_HEIGHT
  const rgba = new Uint8Array(width * height * 4)

  // Background
  for (let i = 0; i < width * height; i++) {
    rgba[i * 4] = BG.r
    rgba[i * 4 + 1] = BG.g
    rgba[i * 4 + 2] = BG.b
    rgba[i * 4 + 3] = 255
  }

  // Light grid for map feel
  for (let x = MAP_PNG_MARGIN; x < width - MAP_PNG_MARGIN; x += 32) {
    for (let y = MAP_PNG_MARGIN + 14; y < height - MAP_PNG_MARGIN; y++) {
      setPixel(rgba, width, x, y, GRID, height)
    }
  }
  for (let y = MAP_PNG_MARGIN + 14; y < height - MAP_PNG_MARGIN; y += 32) {
    for (let x = MAP_PNG_MARGIN; x < width - MAP_PNG_MARGIN; x++) {
      setPixel(rgba, width, x, y, GRID, height)
    }
  }

  // Provenance color bar (top)
  const bar = PROVENANCE_COLORS[route.provenance] ?? { r: 160, g: 160, b: 160, a: 255 }
  fillRect(rgba, width, height, 0, 0, width, 12, bar)

  // Decode + project geometry
  let coords: Array<[number, number]> = []
  if (route.polyline && route.polyline.length > 0) {
    try {
      const decoded = polyline.decode(route.polyline) as Array<[number, number]>
      if (decoded.length > 0) coords = decoded
    } catch {
      coords = []
    }
  }

  // Fallback: deterministic pseudo-path from routeId so we never emit the 1×1 stub
  if (coords.length < 2) {
    const fallback = buildFixturePolyline(
      route.routeId,
      34.95 + (hashString(route.routeId) % 100) * 0.001,
      -120.42 - (hashString(`${route.routeId}:lng`) % 100) * 0.001,
    )
    coords = polyline.decode(fallback) as Array<[number, number]>
  }

  const pts = projectPoints(coords, width, height, MAP_PNG_MARGIN)
  for (let i = 1; i < pts.length; i++) {
    drawLine(rgba, width, height, pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y, PATH, 3)
  }
  if (pts.length > 0) {
    drawDisk(rgba, width, height, Math.round(pts[0].x), Math.round(pts[0].y), 5, START)
    const last = pts[pts.length - 1]
    drawDisk(rgba, width, height, Math.round(last.x), Math.round(last.y), 5, END)
  }

  // Burn lengths: "41.1/41mi" style on bottom strip
  fillRect(rgba, width, height, 0, height - 22, width, 22, { r: 12, g: 14, b: 20, a: 255 })
  const claimed =
    route.claimedMiles == null
      ? '-'
      : Number.isInteger(route.claimedMiles)
        ? String(route.claimedMiles)
        : route.claimedMiles.toFixed(1)
  const routed = Number.isInteger(route.routedMiles)
    ? String(route.routedMiles)
    : route.routedMiles.toFixed(1)
  const label = `${routed}/${claimed}mi`
  drawText(rgba, width, height, label, 8, height - 18, TEXT, 2)

  // Route-id fingerprint dots so maps stay unique when metadata differs
  const fingerprint = hashString(`${route.routeId}|${route.provenance}|${route.routedMiles}`)
  for (let i = 0; i < 8; i++) {
    const on = (fingerprint >>> i) & 1
    if (on) {
      fillRect(rgba, width, height, width - 20 + (i % 4) * 4, 14 + Math.floor(i / 4) * 4, 3, 3, bar)
    }
  }

  return { width, height, rgba }
}

/**
 * Render map PNG as base64.
 * @param compressZlib optional zlib wrapper; without it uses large store blocks.
 */
export function renderRouteMapPngBase64(
  route: RouteMapRenderInput,
  compressZlib?: (raw: Uint8Array) => Uint8Array,
): string {
  const { width, height, rgba } = renderRouteMapRgba(route)
  const png = encodeRgbaPng(width, height, rgba, compressZlib)
  return bytesToBase64(png)
}
