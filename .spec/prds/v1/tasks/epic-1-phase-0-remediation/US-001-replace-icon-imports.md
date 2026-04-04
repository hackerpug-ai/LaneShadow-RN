# Replace all 24 @expo/vector-icons direct imports with IconSymbol

> Task ID: US-001
> Type: INFRA
> Priority: P0
> Estimate: 240 minutes
> Assignee: ui-developer

## CRITICAL CONSTRAINTS

### MUST
- Replace all 24 component imports from `@expo/vector-icons` with the `IconSymbol` wrapper from `components/ui/icon-symbol.tsx`
- Preserve all existing icon names, sizes, and color props
- Ensure each replaced icon renders identically to the original

### NEVER
- Modify `components/ui/icon-symbol.tsx` itself
- Change any component logic beyond the import replacement
- Add new icons that don't already exist

### STRICTLY
- One import replacement per component file — verify each renders before moving to next

## SPECIFICATION

**Objective:** Eliminate all direct `@expo/vector-icons` imports to fix web platform compatibility and ensure consistent icon rendering.

**Success looks like:** Zero direct imports from `@expo/vector-icons` in any component file. All icons render correctly on web and native platforms.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | A component imports from `@expo/vector-icons` | Import is replaced with `IconSymbol` | Component renders the same icon | Visual inspection |
| 2 | All 24 components are updated | `grep` is run for `@expo/vector-icons` | Zero matches in components/ | `grep -r "@expo/vector-icons" components/ --include="*.tsx" --include="*.ts" \| wc -l` returns 0 |
| 3 | All icons replaced | App is loaded on web platform | No icon rendering errors in console | `pnpm dev:client` runs clean |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | No component file imports from @expo/vector-icons | AC-2 | `grep -r "@expo/vector-icons" components/ --include="*.tsx" --include="*.ts" \| wc -l` returns 0 | [ ] TRUE [ ] FALSE |
| 2 | All icons render on web platform without errors | AC-3 | `pnpm dev:client` — no console errors | [ ] TRUE [ ] FALSE |
| 3 | TypeScript compilation succeeds | AC-1 | `pnpm typecheck` exits 0 | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- Any component file (`.tsx`, `.ts`) in `components/` that has `@expo/vector-icons` imports (MODIFY only imports and JSX icon usage)
- Any component file in `app/` that has `@expo/vector-icons` imports (MODIFY only imports and JSX icon usage)

### WRITE-PROHIBITED
- `components/ui/icon-symbol.tsx`
- Any file outside of import/icon JSX changes

## DESIGN

### References
- `components/ui/icon-symbol.tsx` — the wrapper component to use
- IMPLEMENTATION_STATUS.md Phase 0 §1

### Code Pattern
```typescript
// BEFORE
import { Ionicons } from '@expo/vector-icons';
<Ionicons name="search" size={24} color={theme.colors.primary} />

// AFTER
import { IconSymbol } from '@/components/ui/icon-symbol';
<IconSymbol name="search" size={24} color={theme.colors.primary} />
```

### Anti-pattern (DO NOT)
- Do not create new wrapper components — use the existing `IconSymbol` directly
- Do not change icon names or sizes during replacement

## CODING STANDARDS
- **brain/docs/coding-standards**: TypeScript strict, composition patterns

## DEPENDENCIES
No task dependencies.

## NOTES
- Audit all 24 files listed in `.spec/artifacts/team-product/04-final-adjustment-report.md` §1.1
- Some icons may use different icon families (MaterialIcons, FontAwesome) — ensure `IconSymbol` supports them or map accordingly
