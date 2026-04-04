# Replace all 10 React Native Text imports with Paper Text

> Task ID: US-002
> Type: INFRA
> Priority: P0
> Estimate: 120 minutes
> Assignee: ui-developer

## CRITICAL CONSTRAINTS

### MUST
- Replace all core React Native `Text` imports with `react-native-paper` `Text` component
- Use appropriate Paper `Text` variants (bodyMedium, titleLarge, labelSmall, etc.) based on context
- Preserve all existing styling and layout behavior

### NEVER
- Change any component logic beyond the Text import and usage replacement
- Use raw `variant` strings that don't exist in Paper's type system

### STRICTLY
- Every replaced `Text` must have an explicit `variant` prop — no bare `<Text>` without variant

## SPECIFICATION

**Objective:** Replace all direct React Native `Text` imports with Paper `Text` to ensure consistent typography theming and dark mode support.

**Success looks like:** Zero direct React Native `Text` imports in component files. All text renders with proper Paper variants and responds to theme changes.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | A component imports `Text` from `react-native` | Import is replaced with Paper `Text` | Component renders text with proper variant | Visual inspection |
| 2 | All 10 components are updated | `grep` is run | Zero matches for RN Text in components/ | `grep -r "import.*Text.*from 'react-native'" components/ --include="*.tsx" \| wc -l` returns 0 |
| 3 | Dark mode is toggled | Text renders in all components | Text colors follow theme | Manual dark mode toggle |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | No component file imports Text from react-native | AC-2 | `grep -r "import.*Text.*from 'react-native'" components/ --include="*.tsx" \| wc -l` returns 0 | [ ] TRUE [ ] FALSE |
| 2 | TypeScript compilation succeeds | AC-1 | `pnpm typecheck` exits 0 | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- All 10 affected component files with React Native Text imports (MODIFY)

### WRITE-PROHIBITED
- Any logic changes beyond import replacement and Text variant assignment

## DESIGN

### References
- IMPLEMENTATION_STATUS.md Phase 0 §2
- react-native-paper Text component documentation

### Code Pattern
```typescript
// BEFORE
import { Text, View } from 'react-native';
<Text style={styles.title}>Hello</Text>

// AFTER
import { Text } from 'react-native-paper';
import { View } from 'react-native';
<Text variant="titleLarge">Hello</Text>
```

### Anti-pattern (DO NOT)
- Do not use `<Text>` without a `variant` prop
- Do not remove existing `style` props — combine with Paper variant if needed

## CODING STANDARDS
- **brain/docs/coding-standards**: TypeScript strict, composition patterns

## DEPENDENCIES
No task dependencies.

## NOTES
- Common variant mappings: headings -> titleLarge/titleMedium, body text -> bodyMedium/bodyLarge, labels -> labelSmall/labelMedium
- If a component imports both `Text` and other RN components, split the import to keep the RN import for non-Text items
