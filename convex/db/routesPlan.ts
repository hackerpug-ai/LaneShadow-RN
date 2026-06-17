import { v } from 'convex/values'
import { planPreferencesValidator } from '../../shared/models/saved-routes'
import type { PlanInitView } from '../../shared/types/routes'
import { query } from '../_generated/server'
import { requireIdentity } from '../guards'

const planInitViewValidator = v.object({
  defaults: v.object({
    preferences: planPreferencesValidator,
  }),
  constraints: v.object({
    maxOptions: v.number(),
  }),
})

export const getPlanInit = query({
  args: {},
  returns: planInitViewValidator,
  handler: async (ctx): Promise<PlanInitView> => {
    await requireIdentity(ctx)

    const value: PlanInitView = {
      defaults: {
        preferences: {
          scenicBias: 'default',
          avoidHighways: false,
          avoidTolls: false,
        },
      },
      constraints: {
        maxOptions: 3,
      },
    }

    return value
  },
})
