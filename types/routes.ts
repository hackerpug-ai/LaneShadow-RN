import type {
  PlanInput,
  PlanPreferences,
  RouteIndex,
  RoutePreview,
  RouteSnapshot,
  SavedRouteCapabilities,
  SnapshotMeta,
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
  createdAt: number
  updatedAt: number
  preview: RoutePreview
  capabilities: SavedRouteCapabilities
}

export type SavedRoutesListView = {
  routes: Array<SavedRouteListItemView>
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
    conditionsStatus: 'ok' | 'unavailable'
  }
}

export type PlannedRouteOptionsView = {
  planId: string
  options: Array<PlannedRouteOptionView>
}

export type PlanRideInput = {
  currentLocation?: string | null
  destination?: string | null
  onCurrentLocationChange?: (value: string) => void
  onDestinationChange?: (value: string) => void
}
