# Fix TypeScript and Lint Errors

> Status: PENDING
> Created: 2026-04-04
> Source: Red-Hat Review (Build Issues)

> Task ID: US-023
> Type: BUG_FIX
> Priority: P0
> Estimate: 180 minutes
> Assignee: convex-implementer, react-native-ui-implementer

## CRITICAL CONSTRAINTS

### MUST
- Resolve all 50+ TypeScript compilation errors
- Fix all 123 lint errors
- Ensure `pnpm type-check` exits with code 0
- Ensure `pnpm lint` exits with code 0

### NEVER
- Use `@ts-ignore` or `@ts-nocheck` to bypass errors
- Disable lint rules to avoid fixing issues

### STRICTLY
- US-008 AC-4 requires: "TypeScript compilation succeeds"
- Code cannot deploy with compilation errors

## SPECIFICATION

**Objective:** Fix all TypeScript and lint errors preventing build. Current state: 50+ TS errors, 123 lint errors. Code cannot deploy.

**Success looks like:** `pnpm type-check` and `pnpm lint` both exit successfully. CI/CD pipeline can build the code.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | TypeScript errors exist | pnpm type-check run | Exits with code 0 | Build succeeds |
| 2 | Lint errors exist | pnpm lint run | Exits with code 0 | Build succeeds |
| 3 | CI/CD run | All tests pass | Pipeline green | CI passes |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | pnpm type-check exits 0 | AC-1 | Bash command succeeds | [ ] TRUE [ ] FALSE |
| 2 | pnpm lint exits 0 | AC-2 | Bash command succeeds | [ ] TRUE [ ] FALSE |
| 3 | No @ts-ignore in code | AC-3 | Grep finds none | [ ] TRUE [ ] FALSE |
| 4 | CI/CD pipeline passes | AC-3 | Pipeline dashboard | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- All files with TypeScript errors (MODIFY as needed)
- All files with lint errors (MODIFY as needed)
- `tsconfig.json` (MODIFY if config issue, not to bypass errors)
- `.eslintrc.*` (MODIFY if config issue, not to bypass errors)

### WRITE-PROHIBITED
- No `@ts-ignore` or `@ts-nocheck` to bypass errors
- No disabling lint rules to avoid fixing issues

## DESIGN

### References
- Red-Hat Review Report: "TypeScript Compilation Fails"
- US-008 AC-4: TypeScript compilation requirement

### Strategy
1. Run `pnpm type-check` to capture all errors
2. Categorize errors by type:
   - Missing imports
   - Type mismatches
   - Missing type definitions
   - Config issues
3. Fix each category systematically
4. Run `pnpm lint` and categorize lint errors
5. Fix lint issues
6. Verify both commands pass

### Common TypeScript Fixes
```typescript
// Missing import
import { Id } from './_generated/dataModel'

// Type mismatch
const sessionId: Id<'planning_sessions'> = args.sessionId

// Missing type definition
interface RouteOptions {
  planId: string
  options: RouteOption[]
}

// Optional chaining
const value = obj?.property?.subProperty
```

### Common Lint Fixes
```typescript
// Unused variable
// const unused = 'value' // REMOVE

// Missing dependency in useCallback
const callback = useCallback(() => {
  doSomething(value)
}, [value]) // ADD value to deps

// Console.log in production
// console.log('debug') // REMOVE or use logger
```

### Anti-pattern (DO NOT)
- Do not use `as any` to bypass type checking
- Do not disable ESLint rules in comments
- Do not leave TODOs instead of fixing errors

## CODING STANDARDS
- **brain/docs/coding-standards**: TypeScript strict mode
- **convex/_generated/ai/guidelines.md**: Convex type safety

## DEPENDENCIES
- All Epic-2 tasks (may reveal errors in their implementations)

## NOTES
- This is a CRITICAL blocker — code cannot deploy with errors
- Errors may be spread across multiple files
- Some errors may be cascading (fix one, reveal others)
- May need to iterate: fix type-check → fix lint → repeat
- US-008 AC-4 requires compilation success — currently FAILING
