/**
 * Migration: Delete orphaned session_messages rows with role='system', empty content,
 * and no attachments.
 *
 * Context:
 *   The old pre-tool card placeholder flow created junk rows in session_messages with:
 *     - role: 'system'
 *     - content: '' (empty string)
 *     - attachments: undefined or []
 *
 *   The new flow (shipped in task #249) never writes these rows, so this is a
 *   one-time cleanup of orphaned data.
 *
 * Predicate (DELETE if ALL three conditions are true):
 *   1. doc.role === 'system'
 *   2. !doc.content || doc.content.trim() === '' (empty or whitespace-only)
 *   3. !doc.attachments || doc.attachments.length === 0 (no attachments)
 *
 * Preservation rule:
 *   System messages WITH non-empty attachments are legitimate card rows from the
 *   new flow — they are NOT deleted.
 *
 * Migration strategy:
 *   This is a "small table shortcut" migration — the session_messages table is
 *   small enough in dev that a single internalMutation with .collect() is safe.
 *   For larger deployments, use @convex-dev/migrations instead.
 *
 * Run with:
 *   npx convex run migrations/deleteEmptyAssistantMessages:run
 *
 * Dry-run (inspect without deleting):
 *   npx convex run migrations/deleteEmptyAssistantMessages:dryRun
 */

import { internalMutation, internalQuery } from '../_generated/server'

type MinimalRow = {
  _id: string
  role: string
  content: string
  attachments?: unknown[]
}

/**
 * Returns true if the row is an orphaned empty assistant placeholder that
 * should be deleted.
 */
export const isOrphanedPlaceholder = (row: MinimalRow): boolean => {
  const hasEmptyContent = !row.content || row.content.trim() === ''
  const hasNoAttachments = !row.attachments || row.attachments.length === 0
  return row.role === 'system' && hasEmptyContent && hasNoAttachments
}

/**
 * Extracted handler for testability.
 * Deletes every session_messages row matching the orphaned placeholder predicate.
 */
export const deleteEmptyAssistantMessagesHandler = async (
  ctx: {
    db: {
      query: (table: string) => { collect: () => Promise<MinimalRow[]> }
      delete: (id: string) => Promise<void>
    }
  },
  options: { dryRun: boolean } = { dryRun: false },
): Promise<{ deleted: number; kept: number; dryRun: boolean }> => {
  const rows = await ctx.db.query('session_messages').collect()
  let deleted = 0
  let kept = 0

  for (const row of rows) {
    if (isOrphanedPlaceholder(row)) {
      if (!options.dryRun) {
        await ctx.db.delete(row._id)
      }
      deleted++
    } else {
      kept++
    }
  }

  return { deleted, kept, dryRun: options.dryRun }
}

/**
 * Run the migration (destructive — deletes matching rows).
 *
 *   npx convex run migrations/deleteEmptyAssistantMessages:run
 */
export const run = internalMutation({
  handler: async (ctx) => {
    return deleteEmptyAssistantMessagesHandler(ctx as any, { dryRun: false })
  },
})

/**
 * Dry-run: inspect how many rows would be deleted without actually deleting.
 *
 *   npx convex run migrations/deleteEmptyAssistantMessages:dryRun
 */
export const dryRun = internalQuery({
  handler: async (ctx) => {
    const rows = await ctx.db.query('session_messages').collect()
    let wouldDelete = 0
    let wouldKeep = 0

    for (const row of rows) {
      if (isOrphanedPlaceholder(row as MinimalRow)) {
        wouldDelete++
      } else {
        wouldKeep++
      }
    }

    return { wouldDelete, wouldKeep, dryRun: true }
  },
})
