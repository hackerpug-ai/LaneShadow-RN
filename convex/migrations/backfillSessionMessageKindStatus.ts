/**
 * Migration: Backfill session_messages rows with default kind and status values.
 *
 * Context:
 *   The session_messages table was extended with two new fields:
 *     - kind  (text | routing_card | weather_card | saved_route_card)
 *     - status (streaming | running | complete | failed)
 *
 *   Existing rows were created before these fields existed and therefore have
 *   neither. All pre-existing messages are completed text turns, so the correct
 *   defaults are kind:'text' and status:'complete'.
 *
 * Migration strategy:
 *   This is a "small table shortcut" migration — the session_messages table is
 *   small enough in dev that a single internalMutation with .collect() is safe.
 *   For larger deployments, use @convex-dev/migrations instead.
 *
 * Run with:
 *   npx convex run migrations/backfillSessionMessageKindStatus:run
 *
 * After this migration completes and all rows are verified, a follow-up commit
 * will make kind and status required fields (the NARROW step).
 */

import { internalMutation } from '../_generated/server'

/**
 * Extracted handler for testability.
 * Patches every session_messages row that is missing kind or status.
 */
export const backfillSessionMessageKindStatusHandler = async (ctx: {
  db: {
    query: (table: string) => {
      collect: () => Promise<{ _id: string; kind?: unknown; status?: unknown }[]>
    }
    patch: (id: string, fields: object) => Promise<void>
  }
}): Promise<{ patched: number; skipped: number }> => {
  const rows = await ctx.db.query('session_messages').collect()
  let patched = 0
  let skipped = 0

  for (const row of rows) {
    if (row.kind === undefined || row.status === undefined) {
      await ctx.db.patch(row._id, { kind: 'text', status: 'complete' })
      patched++
    } else {
      skipped++
    }
  }

  return { patched, skipped }
}

/**
 * Run this migration via:
 *   npx convex run migrations/backfillSessionMessageKindStatus:run
 */
export const run = internalMutation({
  handler: async (ctx) => {
    return backfillSessionMessageKindStatusHandler(ctx as any)
  },
})
