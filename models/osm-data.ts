/**
 * OSM Data Models and Constants
 *
 * Defines types, validators, and constants for OpenStreetMap data stored in Convex.
 * Supports scenic waypoints (viewpoints, peaks, passes) and road ways.
 */

import { v } from 'convex/values'

/**
 * OSM node types for scenic waypoints
 */
export const OSM_NODE_TYPES = {
  VIEWPOINT: 'viewpoint',
  PEAK: 'peak',
  MOUNTAIN_PASS: 'mountain_pass',
} as const

export type OsmNodeType = (typeof OSM_NODE_TYPES)[keyof typeof OSM_NODE_TYPES]

/**
 * OSM node (scenic waypoint: viewpoint, peak, mountain pass)
 */
export type OsmNode = {
  osmId: number
  type: OsmNodeType
  name?: string
  lat: number
  lon: number
  tags: Record<string, any>
  s2Token: string
  importedAt: number
}

/**
 * OSM way (road segment with simplified geometry)
 */
export type OsmWay = {
  osmId: number
  name?: string
  highwayClass?: string
  surface?: string
  geometry: number[][] // [[lon, lat], ...]
  bounds: {
    south: number
    west: number
    north: number
    east: number
  }
  s2Tokens: string[]
  importedAt: number
}

/**
 * Highway classes for priority sorting
 * Higher numbers = higher priority (motorway > trunk > primary > ...)
 */
export const HIGHWAY_PRIORITY = {
  motorway: 6,
  trunk: 5,
  primary: 4,
  secondary: 3,
  tertiary: 2,
  unclassified: 1,
  residential: 0,
  service: 0,
} as const

export type HighwayClass = keyof typeof HIGHWAY_PRIORITY

/**
 * OSM node fields (scenic waypoints: viewpoints, peaks, mountain passes)
 */
export const OSM_NODE_FIELDS = {
  osmId: v.number(),
  type: v.union(v.literal('viewpoint'), v.literal('peak'), v.literal('mountain_pass')),
  name: v.optional(v.string()),
  lat: v.number(),
  lon: v.number(),
  tags: v.record(v.string(), v.any()), // All OSM tags for extensibility (arbitrary key-value pairs)
  s2Token: v.string(), // S2 geometry token for spatial indexing (level 10 ≈ 10km cells)
  importedAt: v.number(),
} as const

/**
 * OSM way fields (roads with simplified geometry)
 */
export const OSM_WAY_FIELDS = {
  osmId: v.number(),
  name: v.optional(v.string()),
  highwayClass: v.optional(v.string()),
  surface: v.optional(v.string()), // "paved" | "unpaved" | "gravel" | etc.
  geometry: v.array(v.array(v.number())), // Simplified: [[lon, lat], ...] (first, midpoint, last)
  bounds: v.object({
    south: v.number(),
    west: v.number(),
    north: v.number(),
    east: v.number(),
  }),
  s2Tokens: v.array(v.string()), // Multiple tokens for ways spanning S2 cells
  importedAt: v.number(),
} as const

/**
 * OSM import job fields
 */
export const OSM_IMPORT_JOB_FIELDS = {
  status: v.union(
    v.literal('pending'),
    v.literal('running'),
    v.literal('completed'),
    v.literal('failed'),
  ),
  region: v.string(), // e.g., "washington", "oregon", "pacific-northwest"
  sourceUrl: v.string(), // Geofabrik download URL
  startedAt: v.number(),
  completedAt: v.optional(v.number()),
  nodesImported: v.number(),
  waysImported: v.number(),
  error: v.optional(v.string()),
} as const

export const osmNodeValidator = v.object(OSM_NODE_FIELDS)
export const osmWayValidator = v.object(OSM_WAY_FIELDS)
export const osmImportJobValidator = v.object(OSM_IMPORT_JOB_FIELDS)

/**
 * Helper to get highway priority for sorting
 */
export function getHighwayPriority(highwayClass?: string): number {
  if (!highwayClass) return 0
  return HIGHWAY_PRIORITY[highwayClass as HighwayClass] ?? 0
}

/**
 * Helper to check if way is a scenic road (suitable for motorcycle routing)
 */
export function isScenicHighway(highwayClass?: string): boolean {
  if (!highwayClass) return false
  const scenicClasses = ['motorway', 'trunk', 'primary', 'secondary', 'tertiary']
  return scenicClasses.includes(highwayClass)
}
