import { useMutation, useQuery } from 'convex/react'
import type { FunctionReturnType } from 'convex/server'
import { useCallback, useMemo, useState } from 'react'

import { api } from '../convex/_generated/api'
import type { Id } from '../convex/_generated/dataModel'
import { getUserFacingError } from '../lib/convex-error'
import { showErrorNotification, showSuccessNotification } from '../lib/notifier-helpers'
import type {
  PlanInput,
  RouteIndex,
  RouteSnapshot,
  SavedRouteDetailView,
  SavedRoutesListView,
  SnapshotMeta,
} from '../types/routes'

type SavedRoutesListResult = FunctionReturnType<typeof api.db.savedRoutes.getSavedRoutesList>
type SavedRouteDetailResult = FunctionReturnType<typeof api.db.savedRoutes.getSavedRouteDetail>
type SaveRouteArgs = {
  name: string
  planInput: PlanInput
  routeSnapshot: RouteSnapshot
  routeIndex: RouteIndex
  snapshotMeta: SnapshotMeta
}

export const useSavedRoutesList = (
  limit?: number
): { data: SavedRoutesListView | undefined; isLoading: boolean } => {
  const data = useQuery(api.db.savedRoutes.getSavedRoutesList, { limit })
  const isLoading = data === undefined

  return useMemo(
    () => ({
      data: data as SavedRoutesListResult | undefined,
      isLoading,
    }),
    [data, isLoading]
  )
}

export const useSavedRouteDetail = (
  savedRouteId: string | null
): { data: SavedRouteDetailView | null | undefined; isLoading: boolean } => {
  const data = useQuery(
    api.db.savedRoutes.getSavedRouteDetail,
    savedRouteId ? { savedRouteId: savedRouteId as Id<'saved_routes'> } : 'skip'
  )
  const isLoading = data === undefined

  return useMemo(
    () => ({
      data: (data as SavedRouteDetailResult | null | undefined) ?? null,
      isLoading,
    }),
    [data, isLoading]
  )
}

const useMutationRunner = <Args extends Record<string, unknown>, Result>(
  mutationRef: (args: Args) => Promise<Result>,
  successMessage: string
): {
  run: (args: Args) => Promise<Result | null>
  isRunning: boolean
  error: string | null
  resetError: () => void
} => {
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(
    async (args: Args) => {
      setIsRunning(true)
      setError(null)
      try {
        const result = await mutationRef(args)
        showSuccessNotification(successMessage)
        return result
      } catch (err) {
        const parsed = getUserFacingError(err)
        setError(parsed.message)
        showErrorNotification(parsed.message)
        return null
      } finally {
        setIsRunning(false)
      }
    },
    [mutationRef, successMessage]
  )

  const resetError = useCallback(() => setError(null), [])

  return useMemo(
    () => ({
      run,
      isRunning,
      error,
      resetError,
    }),
    [error, isRunning, resetError, run]
  )
}

export const useSaveRoute = () => {
  const mutation = useMutation(api.db.savedRoutes.saveRoute)
  return useMutationRunner<SaveRouteArgs, { savedRouteId: string }>(
    mutation,
    'Route saved successfully.'
  )
}

export const useRenameRoute = () => {
  const mutation = useMutation(api.db.savedRoutes.renameRoute)
  return useMutationRunner<{ savedRouteId: Id<'saved_routes'>; name: string }, null>(
    mutation,
    'Route renamed.'
  )
}

export const useDeleteRoute = () => {
  const mutation = useMutation(api.db.savedRoutes.deleteRoute)
  return useMutationRunner<{ savedRouteId: Id<'saved_routes'>; name?: string }, null>(
    mutation,
    'Route deleted.'
  )
}
