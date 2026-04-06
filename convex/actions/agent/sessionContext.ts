'use node'

import { internal } from '../../_generated/api'
import type { Id } from '../../_generated/dataModel'
import type { RoutePlanSummary } from '../../db/routePlans'
import type { PlanPreferences } from '../../../models/saved-routes'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SessionContextRunQuery = {
  runQuery: (fn: any, args: any) => Promise<any>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const METERS_PER_MILE = 1609.344

function formatPreferences(prefs: PlanPreferences): string {
  const prefObj: Record<string, string | boolean> = {}

  if (prefs.scenicBias === 'high') {
    prefObj.scenicBias = 'high'
  }

  if (prefs.avoidHighways) {
    prefObj.avoidHighways = true
  }

  if (prefs.avoidTolls) {
    prefObj.avoidTolls = true
  }

  return Object.keys(prefObj).length > 0
    ? JSON.stringify(prefObj)
    : 'default'
}

function formatLabel(
  label: string | undefined,
  fallbackLat?: number,
  fallbackLng?: number
): string {
  if (label) return label
  if (fallbackLat !== undefined && fallbackLng !== undefined) {
    const lat = fallbackLat.toFixed(2)
    const lng = fallbackLng.toFixed(2)
    return `${lat},${lng}`
  }
  return 'unknown'
}

function formatRoute(summary: RoutePlanSummary, index: number): string {
  const startLabel = formatLabel(summary.startLabel)
  const endLabel = formatLabel(summary.endLabel)

  const distMiles = Math.round((summary.distanceMeters ?? 0) / METERS_PER_MILE)
  const durationMins = Math.round((summary.durationSeconds ?? 0) / 60)

  const prefsJson = formatPreferences(summary.preferences)

  const lines = [
    `${index}. ${startLabel} \u2192 ${endLabel}: ${distMiles}mi \u00b7 ${durationMins}min`,
  ]

  if (prefsJson !== 'default') {
    lines.push(`   Preferences: ${prefsJson}`)
  }

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Exported function
// ---------------------------------------------------------------------------

export async function buildInSessionRouteBlock(
  ctx: SessionContextRunQuery,
  planningSessionId: Id<'planning_sessions'>
): Promise<string> {
  const routes: RoutePlanSummary[] = await ctx.runQuery(
    internal.db.routePlans.listBySession,
    { sessionId: planningSessionId, limit: 5, status: 'completed' }
  )

  if (!routes || routes.length === 0) {
    return ''
  }

  const lines: string[] = [
    'Routes already planned this session:',
    ...routes.map((route, i) => formatRoute(route, i + 1)),
    'When refining, reference these by endpoint pair and only change what the rider asks.',
  ]

  return lines.join('\n')
}
