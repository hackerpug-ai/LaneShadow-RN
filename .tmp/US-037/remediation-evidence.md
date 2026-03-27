# US-037 Remediation Evidence

## Fix 1: borderWidth: 1 → StyleSheet.hairlineWidth

**File**: `components/ui/saved-route-card.tsx`
**Line**: 45 (was `borderWidth: 1`)
**Fix**: Imported `StyleSheet` from `react-native` and replaced `borderWidth: 1` with `StyleSheet.hairlineWidth`
**Reason**: No semantic border-width token exists in the theme system. `StyleSheet.hairlineWidth` is the canonical React Native way to express a thin 1px border.

## Fix 2: @expo/vector-icons import — NO CHANGE NEEDED

**Investigation**: Grepped all components for `@expo/vector-icons`.
**Finding**: 15+ components in the codebase import directly from `@expo/vector-icons`. No wrapper component (`@/components/ui/Icon`) is used as the established pattern.
**Decision**: Direct import is the pre-existing codebase pattern. Changing it would be a non-standard deviation, not a fix.

## Test Results

All 8 SavedRouteCard tests passed after the fix.
