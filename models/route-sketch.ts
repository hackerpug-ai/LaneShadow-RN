import { Infer, v } from 'convex/values'
import { z } from 'zod'

export const MAX_ROUTE_SKETCH_SEGMENTS = 20

export const routeSketchSegmentValidator = v.object({
  roadName: v.string(),
  fromName: v.string(),
  toName: v.string(),
  viaNames: v.optional(v.array(v.string())),
})
export type RouteSketchSegment = Infer<typeof routeSketchSegmentValidator>

export const routeSketchAnchorPointValidator = v.object({
  name: v.string(),
  kind: v.union(v.literal('town'), v.literal('junction'), v.literal('landmark'), v.literal('pass')),
  lat: v.optional(v.number()),
  lng: v.optional(v.number()),
})
export type RouteSketchAnchorPoint = Infer<typeof routeSketchAnchorPointValidator>

export const routeSketchValidator = v.object({
  label: v.string(),
  rationale: v.string(),
  segments: v.array(routeSketchSegmentValidator),
  anchorPoints: v.array(routeSketchAnchorPointValidator),
})
export type RouteSketch = Infer<typeof routeSketchValidator>

export const agentRouteSketchSegmentSchema = z.object({
  roadName: z.string(),
  fromName: z.string(),
  toName: z.string(),
  viaNames: z.array(z.string()).optional(),
})

export const agentRouteSketchAnchorPointSchema = z.object({
  name: z.string(),
  kind: z.union([
    z.literal('town'),
    z.literal('junction'),
    z.literal('landmark'),
    z.literal('pass'),
  ]),
  lat: z.number().optional(),
  lng: z.number().optional(),
})

export const agentRouteSketchSchema = z.object({
  label: z.string(),
  rationale: z.string(),
  segments: z.array(agentRouteSketchSegmentSchema).max(MAX_ROUTE_SKETCH_SEGMENTS),
  anchorPoints: z.array(agentRouteSketchAnchorPointSchema),
})

export const isRouteSketchWithinLimits = (sketch: RouteSketch): boolean => {
  return sketch.segments.length <= MAX_ROUTE_SKETCH_SEGMENTS
}
