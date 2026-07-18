/**
 * Re-export of the Lever-3 deterministic endpoint parser for node-action consumers.
 * Canonical implementation lives at convex/lib/endpointParser.ts (importable from
 * default-runtime modules; Convex forbids non-"use node" files under /actions).
 */
'use node'

export {
  type AtoBParse,
  geocodeBoundsForCentroid,
  type HighwayParse,
  type ParseRouteNameResult,
  parseRouteEndpoints,
  parseRouteName,
  type RouteNameParse,
} from '../../../lib/endpointParser'
