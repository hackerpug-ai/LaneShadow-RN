# Implement useChatSession hook with session CRUD

> Task ID: US-019
> Type: FEATURE
> Priority: P0
> Estimate: 90 minutes
> Assignee: ui-developer

## CRITICAL CONSTRAINTS

### MUST

- Use conditional Convex query pattern: `useQuery(api, sessionId ? { sessionId } : 'skip')`
- Call `planningSessions.get` and `sessionMessages.list` reactively
- Dispatch `SET_ACTIVE_SESSION` on `loadSession`
- Dispatch `SET_ROUTE_OPTIONS` when loading a session that has route attachments
- Auto-create session on first message sent
- Auto-load most recent session on app open

### NEVER

- Add state syncing via `useEffect` — read 09-technical-client.md §2.1 pattern
- Fetch session data imperatively when Convex reactive queries are available
- Create a session eagerly before the rider sends their first message

### STRICTLY

- Follow the Convex `'skip'` pattern for conditional queries — do not use `undefined` or `null` as skip sentinel
- Session creation must be a single Convex mutation, not multiple calls

## SPECIFICATION

**Objective:** Implement the `useChatSession` hook that manages the lifecycle of a planning session: creating sessions on first message, loading existing sessions with their routes, and providing reactive access to session data via Convex queries.

**Success looks like:** When the rider sends their first message, a session is created automatically. When they reopen the app, the most recent session loads with its routes restored on the map. Loading a session from the sidebar dispatches the correct state updates to restore the full planning context.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | No active session (null sessionId) | Hook is mounted | Convex queries are skipped (no unnecessary network calls) | Code review: verify `'skip'` pattern |
| 2 | Rider sends first message | `createSession` is called | `SET_ACTIVE_SESSION` is dispatched with new session ID | Debug: verify dispatch after mutation |
| 3 | Session has route attachments | `loadSession` is called | `SET_ROUTE_OPTIONS` is dispatched, routes appear on map | Visual: routes restore on session load |
| 4 | Rider sends a message in active session | `sendMessage` is called | Message dispatched locally AND Convex mutation called | Code review: optimistic + server update |
| 5 | App opens | Hook initializes | Most recent session is loaded automatically | Visual: last session's routes visible on app open |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | Null sessionId skips Convex queries | AC-1 | Code review: verify skip sentinel usage | TODO |
| 2 | createSession dispatches SET_ACTIVE_SESSION | AC-2 | Manual: send first message, verify state | TODO |
| 3 | loadSession restores routes from latest route attachment | AC-3 | Manual: load session from sidebar, verify map | TODO |
| 4 | sendMessage dispatches locally and calls mutation | AC-4 | Manual: send message, verify optimistic UI | TODO |
| 5 | Most recent session auto-loads on app open | AC-5 | Manual: close and reopen app | TODO |

## GUARDRAILS

### WRITE-ALLOWED

- `hooks/use-chat-session.ts` (NEW or MODIFY)

### WRITE-PROHIBITED

- `convex/db/planningSessions.ts` (backend — use existing API)
- `convex/db/sessionMessages.ts` (backend — use existing API)
- `convex/schema.ts` (backend — do not modify schema)

## DESIGN

### References

- 09-technical-client.md §2.1 — Convex conditional query pattern and session hook architecture
- 07-technical-backend.md §4.2 — Chat session Convex endpoints
- 04-uc-agentic.md UC-AG-09 — Manage chat sessions

### Code Pattern

```typescript
// hooks/use-chat-session.ts
export function useChatSession(dispatch: Dispatch) {
  const [sessionId, setSessionId] = useState<Id<'planning_sessions'> | null>(null)

  // Conditional queries — skip when no session
  const session = useQuery(
    api.db.planningSessions.get,
    sessionId ? { sessionId } : 'skip'
  )
  const messages = useQuery(
    api.db.sessionMessages.list,
    sessionId ? { sessionId } : 'skip'
  )

  const createSessionMutation = useMutation(api.db.planningSessions.create)
  const sendMessageMutation = useMutation(api.db.sessionMessages.send)

  const createSession = async () => {
    const id = await createSessionMutation({ title: 'New Session' })
    setSessionId(id)
    dispatch({ type: 'SET_ACTIVE_SESSION', payload: id })
    return id
  }

  const loadSession = (id: Id<'planning_sessions'>) => {
    setSessionId(id)
    dispatch({ type: 'SET_ACTIVE_SESSION', payload: id })
    // Routes restore reactively via Convex query
  }

  return { session, messages, sessionId, createSession, loadSession, sendMessage }
}
```

### Anti-pattern (DO NOT)

- Do not use `useEffect` to sync Convex query results into local state — derive UI from query results directly
- Do not create sessions on hook mount — only on first message
- Do not use `undefined` as skip sentinel — Convex expects the string `'skip'`

## CODING STANDARDS

- **brain/docs/coding-standards**: TypeScript strict, composition patterns

## DEPENDENCIES

- Epic 2: Chat Infrastructure (useRideFlow dispatch, state machine)
- Convex backend: `planningSessions.create`, `planningSessions.get`, `sessionMessages.list`, `sessionMessages.send` must exist
- `SET_ACTIVE_SESSION` and `SET_ROUTE_OPTIONS` actions must be defined in useRideFlow reducer

## NOTES

- This hook is the bridge between Convex reactive data and local UI state
- Route restoration on session load requires finding the latest message with route attachments and dispatching SET_ROUTE_OPTIONS
- The auto-load on app open can query `planningSessions.list` (limit 1, newest first) to find the most recent session
- Optimistic UI: dispatch message locally before mutation completes for instant feedback
