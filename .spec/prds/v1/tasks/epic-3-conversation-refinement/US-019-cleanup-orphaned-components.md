# Remove orphaned design-era components

> Task ID: US-019
> Status: ✅ Completed
> Completed: 2026-04-06T17:00:07Z
> Commit: d12741b742bcde2ecfbbe6abf6fcee435769433f
> Reviewer: orchestrator-verified via diff
> Type: CHORE
> Priority: P2
> Estimate: 30 minutes
> Assignee: ui-developer
> Created: 2026-04-06 — new task to clean up dead code discovered during Epic 3 refinement

## CRITICAL CONSTRAINTS

### MUST

- Remove orphaned components that are not imported anywhere in production code
- Verify each component has zero production imports before deletion
- Commit removal as a single atomic commit

### NEVER

- Remove components that ARE imported in production code
- Remove test files that reference these components (update or remove tests too)

### STRICTLY

- Run `grep -r` to verify zero imports before deleting each file
- Run typecheck after removal to confirm no breakage

## SPECIFICATION

**Objective:** During Epic 3 refinement, we identified several design-era prototype components that are orphaned — they have stale prop contracts incompatible with the current architecture and are not imported by any production code. Removing them prevents confusion and reduces dead code.

**Components to evaluate for removal:**

1. `components/ui/agent-message-overlay.tsx` — Uses stale `RouteAttachment` type (`{id, label, description, distance, duration, scenicScore}`) incompatible with current `PlannedRouteOptionsView`. The active transient overlay is handled by `ChatTranscript` + animated opacity in HomeMapScreen.

2. `components/ui/full-chat-history-view.tsx` — Uses stale `ChatMessage` type with string-based `RouteAttachmentProps`. The active chat history uses `ChatTranscript` which renders via `CARD_REGISTRY`.

3. `components/ui/chat-input-bar.tsx` — Design-era prototype. The production chat input is `components/chat/chat-input.tsx` (used in HomeMapScreen and ChatScreen).

4. `hooks/use-chat-session.ts` — Functionally hollow stub. Derives synthetic messages from `RideFlowState` phase but its return value is never used (HomeMapScreen calls it but discards the result). Real messages come from `useQuery(api.db.sessionMessages.list)`.

5. `components/ui/route-attachment-card.tsx` (in `components/ui/`) — Earlier version with different prop interface (`id, label, description, distance, duration, scenicScore, weatherBadge, isBest`). Active version is `components/chat/route-attachment-card.tsx`.

**Pre-deletion verification for each file:**
```bash
# Verify no production imports
grep -r "from.*agent-message-overlay" --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v ".spec/"
```

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | Orphaned components identified | Each file verified to have zero production imports | Files are deleted | `grep -r` returns no matches |
| 2 | Files are deleted | Typecheck runs | No type errors introduced | `npx tsc --noEmit` passes |
| 3 | Files are deleted | App builds | No build errors | `npx expo export --platform ios` or equivalent |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | All orphaned files have zero production imports before deletion | AC-1 | Automated: grep verification | TODO |
| 2 | Typecheck passes after deletion | AC-2 | Automated: tsc --noEmit | TODO |
| 3 | Build succeeds after deletion | AC-3 | Automated: expo build check | TODO |

## GUARDRAILS

### WRITE-ALLOWED (DELETE)

- `components/ui/agent-message-overlay.tsx` (DELETE — after import verification)
- `components/ui/full-chat-history-view.tsx` (DELETE — after import verification)
- `components/ui/chat-input-bar.tsx` (DELETE — after import verification)
- `components/ui/route-attachment-card.tsx` (DELETE — after import verification)
- `hooks/use-chat-session.ts` (DELETE — after import verification)

### WRITE-PROHIBITED

- `components/chat/` (active components — do not touch)
- `components/ui/chat-transcript.tsx` (active — do not touch)
- `convex/` (no backend changes)

## DEPENDENCIES

- US-016: Must be complete first (confirms we don't need AgentMessageOverlay)
- US-017: Must be complete first (confirms we don't need FullChatHistoryView)

## NOTES

- This is a cleanup task, not a feature — P2 priority
- If any file turns out to have unexpected production imports, skip it and note in the commit message
- The `components/ui/` directory will still have active components (chat-transcript.tsx, etc.) after cleanup
