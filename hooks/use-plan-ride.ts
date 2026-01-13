import { useAction, useQuery } from 'convex/react'
import type { FunctionReturnType } from 'convex/server'
import { useCallback, useMemo, useState } from 'react'

import { api } from '../convex/_generated/api'
import { getUserFacingError } from '../lib/convex-error'
import { showErrorNotification } from '../lib/notifier-helpers'
import type { PlanInput, PlannedRouteOptionsView } from '../types/routes'

type PlanInitData = FunctionReturnType<typeof api.db.routesPlan.getPlanInit>
type PlanRideResult = FunctionReturnType<typeof api.actions.agent.planRide.planRide>

export const usePlanInit = (): {
  data: PlanInitData | undefined
  isLoading: boolean
} => {
  const data = useQuery(api.db.routesPlan.getPlanInit)
  const isLoading = data === undefined

  return useMemo(
    () => ({
      data: data as PlanInitData | undefined,
      isLoading,
    }),
    [data, isLoading]
  )
}

export const usePlanRide = (): {
  planRide: (input: PlanInput) => Promise<PlanRideResult | null>
  isRunning: boolean
  error: string | null
  resetError: () => void
} => {
  const planRideAction = useAction(api.actions.agent.planRide.planRide)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const planRide = useCallback(
    async (input: PlanInput) => {
      setIsRunning(true)
      setError(null)
      try {
        const result = await planRideAction({ planInput: input })
        return result as PlanRideResult
      } catch (err) {
        const parsed = getUserFacingError(err)
        setError(parsed.message)
        showErrorNotification(parsed.message)
        return null
      } finally {
        setIsRunning(false)
      }
    },
    [planRideAction]
  )

  const resetError = useCallback(() => setError(null), [])

  return useMemo(
    () => ({
      planRide,
      isRunning,
      error,
      resetError,
    }),
    [error, isRunning, planRide, resetError]
  )
}
