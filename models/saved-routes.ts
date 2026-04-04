import { Infer, v } from 'convex/values'
import { z } from 'zod'

export const OWNER_TYPE = {
  USER: 'user',
  GROUP: 'group',
  ORG: 'org',
} as const
export type OwnerType = (typeof OWNER_TYPE)[keyof typeof OWNER_TYPE]

export const VISIBILITY = {
  PRIVATE: 'private',
  SHARED: 'shared',
  PUBLIC: 'public',
} as const
export type Visibility = (typeof VISIBILITY)[keyof typeof VISIBILITY]

export const SCENIC_BIAS = {
  DEFAULT: 'default',
  HIGH: 'high',
} as const
export type ScenicBias = (typeof SCENIC_BIAS)[keyof typeof SCENIC_BIAS]

export const CONDITIONS_STATUS = {
  OK: 'ok',
  UNAVAILABLE: 'unavailable',
} as const
export type ConditionsStatus = (typeof CONDITIONS_STATUS)[keyof typeof CONDITIONS_STATUS]

export const conditionsStatusValidator = v.union(
  v.literal(CONDITIONS_STATUS.OK),
  v.literal(CONDITIONS_STATUS.UNAVAILABLE)
)

export const WIND_SUMMARY = {
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
  UNAVAILABLE: 'unavailable',
} as const
export type WindSummary = (typeof WIND_SUMMARY)[keyof typeof WIND_SUMMARY]

export const windSummaryValidator = v.union(
  v.literal(WIND_SUMMARY.LOW),
  v.literal(WIND_SUMMARY.MODERATE),
  v.literal(WIND_SUMMARY.HIGH),
  v.literal(WIND_SUMMARY.UNAVAILABLE)
)

export const RAIN_SUMMARY = {
  NONE: 'none',
  LIGHT: 'light',
  MODERATE: 'moderate',
  HEAVY: 'heavy',
  UNAVAILABLE: 'unavailable',
} as const
export type RainSummary = (typeof RAIN_SUMMARY)[keyof typeof RAIN_SUMMARY]

export const rainSummaryValidator = v.union(
  v.literal(RAIN_SUMMARY.NONE),
  v.literal(RAIN_SUMMARY.LIGHT),
  v.literal(RAIN_SUMMARY.MODERATE),
  v.literal(RAIN_SUMMARY.HEAVY),
  v.literal(RAIN_SUMMARY.UNAVAILABLE)
)

export const boundsValidator = v.object({
  north: v.number(),
  south: v.number(),
  east: v.number(),
  west: v.number(),
})
export type Bounds = Infer<typeof boundsValidator>

export const routeStopValidator = v.object({
  lat: v.number(),
  lng: v.number(),
  label: v.optional(v.string()),
  placeId: v.optional(v.string()),
})
export type RouteStop = Infer<typeof routeStopValidator>

export const planPreferencesValidator = v.object({
  scenicBias: v.union(v.literal(SCENIC_BIAS.DEFAULT), v.literal(SCENIC_BIAS.HIGH)),
  avoidHighways: v.optional(v.boolean()),
  avoidTolls: v.optional(v.boolean()),
})
export type PlanPreferences = Infer<typeof planPreferencesValidator>

export const agentPlanPreferencesSchema = z.object({
  scenicBias: z.union([z.literal(SCENIC_BIAS.DEFAULT), z.literal(SCENIC_BIAS.HIGH)]),
  avoidHighways: z.boolean().optional(),
  avoidTolls: z.boolean().optional(),
})

export const planInputValidator = v.object({
  start: routeStopValidator,
  end: routeStopValidator,
  departureTime: v.number(),
  preferences: planPreferencesValidator,
  nlpText: v.optional(v.string()),
})
export type PlanInput = Infer<typeof planInputValidator>

export const agentRouteStopSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  label: z.string().optional(),
  placeId: z.string().optional(),
})

export const agentPlanInputSchema = z.object({
  start: agentRouteStopSchema,
  end: agentRouteStopSchema,
  departureTime: z.number(),
  preferences: agentPlanPreferencesSchema,
})

export const polylineGeometryValidator = v.object({
  format: v.literal('polyline'),
  encoding: v.string(),
  precision: v.number(),
  value: v.string(),
})
export type PolylineGeometry = Infer<typeof polylineGeometryValidator>

export const routeLegValidator = v.object({
  legIndex: v.number(),
  start: routeStopValidator,
  end: routeStopValidator,
  distanceMeters: v.number(),
  durationSeconds: v.number(),
  geometry: polylineGeometryValidator,
})
export type RouteLeg = Infer<typeof routeLegValidator>

export const ANNOTATION_KIND = {
  PLACE: 'place',
  CONDITION: 'condition',
} as const
export type AnnotationKind = (typeof ANNOTATION_KIND)[keyof typeof ANNOTATION_KIND]

export const routeAnnotationValidator = v.object({
  id: v.string(),
  annotationKind: v.union(v.literal(ANNOTATION_KIND.PLACE), v.literal(ANNOTATION_KIND.CONDITION)),
  label: v.string(),
  lat: v.number(),
  lng: v.number(),
  placeRef: v.optional(v.string()),
  conditionRef: v.optional(v.string()),
})
export type RouteAnnotation = Infer<typeof routeAnnotationValidator>

export const windLegendItemValidator = v.object({
  level: v.string(),
  label: v.string(),
  range: v.optional(
    v.object({
      min: v.optional(v.number()),
      max: v.optional(v.number()),
      unit: v.optional(v.string()),
    })
  ),
})
export type WindLegendItem = Infer<typeof windLegendItemValidator>

export const windOverlaySegmentValidator = v.object({
  startMeters: v.number(),
  endMeters: v.number(),
  level: v.string(),
  reason: v.optional(v.string()),
})
export type WindOverlaySegment = Infer<typeof windOverlaySegmentValidator>

export const windOverlayByLegValidator = v.object({
  legIndex: v.number(),
  segments: v.array(windOverlaySegmentValidator),
})
export type WindOverlayByLeg = Infer<typeof windOverlayByLegValidator>

export const windOverlayValidator = v.object({
  generatedAt: v.number(),
  modelVersion: v.string(),
  legend: v.array(windLegendItemValidator),
  byLeg: v.array(windOverlayByLegValidator),
})
export type WindOverlay = Infer<typeof windOverlayValidator>

export const rainLegendItemValidator = v.object({
  level: v.string(),
  label: v.string(),
  range: v.optional(
    v.object({
      min: v.optional(v.number()),
      max: v.optional(v.number()),
      unit: v.optional(v.string()),
    })
  ),
})
export type RainLegendItem = Infer<typeof rainLegendItemValidator>

export const rainOverlaySegmentValidator = v.object({
  startMeters: v.number(),
  endMeters: v.number(),
  level: v.string(),
  probability: v.optional(v.number()),
})
export type RainOverlaySegment = Infer<typeof rainOverlaySegmentValidator>

export const rainOverlayByLegValidator = v.object({
  legIndex: v.number(),
  segments: v.array(rainOverlaySegmentValidator),
})
export type RainOverlayByLeg = Infer<typeof rainOverlayByLegValidator>

export const rainOverlayValidator = v.object({
  generatedAt: v.number(),
  modelVersion: v.string(),
  legend: v.array(rainLegendItemValidator),
  byLeg: v.array(rainOverlayByLegValidator),
})
export type RainOverlay = Infer<typeof rainOverlayValidator>

export const TEMPERATURE_SUMMARY = {
  COLD: 'cold',
  MILD: 'mild',
  WARM: 'warm',
  HOT: 'hot',
  UNAVAILABLE: 'unavailable',
} as const
export type TemperatureSummary = (typeof TEMPERATURE_SUMMARY)[keyof typeof TEMPERATURE_SUMMARY]

export const temperatureSummaryValidator = v.union(
  v.literal(TEMPERATURE_SUMMARY.COLD),
  v.literal(TEMPERATURE_SUMMARY.MILD),
  v.literal(TEMPERATURE_SUMMARY.WARM),
  v.literal(TEMPERATURE_SUMMARY.HOT),
  v.literal(TEMPERATURE_SUMMARY.UNAVAILABLE)
)

export const temperatureLegendItemValidator = v.object({
  level: v.string(),
  label: v.string(),
  range: v.optional(
    v.object({
      min: v.optional(v.number()),
      max: v.optional(v.number()),
      unit: v.optional(v.string()),
    })
  ),
})
export type TemperatureLegendItem = Infer<typeof temperatureLegendItemValidator>

export const temperatureOverlaySegmentValidator = v.object({
  startMeters: v.number(),
  endMeters: v.number(),
  level: v.string(),
  temperatureCelsius: v.optional(v.number()),
})
export type TemperatureOverlaySegment = Infer<typeof temperatureOverlaySegmentValidator>

export const temperatureOverlayByLegValidator = v.object({
  legIndex: v.number(),
  segments: v.array(temperatureOverlaySegmentValidator),
})
export type TemperatureOverlayByLeg = Infer<typeof temperatureOverlayByLegValidator>

export const temperatureOverlayValidator = v.object({
  generatedAt: v.number(),
  modelVersion: v.string(),
  legend: v.array(temperatureLegendItemValidator),
  byLeg: v.array(temperatureOverlayByLegValidator),
})
export type TemperatureOverlay = Infer<typeof temperatureOverlayValidator>

export const routeOverlaysValidator = v.object({
  wind: v.optional(windOverlayValidator),
  rain: v.optional(rainOverlayValidator),
  temperature: v.optional(temperatureOverlayValidator),
})
export type RouteOverlays = Infer<typeof routeOverlaysValidator>

// POC geometry policy (TRD §3.3): store overview polyline + leg polylines only.
// Step-level instructions/polylines are intentionally excluded to keep storage lean.
export const routeSnapshotValidator = v.object({
  provider: v.string(),
  bounds: boundsValidator,
  origin: routeStopValidator,
  destination: routeStopValidator,
  waypoints: v.array(routeStopValidator),
  overviewGeometry: polylineGeometryValidator,
  legs: v.array(routeLegValidator),
  annotations: v.array(routeAnnotationValidator),
  overlays: routeOverlaysValidator,
})
export type RouteSnapshot = Infer<typeof routeSnapshotValidator>

export const routeIndexPointValidator = v.object({
  lat: v.number(),
  lng: v.number(),
  distanceFromStartMeters: v.number(),
})
export type RouteIndexPoint = Infer<typeof routeIndexPointValidator>

export const routeIndexValidator = v.object({
  routeFingerprint: v.string(),
  sampledPoints: v.array(routeIndexPointValidator),
})
export type RouteIndex = Infer<typeof routeIndexValidator>

export const routePreviewValidator = v.object({
  bounds: boundsValidator,
  distanceMeters: v.number(),
  durationSeconds: v.number(),
})
export type RoutePreview = Infer<typeof routePreviewValidator>

export const snapshotMetaValidator = v.object({
  savedAt: v.number(),
  routingProvider: v.string(),
  overlays: v.object({
    wind: v.optional(
      v.object({
        generatedAt: v.number(),
        modelVersion: v.string(),
      })
    ),
  }),
  conditionsStatus: conditionsStatusValidator,
  metaVersion: v.number(),
})
export type SnapshotMeta = Infer<typeof snapshotMetaValidator>

export const savedRouteCapabilitiesValidator = v.object({
  canRead: v.boolean(),
  canRename: v.boolean(),
  canDelete: v.boolean(),
})
export type SavedRouteCapabilities = Infer<typeof savedRouteCapabilitiesValidator>

export const savedRouteValidator = v.object({
  ownerType: v.union(
    v.literal(OWNER_TYPE.USER),
    v.literal(OWNER_TYPE.GROUP),
    v.literal(OWNER_TYPE.ORG)
  ),
  ownerId: v.string(),
  createdByUserId: v.string(),
  visibility: v.union(
    v.literal(VISIBILITY.PRIVATE),
    v.literal(VISIBILITY.SHARED),
    v.literal(VISIBILITY.PUBLIC)
  ),
  name: v.string(),
  planInput: planInputValidator,
  routeSnapshot: routeSnapshotValidator,
  routeIndex: routeIndexValidator,
  snapshotMeta: snapshotMetaValidator,
  createdAt: v.number(),
  updatedAt: v.number(),
  deletedAt: v.optional(v.number()),
  scheduledDeletionId: v.optional(v.id('_scheduled_functions')),
})
export type SavedRoute = Infer<typeof savedRouteValidator>

// -----------------------------------------------------------------------------
// Rain Summary Derivation Utility
// -----------------------------------------------------------------------------

/**
 * Derives the worst rain level from a RainOverlay.
 * Returns 'unavailable' if overlay is missing, empty, or malformed.
 * Returns the worst condition present: heavy > moderate > light > none.
 *
 * @param overlay - Optional RainOverlay to analyze
 * @returns RainSummary representing the worst rain condition
 *
 * @example
 * const overlay: RainOverlay = {
 *   byLeg: [
 *     { legIndex: 0, segments: [{ level: 'light', ... }] },
 *     { legIndex: 1, segments: [{ level: 'heavy', ... }] }
 *   ]
 * }
 * getWorstRainLevel(overlay) // Returns 'heavy'
 */
export const getWorstRainLevel = (overlay?: RainOverlay): RainSummary => {
  // Handle missing or malformed overlay
  if (!overlay?.byLeg?.length) return RAIN_SUMMARY.UNAVAILABLE

  // Collect all rain levels from all segments across all legs
  const levels: string[] = []
  for (const leg of overlay.byLeg) {
    for (const segment of leg.segments) {
      levels.push(segment.level)
    }
  }

  // No segments found
  if (levels.length === 0) return RAIN_SUMMARY.UNAVAILABLE

  // Return worst condition (heavy > moderate > light > none)
  if (levels.includes(RAIN_SUMMARY.HEAVY)) return RAIN_SUMMARY.HEAVY
  if (levels.includes(RAIN_SUMMARY.MODERATE)) return RAIN_SUMMARY.MODERATE
  if (levels.includes(RAIN_SUMMARY.LIGHT)) return RAIN_SUMMARY.LIGHT
  if (levels.includes(RAIN_SUMMARY.NONE)) return RAIN_SUMMARY.NONE

  // Unknown levels - treat as unavailable
  return RAIN_SUMMARY.UNAVAILABLE
}

// -----------------------------------------------------------------------------
// Temperature Summary Derivation Utility
// -----------------------------------------------------------------------------

/**
 * Derives the worst temperature level from a TemperatureOverlay.
 * Returns 'unavailable' if overlay is missing, empty, or malformed.
 * Returns the most extreme temperature present: hot > warm > mild > cold.
 *
 * Temperature thresholds (in Celsius):
 * - cold: < 5°C (< 40°F)
 * - mild: 5-20°C (40-68°F)
 * - warm: 20-30°C (68-86°F)
 * - hot: >= 30°C (>= 86°F)
 *
 * @param overlay - Optional TemperatureOverlay to analyze
 * @returns TemperatureSummary representing the most extreme temperature
 *
 * @example
 * const overlay: TemperatureOverlay = {
 *   byLeg: [
 *     { legIndex: 0, segments: [{ temperatureCelsius: 15, ... }] },
 *     { legIndex: 1, segments: [{ temperatureCelsius: 32, ... }] }
 *   ]
 * }
 * getWorstTemperatureLevel(overlay) // Returns 'hot'
 */
export const getWorstTemperatureLevel = (
  overlay?: TemperatureOverlay
): TemperatureSummary => {
  // Handle missing or malformed overlay
  if (!overlay?.byLeg?.length) return TEMPERATURE_SUMMARY.UNAVAILABLE

  // Track the most extreme temperature found
  let maxTempCelsius: number | null = null

  // Collect all temperatures from all segments across all legs
  for (const leg of overlay.byLeg) {
    for (const segment of leg.segments) {
      if (segment.temperatureCelsius !== undefined) {
        if (
          maxTempCelsius === null ||
          segment.temperatureCelsius > maxTempCelsius
        ) {
          maxTempCelsius = segment.temperatureCelsius
        }
      }
    }
  }

  // No temperature data found
  if (maxTempCelsius === null) return TEMPERATURE_SUMMARY.UNAVAILABLE

  // Derive temperature level from maximum temperature
  if (maxTempCelsius < 5) return TEMPERATURE_SUMMARY.COLD
  if (maxTempCelsius < 20) return TEMPERATURE_SUMMARY.MILD
  if (maxTempCelsius < 30) return TEMPERATURE_SUMMARY.WARM
  return TEMPERATURE_SUMMARY.HOT
}

/**
 * Derives the maximum temperature in Fahrenheit from a TemperatureOverlay.
 * Returns undefined if overlay is missing or has no temperature data.
 *
 * @param overlay - Optional TemperatureOverlay to analyze
 * @returns Maximum temperature in Fahrenheit, or undefined if unavailable
 *
 * @example
 * const overlay: TemperatureOverlay = {
 *   byLeg: [
 *     { legIndex: 0, segments: [{ temperatureCelsius: 30, ... }] }
 *   ]
 * }
 * getMaxTemperatureFahrenheit(overlay) // Returns 86
 */
export const getMaxTemperatureFahrenheit = (
  overlay?: TemperatureOverlay
): number | undefined => {
  if (!overlay?.byLeg?.length) return undefined

  let maxTempCelsius: number | null = null

  for (const leg of overlay.byLeg) {
    for (const segment of leg.segments) {
      if (
        segment.temperatureCelsius !== undefined &&
        (maxTempCelsius === null || segment.temperatureCelsius > maxTempCelsius)
      ) {
        maxTempCelsius = segment.temperatureCelsius
      }
    }
  }

  if (maxTempCelsius === null) return undefined

  // Convert Celsius to Fahrenheit: (C × 9/5) + 32
  return Math.round((maxTempCelsius * 9) / 5 + 32)
}
