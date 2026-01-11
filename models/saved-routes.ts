import { Infer, v } from 'convex/values'

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

export const planInputValidator = v.object({
  start: routeStopValidator,
  end: routeStopValidator,
  departureTime: v.number(),
  preferences: planPreferencesValidator,
})
export type PlanInput = Infer<typeof planInputValidator>

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

export const routeOverlaysValidator = v.object({
  wind: v.optional(windOverlayValidator),
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
})
export type SavedRoute = Infer<typeof savedRouteValidator>
