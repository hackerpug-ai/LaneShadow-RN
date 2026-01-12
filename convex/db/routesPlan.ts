import { v } from 'convex/values'
import { query } from '../_generated/server'

import { planPreferencesValidator } from '../../models/saved-routes'
import type { PlanInitView } from '../../types/routes'
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
