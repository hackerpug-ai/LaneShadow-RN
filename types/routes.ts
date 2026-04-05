import type {
  PlanInput,
  PlanPreferences,
  RainSummary,
  RouteIndex,
  RoutePreview,
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
  RouteSnapshot,
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
}

export type PlannedRouteOptionsView = {
  planId: string
  options: PlannedRouteOptionView[]
}
