# Fix React Anti-Patterns in Chat Components

> Status: PENDING
> Created: 2026-04-04
> Source: Red-Hat Review (React Anti-Patterns)

> Task ID: US-020
> Type: REFACTOR
> Priority: P1
> Estimate: 90 minutes
> Assignee: react-native-ui-implementer

## CRITICAL CONSTRAINTS

### MUST
- Remove duplicate local text state in ChatInput component
- Add setTimeout cleanup in useChatPlanning hook
- Fix missing dependencies in useCallback

### NEVER
- Use useState for state that parent already manages
- Leave async operations without cleanup

### STRICTLY
- React hooks rules must be followed
- No memory leaks from uncleaned timeouts

## SPECIFICATION

**Objective:** Fix React anti-patterns identified in red-hat review: duplicate state, missing cleanup, and dependency issues. These patterns cause bugs and memory leaks.

**Success looks like:** ChatInput uses parent state, useChatPlanning cleans up timeouts on unmount, and all useCallback dependencies are correct.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | ChatInput mounted | Text input changed | State managed by parent, not local | Unit test |
| 2 | useChatPlanning active | Component unmounts | setTimeout cleaned up | Unit test |
| 3 | useCallback used | Dependencies change | Callback recreates correctly | Unit test |
| 4 | React DevTools ran | Components inspected | No hook dependency warnings | Manual test |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | No duplicate text state in ChatInput | AC-1 | Code review passes | [ ] TRUE [ ] FALSE |
| 2 | setTimeout has cleanup function | AC-2 | Code review passes | [ ] TRUE [ ] FALSE |
| 3 | All useCallback dependencies correct | AC-3 | ESLint passes | [ ] TRUE [ ] FALSE |
| 4 | No React DevTools warnings | AC-4 | Manual test passes | [ ] TRUE [ ] FALSE |
| 5 | TypeScript compilation succeeds | All | `pnpm typecheck` exits 0 | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- `components/chat/chat-input.tsx` (MODIFY - remove duplicate state)
- `hooks/use-chat-planning.ts` (MODIFY - add cleanup, fix deps)
- `components/chat/__tests__/chat-input.test.tsx` (MODIFY)

### WRITE-PROHIBITED
- No behavior changes — refactoring only
- No changes to public APIs

## DESIGN

### References
- Red-Hat Review Report: "React Anti-Patterns"
- React Hooks documentation

### Pattern 1: Remove Duplicate State
```typescript
// BEFORE (chat-input.tsx:129)
const [text, setText] = useState('') // Duplicate!

// AFTER - Use parent state or uncontrolled input
const inputRef = useRef<TextInput>(null)
const handleSubmit = () => {
  const text = inputRef.current?.value || ''
  if (text.trim()) {
    onSend(text)
    inputRef.current?.clear()
  }
}
```

### Pattern 2: Add setTimeout Cleanup
```typescript
// BEFORE (use-chat-planning.ts:179-201)
useEffect(() => {
  setTimeout(() => {
    dispatch({ type: 'PLANNING_SUCCESS' })
  }, 6000)
}, [dispatch])

// AFTER - Store timer ID and cleanup
useEffect(() => {
  const timer = setTimeout(() => {
    dispatch({ type: 'PLANNING_SUCCESS' })
  }, 6000)

  return () => clearTimeout(timer) // CLEANUP
}, [dispatch])
```

### Pattern 3: Fix useCallback Dependencies
```typescript
// BEFORE (use-chat-planning.ts:227)
const cancel = useCallback(() => {
  abortRef.current?.abort()
}, [dispatch]) // Missing dependencies!

// AFTER - Include all used variables
const cancel = useCallback(() => {
  abortRef.current?.abort()
  dispatch({ type: 'CANCEL_PLANNING' })
}, [dispatch]) // If dispatch is the only dep, this is correct
```

### Anti-pattern (DO NOT)
- Do not leave setTimeout without cleanup
- Do not use useState when parent already has state
- Do not ignore ESLint react-hooks exhaust-deps warnings

## CODING STANDARDS
- **brain/docs/coding-standards**: React best practices
- React Hooks rules

## DEPENDENCIES
- US-011: useChatPlanning hook
- US-012: ChatInputBar integration

## NOTES
- Duplicate state at `chat-input.tsx:129` causes synchronization issues
- Missing cleanup at `use-chat-planning.ts:179-201` causes memory leak on unmount
- Missing dependencies at `use-chat-planning.ts:227` causes stale closures
- These are code quality issues that can cause subtle bugs
