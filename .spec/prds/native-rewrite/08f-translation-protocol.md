---
stability: CONSTITUTION
last_validated: 2026-04-18
prd_version: 1.0.0
functional_group: DESIGN
---

# Photocopy Translation Protocol (RN → Android Compose / iOS SwiftUI)

## Overview

Every Sprint 2 atom / molecule / organism / template / screen task translates a React Native component into Kotlin/Compose **and** Swift/SwiftUI. The translated component must be a *photocopy* of the RN baseline — same visual rendering, same behavior, same state model, same accessibility surface — composed with platform-native primitives and consuming **only** the LaneShadow semantic theme.

This document defines the protocol planners and implementers must follow for **every** translation task. Each task in `tasks/sprint-02-ui-component-translation/UI-*.md` references this protocol from its `READING LIST` and `CRITICAL CONSTRAINTS` sections.

---

## Sources of Truth (per component)

A translation has **two** source-of-truth files the agent MUST read in full before writing anything:

### 1. LaneShadow RN component (the wrapper)

**Path pattern:** `react-native/components/ui/<name>.tsx` (or `react-native/components/<area>/<name>.tsx`)

This file defines the component's:
- Public API: variant enum, size enum, prop contract, callback signatures
- State machine: pressed / focused / disabled / loading / error transitions
- Visual decisions: heights, paddings, radii, colors-by-state, opacity-by-state, border treatments
- Behavioral quirks: `useState` for focus, `Pressable` press feedback, keyboard behavior, conditional rendering
- Token consumption: every `semantic.color.*`, `semantic.space.*`, `semantic.radius.*`, `semantic.typography.*` reference

The native target MUST mirror its public API verbatim (variant names, size names, callback shapes — translated to platform-idiomatic types per `08d`) and replicate every visual decision via the LaneShadow core theme contract from `UI-001`.

### 2. Framework primitive source in `node_modules` (the underlying library)

For every external library primitive the wrapper composes, the agent MUST read the framework's source file. Common examples:

| Wrapper imports | Source path to read |
|---|---|
| `Text` from `react-native-paper` | `node_modules/react-native-paper/src/components/Typography/Text.tsx` + `node_modules/react-native-paper/src/components/Typography/v2/*` (variant maps: `labelLarge`, `labelSmall`, `bodyMedium`, etc.) |
| `useTheme` from `react-native-paper` | `node_modules/react-native-paper/src/core/theming.tsx` (default theme shape) |
| `BottomSheetTextInput` from `@gorhom/bottom-sheet` | `node_modules/@gorhom/bottom-sheet/src/components/bottomSheetTextInput/BottomSheetTextInput.tsx` (+ keyboard behavior props) |
| `Pressable` from `react-native` | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` |
| `TextInput` from `react-native` | `node_modules/react-native/Libraries/Components/TextInput/TextInput.js` |
| `Switch` from `react-native` | `node_modules/react-native/Libraries/Components/Switch/Switch.js` |
| `ScrollView` from `react-native` | `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js` |
| Any other RN-paper / RN-core / Gorhom primitive | Locate at `node_modules/<package>/src/...` (TS) or `node_modules/<package>/Libraries/...` (RN core JS) |

**Why both sources matter:** The wrapper describes intent; the framework primitive defines the *actual rendered visual* (typography metrics, default padding, focus ring, keyboard adjustment, hit area, accessibility defaults). Skipping the framework source produces invisible default-styling drift that breaks pixel parity. For example, Paper's `Text variant="labelLarge"` resolves to `fontSize: 14, fontWeight: 500, letterSpacing: 0.1, lineHeight: 20` — those numbers must be reproduced explicitly on Android (`MaterialTheme.typography.labelLarge` is **not** equivalent without verification) and iOS (`.font(.system(size: 14, weight: .medium))` plus `.tracking(0.1)` plus `.lineSpacing`).

---

## Style Property Enumeration Rules

For each component, the planner MUST produce a `STYLE PROPERTIES MATRIX` table that exhaustively enumerates every style property from BOTH source files. Categories to enumerate:

| Category | Properties to enumerate |
|---|---|
| **Layout** | width, height, minWidth, minHeight, maxWidth, maxHeight, padding (all sides), margin (all sides), flex, flexDirection, gap, alignItems, justifyContent, alignSelf, position |
| **Visual** | backgroundColor, borderColor, borderWidth, borderRadius (all corners), opacity, elevation / shadowColor / shadowOffset / shadowOpacity / shadowRadius, overflow |
| **Typography** (if rendering text) | fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, textTransform, textDecorationLine, textAlign, color |
| **State-dependent overrides** | pressed colors, disabled opacity / colors, focused borders / rings, error borders / colors, loading state visuals, hover (rare on mobile) |
| **Interaction** | hitSlop, accessibilityLabel, accessibilityRole, accessibilityState, accessibilityHint, testID, onPress / onChange / onFocus / onBlur signatures |
| **Keyboard / safe-area** | keyboardBehavior, keyboardBlurBehavior, android_keyboardInputMode, returnKeyType, autoCapitalize, autoCorrect, secureTextEntry, safe-area inset usage |
| **Animation / motion** | Animated values, spring configs, timing configs, transition durations |

For each enumerated property, document four columns:

1. **Source** — `RN-wrapper`, `Paper`, `Gorhom`, `RN-core`, `LaneShadowToken`
2. **Value in source** — literal value (e.g., `48`) or token accessor (e.g., `semantic.radius.xl`) or computed expression (e.g., `semantic.space['2xl'] + semantic.space.sm`)
3. **Android equivalent** — Compose modifier or theme accessor (e.g., `Modifier.height(48.dp)`, `LaneShadowTheme.spacing.xl4`, `MaterialTheme.shapes.large`)
4. **iOS equivalent** — SwiftUI modifier or environment value (e.g., `.frame(height: 48)`, `LaneShadowTheme.shared.radius.xl`, `RoundedRectangle(cornerRadius: 16)`)

Plus a fifth column per row:

5. **Token mapping** — the `tokens/semantic/semantic.tokens.json` entry that covers this value. If NONE covers it, mark `ESCALATE` and add an entry to this sprint's `DECISIONS.md` before writing implementation code.

---

## Translation Steps (in strict order)

1. **Read** the LaneShadow RN component file in full (no partial reads).
2. **Read** every framework primitive's source file in `node_modules` referenced by the wrapper's imports.
3. **Build** the `STYLE PROPERTIES MATRIX` table — exhaustive across all categories, all states, all variants, all sizes.
4. **Map** every literal value to its semantic token. If no token covers a value, STOP and escalate via `DECISIONS.md` before writing code. Never improvise a value.
5. **Define** the platform component using the prohibited-primitives rule (see `08b` § Prohibited Primitives for Android, `08c` § Prohibited Primitives for iOS). The visual reference is the RN wrapper, **not** Material Design 3 / SwiftUI defaults.
6. **Register** a sandbox `Story` for every state in the matrix that applies (default, pressed, disabled, focused, error, loading, etc.) under `AppStories.all` (Android) / `LaneShadowStories.all` (iOS).
7. **Verify** side-by-side parity in the RN sandbox (UI-002 baseline) vs the native sandbox launched via `make android_sandbox` / `make ios_sandbox`. Capture the screenshot pair required by AC-6.

---

## Universal AC-6: RN-Baseline-Diff Gate

Every translation task MUST include AC-6 verbatim:

> **GIVEN** the RN baseline scenario registry from `UI-002` (`react-native/stories/registry/scenarioRegistry.generated.ts`) and the native sandbox stories registered for this task in `AppStories.all` / `LaneShadowStories.all`.
> **WHEN** a reviewer opens the same `Story.id` in the RN sandbox and the native sandbox side-by-side.
> **THEN** rendering matches at parity: token-mapped colors are identical, heights / radii / paddings match within ±1px tolerance, all interactive state transitions (press, focus, disable, error, loading) produce visually identical results, and accessibility roles / labels match. Any intentional deviation is logged in this sprint's `tasks/sprint-02-ui-component-translation/DECISIONS.md` with rationale and reviewer sign-off.
> **Verify:** A screenshot pair (RN | native) attached to the task PR for at least one variant per component, plus a `variance--<scenario-id>--rn-vs-<platform>--<theme>.json` entry per `UI-002` conventions.

---

## Universal MUST clause (replaces the generic "token-only styling" line in every task)

Every translation task's `CRITICAL CONSTRAINTS § MUST` section MUST include this sentence verbatim:

> Map **every visual decision** in the RN source (color, height, padding, radius, opacity, border, shadow / elevation, animation, state-transition, typography metric) to its semantic-token equivalent from the `UI-001` core theme contract. Read the framework primitive's source in `node_modules` for any external library import (react-native-paper, @gorhom/bottom-sheet, react-native core) and enumerate **every** style property it contributes to the rendered visual. If no token covers a value, STOP and escalate to this sprint's `DECISIONS.md` before improvising.

---

## Output artifacts the planner adds to each task file

Each `UI-*.md` task file gains two new sections (planner-authored, implementer-consumed):

### `## TRANSLATION SOURCES` (per-task table)

| Component | RN wrapper source | Framework primitives + `node_modules` paths | Native target file | Variants × sizes × states |
|---|---|---|---|---|

One row per component listed in the task's title.

### `## STYLE PROPERTIES MATRIX` (per-component sub-section)

For each component in `TRANSLATION SOURCES`, a sub-section like:

```
### <ComponentName>

**Source files read:**
- LaneShadow: react-native/components/ui/<name>.tsx
- Framework: node_modules/<package>/<path-to-source>

**Style properties (exhaustive):**

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | height (size=default) | RN-wrapper | `semantic.space['2xl'] + semantic.space.sm` (= 40) | `Modifier.height(40.dp)` | `.frame(height: 40)` | `space.2xl + space.sm` (composed) |
| Layout | paddingHorizontal (size=default) | RN-wrapper | `semantic.space.lg` | `Modifier.padding(horizontal = LaneShadowTheme.spacing.lg)` | `.padding(.horizontal, LaneShadowTheme.shared.spacing.lg)` | `space.lg` |
| Visual | backgroundColor (variant=default, state=default) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `LaneShadowTheme.shared.colors.primary` | `color.primary.default` |
| Visual | backgroundColor (variant=default, state=pressed) | RN-wrapper | `semantic.color.primary.pressed` | (same, pressed branch) | (same, pressed branch) | `color.primary.pressed` |
| Typography | fontSize (Paper Text variant=labelLarge) | Paper | `14` | `LaneShadowTheme.typography.labelLarge.fontSize` | `LaneShadowTheme.shared.typography.labelLarge.fontSize` | `typography.labelLarge.size` |
| Typography | fontWeight (Paper Text variant=labelLarge) | Paper | `'500'` | (same) | (same) | `typography.labelLarge.weight` |
| Typography | letterSpacing (Paper Text variant=labelLarge) | Paper | `0.1` | (same) | (same) | `typography.labelLarge.tracking` |
| Interaction | accessibilityRole | RN-wrapper | `'button'` | `Modifier.semantics { role = Role.Button }` | `.accessibilityAddTraits(.isButton)` | n/a (semantic) |
| State | opacity (state=disabled) | RN-wrapper | `0.5` | `.alpha(if (disabled) 0.5f else 1f)` | `.opacity(disabled ? 0.5 : 1)` | ESCALATE — no `opacity.disabled` token; propose `state.opacity.disabled = 0.5` |
```

The matrix is **exhaustive** — every property from both source files appears, even if the value is "default" / inherited.

---

## When this protocol applies

- Every task in `tasks/sprint-02-ui-component-translation/UI-*.md` that translates RN components to a native platform.
- Future native-rewrite sprints that translate additional RN components.
- Delta tasks (UI-064 onward) that build net-new compositions — they skip the LaneShadow-wrapper read step but still apply the framework-primitive read + matrix + AC-6 if any framework primitive is involved.

---

## References

- `08-design-system.md` — token generation and consumption rules
- `08a-atomic-component-catalog.md` — full RN component inventory with atomic classification
- `08b-android-component-map.md` — Android Compose architecture + § Prohibited Primitives
- `08c-ios-component-map.md` — iOS SwiftUI architecture + § Prohibited Primitives
- `08d-component-parity-spec.md` — naming, interface, token, state, animation, accessibility, keyboard, RTL parity
- `tasks/sprint-02-ui-component-translation/SPRINT.md` — human testing gate + Tasks table
- `tasks/sprint-02-ui-component-translation/DECISIONS.md` — escalation log for missing tokens / intentional deviations
- `~/Projects/brain/docs/TDD-METHODOLOGY.md` — RED / GREEN / REFACTOR evidence expectations
