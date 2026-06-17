import { useAction, useQuery } from 'convex/react'
import type { FunctionReturnType } from 'convex/server'
import { useCallback, useMemo, useRef, useState } from 'react'
import { api } from '../convex/_generated/api'
import { getUserFacingError } from '../lib/convex-error'
import { showErrorNotification } from '../lib/notifier-helpers'
import { logger } from '../shared/lib/logger/frontend-logger'
import type { PlanInput } from '../shared/types/routes'

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
    [data, isLoading],
  )
}

export const usePlanRide = (): {
  planRide: (input: PlanInput) => Promise<PlanRideResult | null>
  isRunning: boolean
  error: string | null
  resetError: () => void
  cancelPlanning: () => void
} => {
  const planRideAction = useAction(api.actions.agent.planRide.planRide)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const planRide = useCallback(
    async (input: PlanInput) => {
      // Abort any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create new AbortController
      const controller = new AbortController()
      abortControllerRef.current = controller

      setIsRunning(true)
      setError(null)

      logger.info('ui.action', 'planRide called', {
        start: input.start,
        end: input.end,
        departureTime: input.departureTime,
      })

      try {
        const result = await planRideAction({
          planInput: input,
        })

        logger.info('ui.action', 'planRide succeeded', {
          optionsCount: result.options.length,
          planId: result.planId,
        })

        return result as PlanRideResult
      } catch (err) {
        // Ignore aborted errors
        if ((err as Error).name === 'AbortError') {
          logger.info('ui.action', 'planRide aborted')
          return null
        }

        const parsed = getUserFacingError(err)
        logger.error('ui.error', 'planRide failed', err as Error, {
          userFacingMessage: parsed.message,
        })
        setError(parsed.message)
        showErrorNotification(parsed.message)
        return null
      } finally {
        setIsRunning(false)
        abortControllerRef.current = null
      }
    },
    [planRideAction],
  )

  const resetError = useCallback(() => setError(null), [])

  const cancelPlanning = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsRunning(false)
    setError(null)
  }, [])

  return useMemo(
    () => ({
      planRide,
      isRunning,
      error,
      resetError,
      cancelPlanning,
    }),
    [error, isRunning, planRide, resetError, cancelPlanning],
  )
}
