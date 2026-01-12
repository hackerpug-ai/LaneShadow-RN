import type {
  PlanInput,
  PlanPreferences,
  RouteIndex,
  RoutePreview,
  RouteSnapshot,
  SavedRouteCapabilities,
  SnapshotMeta,
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
