# Replace hardcoded colors in map components with semantic tokens

> Status: COMPLETE (2026-04-04)

> Task ID: US-003
> Type: INFRA
> Priority: P0
> Estimate: 60 minutes
> Assignee: ui-developer

## CRITICAL CONSTRAINTS

### MUST
- Use `useSemanticTheme()` tokens for all color values in map-style.ts and route-polyline-component.tsx
- Replace all hardcoded hex color values (#RRGGBB) with semantic theme tokens
- Ensure polylines respond correctly to dark mode toggle

### NEVER
- Change polyline rendering logic — only replace color values
- Modify any geometry, width, or opacity logic

### STRICTLY
- Only touch color-related values — no other map rendering changes

## SPECIFICATION

**Objective:** Replace all hardcoded hex colors in map components with semantic theme tokens so polylines and map styles respond to dark mode.

**Success looks like:** Zero hardcoded hex colors in `map-style.ts`. Polylines use theme-aware colors that adapt to light/dark mode.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | map-style.ts has hardcoded hex colors on lines 24-48 | Colors are replaced with semantic tokens | Map styles use theme colors | Code review |
| 2 | route-polyline-component.tsx:147 has hardcoded color | Color is replaced with semantic token | Polyline uses theme color | Code review |
| 3 | Dark mode is toggled | Map polylines render | Colors match dark mode theme | Manual dark mode toggle |
| 4 | All hex colors replaced | `grep` is run | Zero hardcoded hex matches | `grep -n "#[0-9a-fA-F]" components/map/map-style.ts \| wc -l` returns 0 |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | No hardcoded hex colors in map-style.ts | AC-4 | `grep -n "#[0-9a-fA-F]" components/map/map-style.ts \| wc -l` returns 0 | [ ] TRUE [ ] FALSE |
| 2 | TypeScript compilation succeeds | AC-1 | `pnpm typecheck` exits 0 | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- `components/map/map-style.ts` (MODIFY — color values only)
- `components/map/route-polyline-component.tsx` (MODIFY — line 147 color value only)

### WRITE-PROHIBITED
- Any file outside the two listed above
- Any non-color logic in the listed files

## DESIGN

### References
- IMPLEMENTATION_STATUS.md Phase 0 §3
- `useSemanticTheme()` hook for available tokens

### Code Pattern
```typescript
// BEFORE
const routeColor = '#4A90D9';

// AFTER
const { colors } = useSemanticTheme();
const routeColor = colors.route.primary;
```

### Anti-pattern (DO NOT)
- Do not create new color constants — use existing semantic tokens
- Do not change polyline width, opacity, or dash patterns

## CODING STANDARDS
- **brain/docs/coding-standards**: TypeScript strict, composition patterns

## DEPENDENCIES
No task dependencies.

## NOTES
- `map-style.ts` lines 24-48 contain the bulk of hardcoded colors
- `route-polyline-component.tsx` line 147 has a single hardcoded color for the route polyline
