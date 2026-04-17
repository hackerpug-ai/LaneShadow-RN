import type {
  PlanInput,
  PlanPreferences,
  RainSummary,
  RouteIndex,
  RoutePreview,
  RouteProvenance,
  RouteSnapshot,
  SavedRouteCapabilities,
  SnapshotMeta,
  TemperatureSummary,
  WindSummary,
} from '../models/saved-routes'

export type {
  Bounds,
  ConditionsStatus,
  PlanInput,
  PlanPreferences,
  RouteAnnotation,
  RouteIndex,
  RouteLeg,
  RouteOverlays,
  RoutePreview,
  RouteProvenance,
  RouteSnapshot,
  RouteStep,
  RouteStop,
  SavedRouteCapabilities,
  SnapshotMeta,
  TemperatureSummary,
} from '../models/saved-routes'

export type PlanInitView = {
  defaults: {
    preferences: PlanPreferences
  }
  constraints: {
    maxOptions: number
  }
}

export type SavedRouteListItemView = {
  savedRouteId: string
  name: string
  startLabel: string
  endLabel: string
  createdAt: number
  updatedAt: number
  preview: RoutePreview
  capabilities: SavedRouteCapabilities
  routeIndex: RouteIndex
}

export type SavedRoutesListView = {
  routes: SavedRouteListItemView[]
}

export type SavedRouteDetailView = {
  savedRouteId: string
  name: string
  planInput: PlanInput
  routeSnapshot: RouteSnapshot
  routeIndex: RouteIndex
  snapshotMeta: SnapshotMeta
  routeProvenance?: RouteProvenance
  capabilities: SavedRouteCapabilities
}

export type PlannedRouteOptionView = {
  routeOptionId: string
  label: string
  rationale: string
  stats: {
    distanceMeters: number
    durationSeconds: number
    legsCount: number
  }
  map: {
    bounds: RouteSnapshot['bounds']
    overviewGeometry: RouteSnapshot['overviewGeometry']
    legs: RouteSnapshot['legs']
  }
  overlaysPreview: {
    windSummary: WindSummary
    rainSummary: RainSummary
    temperatureSummary: TemperatureSummary
    maxTemperatureF?: number
    conditionsStatus: 'ok' | 'unavailable'
  }
  favorites?: {
    count: number
    names: string[]
  }
  /** Enrichment data from background enrichment jobs */
  enrichment?: {
    highlights: string[]
    elevation?: unknown
    weather?: unknown
  }
  /** Favorites included in this route */
  includedFavorites?: string[]
  /** Favorites excluded with reasons */
  excludedFavorites?: { id: string; name?: string; reason: string }[]
}

export type PlannedRouteOptionsView = {
  planId: string
  options: PlannedRouteOptionView[]
  /** All favorites included across all routes */
  includedFavorites?: string[]
  /** All favorites excluded across all routes */
  excludedFavorites?: { id: string; name?: string; reason: string }[]
}
