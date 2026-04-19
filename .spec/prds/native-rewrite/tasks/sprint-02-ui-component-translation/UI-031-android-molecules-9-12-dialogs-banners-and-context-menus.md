# UI-031: Android molecules 9/12 — dialogs, banners & context menus: `DeleteRouteDialog`, `RenameRouteDialog`, `DeleteFavoriteDialog`, `SaveFavoriteSheet`, `FavoriteExclusionAlert`, `SessionContextMenu`, `NewSessionButton`, `ConnectionBanner`, `PermissionNotification`, `FavoritesInfoSheet`, `PlanningErrorSheet`, `PlanningLoading`, `TogglesContainer`, `SaveRouteConfirmationSheet`

**Task ID:** UI-031
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** kotlin-implementer
**Reviewer:** kotlin-reviewer
**Estimate:** 720 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Molecules
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `molecules` slice for `Android molecules 9/12 — dialogs, banners & context menus: DeleteRouteDialog, RenameRouteDialog, DeleteFavoriteDialog, SaveFavoriteSheet, FavoriteExclusionAlert, SessionContextMenu, NewSessionButton, ConnectionBanner, PermissionNotification, FavoritesInfoSheet, PlanningErrorSheet, PlanningLoading, TogglesContainer, SaveRouteConfirmationSheet`.

**Objective:** Implement Android molecules 9/12 — dialogs, banners & context menus: `DeleteRouteDialog`, `RenameRouteDialog`, `DeleteFavoriteDialog`, `SaveFavoriteSheet`, `FavoriteExclusionAlert`, `SessionContextMenu`, `NewSessionButton`, `ConnectionBanner`, `PermissionNotification`, `FavoritesInfoSheet`, `PlanningErrorSheet`, `PlanningLoading`, `TogglesContainer`, `SaveRouteConfirmationSheet` as Jetpack Compose work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the Android sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: `DeleteRouteDialog`, `RenameRouteDialog`, `DeleteFavoriteDialog`, `SaveFavoriteSheet`, `FavoriteExclusionAlert`, `SessionContextMenu`, `NewSessionButton`, `ConnectionBanner`, `PermissionNotification`, `FavoritesInfoSheet`, `PlanningErrorSheet`, `PlanningLoading`, `TogglesContainer`, `SaveRouteConfirmationSheet`.
- Use only the LaneShadow core theme contract locked by `UI-001`: `tokens/semantic/semantic.tokens.json` as the source of truth, generated `native-theme` outputs as the shared packaging layer, and the platform theme entry points (`LaneShadowTheme` on Android, `.laneShadowTheme()` on iOS) for colors, spacing, typography, radii, elevation, and state styling.
- Register sandbox scenarios for default, interactive, and edge-case states with RN reference labels.
- Compose only from already-defined atoms on the same platform and preserve RN layout hierarchy.

### NEVER
- Add unrelated feature wiring or backend dependencies to satisfy sandbox rendering.
- Introduce hardcoded UI primitives or platform-only naming drift.

### STRICTLY
- Preserve light and dark parity, accessibility labels, and deterministic fixtures for every scenario.

## DELIVERABLES

- android/app/src/main/java/com/laneshadow/ui/molecules/**
- android/app/src/debug/java/com/laneshadow/sandbox/stories/MoleculesStories.kt — story set aggregated into AppStories.all
- android/app/src/test/java/com/laneshadow/**
- android/app/src/androidTest/java/com/laneshadow/**

## ACCEPTANCE CRITERIA

### AC-1
**GIVEN** The RN baseline and atomic parity contract define the expected components and interfaces.
**WHEN** This task is implemented.
**THEN** The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `DeleteRouteDialog`, `RenameRouteDialog`, `DeleteFavoriteDialog`, `SaveFavoriteSheet`, `FavoriteExclusionAlert`, `SessionContextMenu`, `NewSessionButton`, `ConnectionBanner`, `PermissionNotification`, `FavoritesInfoSheet`, `PlanningErrorSheet`, `PlanningLoading`, `TogglesContainer`, `SaveRouteConfirmationSheet`.
**Verify:** `printf "%s\n" "`DeleteRouteDialog`, `RenameRouteDialog`, `DeleteFavoriteDialog`, `SaveFavoriteSheet`, `FavoriteExclusionAlert`, `SessionContextMenu`, `NewSessionButton`, `ConnectionBanner`, `PermissionNotification`, `FavoritesInfoSheet`, `PlanningErrorSheet`, `PlanningLoading`, `TogglesContainer`, `SaveRouteConfirmationSheet`"`

### AC-2
**GIVEN** Sprint 2 requires token-only styling and light and dark support.
**WHEN** The task scenarios render in the sandbox.
**THEN** All visuals use the LaneShadow core theme contract from `UI-001` and render correctly in both color modes without hardcoded UI primitives.
**Verify:** `rg -n "Token consumption|light and dark" .spec/prds/native-rewrite/08d-component-parity-spec.md .spec/prds/native-rewrite/08-design-system.md`

### AC-3
**GIVEN** Every translated component must be reviewable before rider-facing wiring resumes.
**WHEN** Sandbox scenarios are registered for this task.
**THEN** Each listed component has deterministic sandbox coverage with RN reference labels and explicit state variants where applicable.
**Verify:** `rg -n "RN reference|scenario|interactive states" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md`

### AC-4
**GIVEN** Parity includes behavior as well as visuals.
**WHEN** The task is validated against the parity spec.
**THEN** Accessibility labels, touch targets, keyboard or safe-area handling, and motion or state parity behave correctly for this component family.
**Verify:** `rg -n "Accessibility|Keyboard handling|RTL support|Animation parity|State parity" .spec/prds/native-rewrite/08d-component-parity-spec.md`

### AC-5
**GIVEN** native-sandbox is installed and the DEBUG variant is running.
**WHEN** `make android_sandbox` launches the sandbox (sends intent extra `com.laneshadow.OPEN_SANDBOX=true` to MainActivity).
**THEN** every component listed in DELIVERABLES has at least one `Story(id = "<tier>.<component>.<state>", tier = ComponentTier.<Tier>, component = "<Name>", name = "<State>", summary = "<rn-reference-path>") { <Composable usage> }` registered in `AppStories.all` and renders in the story-tree drawer under its tier, wrapped by `themedPreview { content -> LaneShadowTheme { content() } }`.

**Launch:** `make android_sandbox` (canonical). Secondary: long-press app root (debug gesture) or `adb shell am start -a android.intent.action.VIEW -d "app-sandbox://sandbox"`.

## TEST CRITERIA

| ID | Maps To | Boolean Statement | Verify |
|---|---|---|---|
| TC-1 | AC-1 | The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `DeleteRouteDialog`, `RenameRouteDialog`, `DeleteFavoriteDialog`, `SaveFavoriteSheet`, `FavoriteExclusionAlert`, `SessionContextMenu`, `NewSessionButton`, `ConnectionBanner`, `PermissionNotification`, `FavoritesInfoSheet`, `PlanningErrorSheet`, `PlanningLoading`, `TogglesContainer`, `SaveRouteConfirmationSheet`. | `printf "%s\n" "`DeleteRouteDialog`, `RenameRouteDialog`, `DeleteFavoriteDialog`, `SaveFavoriteSheet`, `FavoriteExclusionAlert`, `SessionContextMenu`, `NewSessionButton`, `ConnectionBanner`, `PermissionNotification`, `FavoritesInfoSheet`, `PlanningErrorSheet`, `PlanningLoading`, `TogglesContainer`, `SaveRouteConfirmationSheet`"` |
| TC-2 | AC-2 | All visuals use the LaneShadow core theme contract from `UI-001` and render correctly in both color modes without hardcoded UI primitives. | `rg -n "Token consumption\|light and dark" .spec/prds/native-rewrite/08d-component-parity-spec.md .spec/prds/native-rewrite/08-design-system.md` |
| TC-3 | AC-3 | Each listed component has deterministic sandbox coverage with RN reference labels and explicit state variants where applicable. | `rg -n "RN reference\|scenario\|interactive states" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md` |
| TC-4 | AC-4 | Accessibility labels, touch targets, keyboard or safe-area handling, and motion or state parity behave correctly for this component family. | `rg -n "Accessibility\|Keyboard handling\|RTL support\|Animation parity\|State parity" .spec/prds/native-rewrite/08d-component-parity-spec.md` |
| TC-5 | ALL | Repo validation gates remain green for the touched workspace when this task is complete. | `pnpm type-check:native && ./android/gradlew assembleDebug` |

## READING LIST

1. `.spec/prds/native-rewrite/README.md`
2. `.spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md`
3. `.spec/prds/native-rewrite/08a-atomic-component-catalog.md`
4. `.spec/prds/native-rewrite/08d-component-parity-spec.md`
5. `RULES.md`
6. `.spec/prds/native-rewrite/08b-android-component-map.md`

## GUARDRAILS

### WRITE-ALLOWED
- android/app/src/main/java/com/laneshadow/ui/molecules/**
- android/app/src/main/java/com/laneshadow/ui/sandbox/**
- android/app/src/test/java/com/laneshadow/**
- android/app/src/androidTest/java/com/laneshadow/**

### WRITE-PROHIBITED
- ios/**
- server/**
- convex/**
- Any unrelated sprint folders outside .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/**

### MUST
- Follow the parity contract in `.spec/prds/native-rewrite/08d-component-parity-spec.md`.
- Keep sandbox scenarios deterministic and labeled with RN reference paths.
- Limit changes to the component family or sandbox or reporting surface owned by this task.

### MUST NOT
- Do not add backend or auth dependencies just to render scenarios.
- Do not modify unrelated platform directories or downstream sprint artifacts.

## CODE PATTERN

**Reference:** `.spec/prds/native-rewrite/08b-android-component-map.md`

**Pattern:** Single reusable @Composable with variant props or enums, token-backed MaterialTheme access, and sandbox fixture registration.

**Anti-pattern:** Backend-aware composables, duplicated variant files, or hardcoded visual constants.

## TRANSLATION SOURCES

| Component | RN wrapper source | Framework primitives + `node_modules` paths | Native target file | Variants × sizes × states |
|---|---|---|---|---|
| DeleteRouteDialog | `react-native/components/ui/delete-route-dialog.tsx` | `node_modules/react-native-paper/src/components/Dialog/Dialog.tsx`; `node_modules/react-native-paper/src/components/Button/Button.tsx` | `android/app/src/main/java/com/laneshadow/ui/molecules/DeleteRouteDialog.kt` | 1 variant × 2 actions (cancel/confirm) |
| RenameRouteDialog | `react-native/components/ui/rename-route-dialog.tsx` | `node_modules/react-native-paper/src/components/Dialog/Dialog.tsx`; `node_modules/react-native-paper/src/components/TextInput/TextInput.tsx` | `android/app/src/main/java/com/laneshadow/ui/molecules/RenameRouteDialog.kt` | 1 variant × 3 states (idle/valid/invalid) × 2 actions |
| DeleteFavoriteDialog | `react-native/components/ui/delete-favorite-dialog.tsx` | `node_modules/react-native-paper/src/components/Dialog/Dialog.tsx` | `android/app/src/main/java/com/laneshadow/ui/molecules/DeleteFavoriteDialog.kt` | 1 variant × 2 actions (cancel/confirm) |
| SaveFavoriteSheet | `react-native/components/ui/save-favorite-sheet.tsx` | `node_modules/@gorhom/bottom-sheet/src/components/bottomSheet/BottomSheet.tsx`; `node_modules/react-native-paper/src/components/TextInput/TextInput.tsx` | `android/app/src/main/java/com/laneshadow/ui/molecules/SaveFavoriteSheet.kt` | 1 variant × 3 states (idle/saving/error) |
| FavoriteExclusionAlert | `react-native/components/ui/favorite-exclusion-alert.tsx` | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/FavoriteExclusionAlert.kt` | 1 variant × auto-dismiss (10s) |
| SessionContextMenu | `react-native/components/ui/session-context-menu.tsx` | `node_modules/react-native/Libraries/Modal/Modal.js`; `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/SessionContextMenu.kt` | Modal positioned menu × N items × destructive variant |
| NewSessionButton | `react-native/components/ui/new-session-button.tsx` | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/NewSessionButton.kt` | 3 variants (header/fab/text) × 3 sizes (sm/md/lg) × 2 states (idle/disabled) |
| ConnectionBanner | `react-native/components/ui/connection-banner.tsx` | `node_modules/react-native/Libraries/Components/View/View.js` | `android/app/src/main/java/com/laneshadow/ui/molecules/ConnectionBanner.kt` | 1 fixed variant |
| PermissionNotification | `react-native/components/ui/permission-notification.tsx` | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`; `node_modules/react-native-safe-area-context/src/NativeSafeAreaProvider.tsx` | `android/app/src/main/java/com/laneshadow/ui/molecules/PermissionNotification.kt` | 1 variant × optional action button × safe-area top |
| FavoritesInfoSheet | `react-native/components/sheets/favorites-info-sheet.tsx` | `node_modules/@gorhom/bottom-sheet/src/components/bottomSheet/BottomSheet.tsx` | `android/app/src/main/java/com/laneshadow/ui/molecules/FavoritesInfoSheet.kt` | 1 variant × list content |
| PlanningErrorSheet | `react-native/components/sheets/planning-error-sheet.tsx` | `node_modules/@gorhom/bottom-sheet/src/components/bottomSheet/BottomSheet.tsx` | `android/app/src/main/java/com/laneshadow/ui/molecules/PlanningErrorSheet.kt` | 1 variant × 2 actions (try again/back) |
| PlanningLoading | `react-native/components/sheets/planning-loading.tsx` | `node_modules/react-native/Libraries/Components/View/View.js`; `node_modules/react-native-paper/src/components/ActivityIndicator/ActivityIndicator.tsx` | `android/app/src/main/java/com/laneshadow/ui/molecules/PlanningLoading.kt` | Full-screen scrim × activity indicator × cancel button |
| TogglesContainer | `react-native/components/sheets/toggles-container.tsx` | `node_modules/react-native/Libraries/Components/View/View.js`; Switch atom | `android/app/src/main/java/com/laneshadow/ui/molecules/TogglesContainer.kt` | 2 toggles (avoid highways/avoid tolls) × icon containers |
| SaveRouteConfirmationSheet | `react-native/components/sheets/save-route-confirmation-sheet.tsx` | `node_modules/@gorhom/bottom-sheet/src/components/bottomSheet/BottomSheet.tsx`; `node_modules/react-native-paper/src/components/TextInput/TextInput.tsx` | `android/app/src/main/java/com/laneshadow/ui/molecules/SaveRouteConfirmationSheet.kt` | 1 variant × 3 states (idle/saving/error) |

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowOffset=0/2 shadowOpacity=0.05 shadowRadius=4 androidElevation=2. **Paper labelLarge**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=14, lineHeight=20, letterSpacing=0.1. **Paper labelSmall**: fontFamily=sans-serif-medium, fontWeight=500, fontSize=11, lineHeight=16, letterSpacing=0.5. **semantic.type.label.md**: fontSize=14, lineHeight=20, fontWeight=500. **semantic.type.body.sm**: fontSize=14, lineHeight=21, fontWeight=400.

### DeleteRouteDialog

**Source files read:**
- LaneShadow: `react-native/components/ui/delete-route-dialog.tsx`
- Framework: `node_modules/react-native-paper/src/components/Dialog/Dialog.tsx`, `node_modules/react-native-paper/src/components/Button/Button.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | backgroundColor | RN-wrapper | `color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| Layout | Dialog padding | Paper Dialog | default padding | `AlertDialog` or `Dialog` padding | `.padding()` | ESCALATE — Paper default |
| Typography — title | fontSize | Paper Dialog.Title | 20 (headlineSmall) | `MaterialTheme.typography.headlineSmall.fontSize` | `.font(.title3)` | `type.headline.sm.fontSize` |
| Typography — title | fontWeight | Paper Dialog.Title | 400 (regular) | `MaterialTheme.typography.headlineSmall.fontWeight` | `.regular` | `type.headline.sm.fontWeight` |
| Typography — title | color | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography — content | fontSize | Paper Text | 16 (bodyMedium) | `MaterialTheme.typography.bodyMedium.fontSize` | `.font(.body)` | `type.body.md.fontSize` |
| Typography — content | color | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Visual — cancel button | textColor | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Visual — confirm button | textColor | RN-wrapper | `color.danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |
| Interaction | accessibilityRole | RN-wrapper | n/a (Dialog) | `Modifier.semantics { role = Role.AlertDialog }` | `.accessibilityAddTraits(.isStaticText)` | n/a |

---

### RenameRouteDialog

**Source files read:**
- LaneShadow: `react-native/components/ui/rename-route-dialog.tsx`
- Framework: `node_modules/react-native-paper/src/components/Dialog/Dialog.tsx`, `node_modules/react-native-paper/src/components/TextInput/TextInput.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | backgroundColor | RN-wrapper | `color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| Typography — title | color | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Visual — TextInput | outlineColor | RN-wrapper | `color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| Visual — TextInput | activeOutlineColor | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Visual — TextInput | textColor | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Visual — cancel button | textColor | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Visual — save button | textColor (enabled) | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Visual — save button | textColor (disabled) | RN-wrapper | `color.onSurface.disabled` | `LaneShadowTheme.colors.onSurfaceDisabled` | `theme.colors.onSurfaceDisabled` | `color.onSurface.disabled` |
| Interaction | maxLength | RN-wrapper | 100 | `maxLength = 100` | `maxLength: 100` | n/a |
| Interaction | autoFocus | RN-wrapper | true | `Modifier.focusRequester()` | `@FocusState` | n/a |

---

### DeleteFavoriteDialog

**Source files read:**
- LaneShadow: `react-native/components/ui/delete-favorite-dialog.tsx`
- Framework: `node_modules/react-native-paper/src/components/Dialog/Dialog.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | backgroundColor | RN-wrapper | `color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| Typography — title | color | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography — content | color | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Visual — cancel button | textColor | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Visual — delete button | textColor | RN-wrapper | `color.danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |

---

### SaveFavoriteSheet

**Source files read:**
- LaneShadow: `react-native/components/ui/save-favorite-sheet.tsx`
- Framework: `node_modules/@gorhom/bottom-sheet/src/components/bottomSheet/BottomSheet.tsx`, `node_modules/react-native-paper/src/components/TextInput/TextInput.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | container padding | RN-wrapper | 16 | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |
| Layout | gap | RN-wrapper | 16 | `Arrangement.spacedBy(16.dp)` | `Spacer(minLength: 16)` | `space.lg` |
| Layout | paddingBottom | RN-wrapper | 32 | `Modifier.padding(bottom = 32.dp)` | `.padding(.bottom, 32)` | ESCALATE — `space.4xl = 64` too large; propose `space.3xl = 48` or use `2xl + md = 44` |
| Typography — title | variant | RN-wrapper | headlineSmall | `MaterialTheme.typography.headlineSmall` | `.font(.title3)` | `type.headline.sm` |
| Typography — title | color | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography — caption | variant | RN-wrapper | bodyMedium | `MaterialTheme.typography.bodyMedium` | `.font(.body)` | `type.body.md` |
| Typography — caption | color | RN-wrapper | `color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceVariant` | `theme.colors.onSurfaceVariant` | `color.onSurface.subtle` |
| Typography — error | color | RN-wrapper | `color.danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |
| Visual | snapPoints | RN-wrapper | `['60%', '90%'] | `BottomSheetScaffold` or similar | `presentationDetents([.medium, .large])` | n/a |
| Visual | hasTextInput | RN-wrapper | true | `BottomSheet` keyboard behavior | `.presentationDetents` with keyboard | n/a |
| Interaction | maxLength | RN-wrapper | 100 | `maxLength = 100` | `maxLength: 100` | n/a |
| Interaction | autoFocus | RN-wrapper | true | `Modifier.focusRequester()` | `@FocusState` | n/a |

---

### FavoriteExclusionAlert

**Source files read:**
- LaneShadow: `react-native/components/ui/favorite-exclusion-alert.tsx`
- Framework: `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | marginHorizontal | RN-wrapper | `space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| Layout | marginTop | RN-wrapper | `space.sm` = 8 | `Modifier.padding(top = 8.dp)` | `.padding(.top, 8)` | `space.sm` |
| Layout | marginBottom | RN-wrapper | `space.md` = 12 | `Modifier.padding(bottom = 12.dp)` | `.padding(.bottom, 12)` | `space.md` |
| Layout | padding | RN-wrapper | `space.md` = 12 | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |
| Layout | borderRadius | RN-wrapper | `radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| Layout | borderWidth | RN-wrapper | 1 | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1` |
| Visual | backgroundColor | RN-wrapper | `color.warningContainer.default` | `LaneShadowTheme.colors.warningContainer` | `theme.colors.warningContainer` | `color.warningContainer.default` |
| Visual | borderColor | RN-wrapper | `color.warning.default` | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |
| Typography — title | variant | RN-wrapper | titleSmall | `MaterialTheme.typography.titleSmall` | `.font(.headline)` | `type.title.sm` |
| Typography — title | fontWeight | RN-wrapper | 600 | `FontWeight.SemiBold` | `.semibold` | ESCALATE — `type.title.sm.fontWeight = 600` |
| Typography — title | color | RN-wrapper | `color.onWarningContainer.default` | `LaneShadowTheme.colors.onWarningContainer` | `theme.colors.onWarningContainer` | `color.onWarningContainer.default` |
| Typography — body | variant | RN-wrapper | bodyMedium | `MaterialTheme.typography.bodyMedium` | `.font(.body)` | `type.body.md` |
| Typography — body | color | RN-wrapper | `color.onWarningContainer.default` | `LaneShadowTheme.colors.onWarningContainer` | `theme.colors.onWarningContainer` | `color.onWarningContainer.default` |
| Layout — icon | size | RN-wrapper | 20 | `20.dp` | `20` | ESCALATE — `iconSize.sm = 20` |
| Layout — icon | marginRight | RN-wrapper | 12 | `Modifier.padding(end = 12.dp)` | `.padding(.trailing, 12)` | ESCALATE — `space.md = 12` ✓ |
| Layout — icon | marginTop | RN-wrapper | 2 | `Modifier.padding(top = 2.dp)` | `.padding(.top, 2)` | ESCALATE — `space.xs = 4` / 2 = 2 |
| Layout — text gap | RN-wrapper | `space.xs` = 4 | `Arrangement.spacedBy(4.dp)` | `Spacer(minLength: 4)` | `space.xs` |
| Layout — dismiss hitSlop | RN-wrapper | 8 all sides | `Modifier.pointerHoverIcon` | `.hitSlop` / `contentShape` | ESCALATE — `hitSlop.md = 8` |
| Interaction | autoDismiss | RN-wrapper | 10000ms | `LaunchedEffect` delay | `.task` delay | n/a |
| Interaction | accessibilityRole | RN-wrapper | `'alert'` | `Modifier.semantics { role = Role.Alert }` | `.accessibilityAddTraits(.isStaticText)` | n/a |

---

### SessionContextMenu

**Source files read:**
- LaneShadow: `react-native/components/ui/session-context-menu.tsx`
- Framework: `node_modules/react-native/Libraries/Modal/Modal.js`, `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | MENU_WIDTH | RN-wrapper | 180 | `180.dp` | `180` | ESCALATE — propose `size.menuWidth = 180` |
| Layout | MENU_ITEM_HEIGHT | RN-wrapper | 48 | `48.dp` | `48` | ESCALATE — propose `size.menuItemHeight = 48` |
| Layout | borderRadius | RN-wrapper | 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| Layout | paddingHorizontal | RN-wrapper | 16 | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| Layout | gap | RN-wrapper | 12 | `Arrangement.spacedBy(12.dp)` | `Spacer(minLength: 12)` | ESCALATE — `space.md = 12` ✓ |
| Visual | backgroundColor | RN-wrapper | `theme.colors.surface` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| Visual — shadow (iOS) | shadowColor | RN-wrapper | `#000` | n/a | `.shadow(color: .black)` | n/a |
| Visual — shadow (iOS) | shadowOffset | RN-wrapper | `{width: 0, height: 4}` | n/a | `y: 4` | ESCALATE — `shadow.menuOffset = 4` |
| Visual — shadow (iOS) | shadowOpacity | RN-wrapper | 0.15 | n/a | `opacity: 0.15` | ESCALATE — `opacity.shadow = 0.15` |
| Visual — shadow (iOS) | shadowRadius | RN-wrapper | 8 | n/a | `radius: 8` | ESCALATE — `shadow.menuRadius = 8` |
| Visual — shadow (Android) | elevation | RN-wrapper | 8 | `Modifier.shadow(elevation = 8.dp)` | n/a | ESCALATE — `elevation.menu = 8` |
| Visual — backdrop | backgroundColor | RN-wrapper | `rgba(0, 0, 0, 0.3)` | `Color.Black.copy(alpha = 0.3f)` | `.black.opacity(0.3)` | ESCALATE — `color.scrim.default = rgba(0,0,0,0.3)` |
| Visual — border | borderBottomWidth | RN-wrapper | `StyleSheet.hairlineWidth` | `1.dp` | `0.5` (Hairline) | ESCALATE — `borderWidth.hairline = 0.5` |
| Visual — border | borderBottomColor | RN-wrapper | `theme.colors.outlineVariant` | `LaneShadowTheme.colors.outlineVariant` | `theme.colors.outlineVariant` | `color.border.subtle` |
| Typography | fontSize | RN-wrapper | 15 | `15.sp` | `15` | ESCALATE — `type.body.md.fontSize = 15` |
| Typography — icon | size | RN-wrapper | 20 | `20.dp` | `20` | ESCALATE — `iconSize.sm = 20` |
| Typography — destructive color | RN-wrapper | `theme.colors.error` | `LaneShadowTheme.colors.error` | `theme.colors.error` | `color.danger.default` |
| Typography — default color | RN-wrapper | `theme.colors.onSurface` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Visual — pressed | backgroundColor | RN-wrapper | `rgba(0, 0, 0, 0.05)` | `Color.Black.copy(alpha = 0.05f)` | `.black.opacity(0.05)` | ESCALATE — `color.pressedOverlay = rgba(0,0,0,0.05)` |
| Interaction | accessibilityRole | RN-wrapper | n/a | `Modifier.semantics { role = Role.MenuItem }` | `.accessibilityAddTraits(.isButton)` | n/a |

---

### NewSessionButton

**Source files read:**
- LaneShadow: `react-native/components/ui/new-session-button.tsx`
- Framework: `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout — fab (sm) | size | RN-wrapper | 48 | `48.dp` | `48` | ESCALATE — `space.3xl = 48` ✓ |
| Layout — fab (md) | size | RN-wrapper | 56 | `56.dp` | `56` | ESCALATE — propose `space.4xl = 56` |
| Layout — fab (lg) | size | RN-wrapper | 64 | `64.dp` | `64` | ESCALATE — propose `space.5xl = 64` |
| Layout — fab (sm) | borderRadius | RN-wrapper | 24 | `CircleShape` | `Circle()` | `radius.full` ✓ (9999/2 = 24) |
| Layout — fab (md) | borderRadius | RN-wrapper | 28 | `RoundedCornerShape(28.dp)` | `RoundedRectangle(cornerRadius: 28)` | ESCALATE — propose `radius.xxl = 28` |
| Layout — fab (lg) | borderRadius | RN-wrapper | 32 | `RoundedCornerShape(32.dp)` | `RoundedRectangle(cornerRadius: 32)` | `radius.2xl` |
| Layout — fab position | bottom | RN-wrapper | 24 | `Modifier.padding(bottom = 24.dp)` | `.padding(.bottom, 24)` | `space.xl` |
| Layout — fab position | right | RN-wrapper | 24 | `Modifier.padding(end = 24.dp)` | `.padding(.trailing, 24)` | `space.xl` |
| Layout — text variant gap | RN-wrapper | 8 | `Arrangement.spacedBy(8.dp)` | `Spacer(minLength: 8)` | `space.sm` |
| Layout — header variant gap | RN-wrapper | 6 | `Arrangement.spacedBy(6.dp)` | `Spacer(minLength: 6)` | ESCALATE — `space.xs = 4` / 6 |
| Visual — fab (enabled) | backgroundColor | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Visual — fab (pressed) | backgroundColor | RN-wrapper | `color.primary.pressed` | `LaneShadowTheme.colors.primaryPressed` | `theme.colors.primaryPressed` | `color.primary.pressed` |
| Visual — fab (disabled) | backgroundColor | RN-wrapper | `color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| Visual — fab (disabled) | opacity | RN-wrapper | 0.5 | `Modifier.alpha(0.5f)` | `.opacity(0.5)` | ESCALATE — `opacity.disabled = 0.5` |
| Visual — elevation | RN-wrapper | `elevation[4]` | `Modifier.shadow(elevation = 4.dp)` | `.shadow(radius: 8, y: 8)` | `elevation[4]` |
| Typography — icon (sm) | size | RN-wrapper | 20 | `20.dp` | `20` | ESCALATE — `iconSize.sm = 20` |
| Typography — icon (md) | size | RN-wrapper | 24 | `24.dp` | `24` | ESCALATE — `iconSize.md = 24` |
| Typography — icon (lg) | size | RN-wrapper | 28 | `28.dp` | `28` | ESCALATE — `iconSize.lg = 28` |
| Typography — text (sm) | fontSize | RN-wrapper | 13 | `13.sp` | `13` | ESCALATE — `type.label.sm.fontSize = 13` |
| Typography — text (md) | fontSize | RN-wrapper | 14 | `14.sp` | `14` | `type.label.md.fontSize` |
| Typography — text (lg) | fontSize | RN-wrapper | 16 | `16.sp` | `16` | `type.body.md.fontSize` |
| Typography — text (enabled) | color | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Typography — text (disabled) | color | RN-wrapper | `color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceVariant` | `theme.colors.onSurfaceVariant` | `color.onSurface.subtle` |
| Typography — header (enabled) | color | RN-wrapper | `color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceVariant` | `theme.colors.onSurfaceVariant` | `color.onSurface.muted` |
| Typography — header (disabled) | color | RN-wrapper | `color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceVariant` | `theme.colors.onSurfaceVariant` | `color.onSurface.subtle` |
| Typography — icon (enabled) | color | RN-wrapper | `color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| Typography — icon (disabled) | color | RN-wrapper | `color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceVariant` | `theme.colors.onSurfaceVariant` | `color.onSurface.subtle` |
| Interaction | accessibilityRole | RN-wrapper | `'button'` | `Modifier.semantics { role = Role.Button }` | `.accessibilityAddTraits(.isButton)` | n/a |

---

### ConnectionBanner

**Source files read:**
- LaneShadow: `react-native/components/ui/connection-banner.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| Layout | padding | RN-wrapper | `space.md` = 12 | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |
| Visual | backgroundColor | RN-wrapper | `color.warning.default` | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |
| Typography | variant | RN-wrapper | bodySmall | `MaterialTheme.typography.bodySmall` | `.font(.caption)` | `type.body.sm` |
| Typography | color | RN-wrapper | `color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| Typography | textAlign | RN-wrapper | `'center'` | `TextStyle(textAlign = TextAlign.Center)` | `.multilineTextAlignment(.center)` | n/a |

---

### PermissionNotification

**Source files read:**
- LaneShadow: `react-native/components/ui/permission-notification.tsx`
- Framework: `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`, `node_modules/react-native-safe-area-context/src/NativeSafeAreaProvider.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | borderRadius | RN-wrapper | `radius.lg` = 16 | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |
| Layout | marginTop | RN-wrapper | `insets.top + space.sm` | `Modifier.padding(top = (insets.top + 8).dp)` | `.padding(.top, insets.top + 8)` | `space.sm` + insets |
| Layout | marginHorizontal | RN-wrapper | `space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| Layout | padding | RN-wrapper | `space.md` = 12 | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |
| Layout | gap | RN-wrapper | `space.xs` = 4 | `Arrangement.spacedBy(4.dp)` | `Spacer(minLength: 4)` | `space.xs` |
| Layout — header gap | RN-wrapper | `space.sm` = 8 | `Arrangement.spacedBy(8.dp)` | `Spacer(minLength: 8)` | `space.sm` |
| Visual | backgroundColor | RN-wrapper | `color.warning.default` | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |
| Visual — shadow | shadowColor | RN-wrapper | `#000000` | `Color.Black` | `.black` | n/a |
| Visual — shadow | shadowOffset | RN-wrapper | `{width: 0, height: 4}` | `Modifier.shadow(offset = yOffset)` | `y: 4` | ESCALATE — `shadow.menuOffset = 4` |
| Visual — shadow | shadowOpacity | RN-wrapper | 0.15 | `Modifier.shadow(alpha = 0.15f)` | `opacity: 0.15` | ESCALATE — `opacity.shadow = 0.15` |
| Visual — shadow | shadowRadius | RN-wrapper | 8 | `Modifier.shadow(radius = 8.dp)` | `radius: 8` | ESCALATE — `shadow.menuRadius = 8` |
| Visual — shadow | elevation (Android) | RN-wrapper | 4 | `Modifier.shadow(elevation = 4.dp)` | n/a | `elevation[4]` |
| Typography — title | variant | RN-wrapper | titleSmall | `MaterialTheme.typography.titleSmall` | `.font(.headline)` | `type.title.sm` |
| Typography — title | color | RN-wrapper | `color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| Typography — description | variant | RN-wrapper | bodySmall | `MaterialTheme.typography.bodySmall` | `.font(.caption)` | `type.body.sm` |
| Typography — description | color | RN-wrapper | `color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| Typography — action | variant | RN-wrapper | labelMedium | `MaterialTheme.typography.labelMedium` | `.font(.subheadline)` | `type.label.md` |
| Typography — action | fontWeight | RN-wrapper | 600 | `FontWeight.SemiBold` | `.semibold` | ESCALATE — `type.label.md.fontWeight = 600` |
| Typography — action | color | RN-wrapper | `color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| Visual — action button | backgroundColor (pressed) | RN-wrapper | `${color.onPrimary.default}30` | `LaneShadowTheme.colors.onPrimary.copy(alpha = 0.3f)` | `theme.colors.onPrimary.opacity(0.3)` | ESCALATE — `color.actionPressed = 30% alpha` |
| Visual — action button | backgroundColor (idle) | RN-wrapper | `${color.onPrimary.default}20` | `LaneShadowTheme.colors.onPrimary.copy(alpha = 0.2f)` | `theme.colors.onPrimary.opacity(0.2)` | ESCALATE — `color.actionIdle = 20% alpha` |
| Visual — action button | borderRadius | RN-wrapper | `radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| Visual — action button | padding | RN-wrapper | `space.sm` = 8 | `Modifier.padding(8.dp)` | `.padding(8)` | `space.sm` |
| Visual — action button | marginTop | RN-wrapper | `space.xs` = 4 | `Modifier.padding(top = 4.dp)` | `.padding(.top, 4)` | `space.xs` |
| Typography — icon | size | RN-wrapper | 20 | `20.dp` | `20` | ESCALATE — `iconSize.sm = 20` |
| Layout — icon gap | RN-wrapper | `space.sm` = 8 | `Arrangement.spacedBy(8.dp)` | `Spacer(minLength: 8)` | `space.sm` |
| Interaction | accessibilityRole | RN-wrapper | n/a | `Modifier.semantics { role = Role.Alert }` | `.accessibilityAddTraits(.isStaticText)` | n/a |

---

### FavoritesInfoSheet

**Source files read:**
- LaneShadow: `react-native/components/sheets/favorites-info-sheet.tsx`
- Framework: `node_modules/@gorhom/bottom-sheet/src/components/bottomSheet/BottomSheet.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | padding | RN-wrapper | `space.lg` = 16 | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |
| Layout | gap | RN-wrapper | `space.md` = 12 | `Arrangement.spacedBy(12.dp)` | `Spacer(minLength: 12)` | `space.md` |
| Layout — icon container | padding | RN-wrapper | `space.md` = 12 | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |
| Layout — icon container | borderRadius | RN-wrapper | `radius.full` | `CircleShape` | `Circle()` | `radius.full` |
| Layout — icon container | backgroundColor | RN-wrapper | `rgba(color.primary.default, 0.15)` | `LaneShadowTheme.colors.primary.copy(alpha = 0.15f)` | `theme.colors.primary.opacity(0.15)` | ESCALATE — `color.primaryContainer = 15% alpha` |
| Typography — icon | size | RN-wrapper | 32 | `32.dp` | `32` | ESCALATE — `iconSize.xl = 32` |
| Typography — title | variant | RN-wrapper | titleMedium | `MaterialTheme.typography.titleMedium` | `.font(.title2)` | `type.title.md` |
| Typography — title | color | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography — message | variant | RN-wrapper | bodyMedium | `MaterialTheme.typography.bodyMedium` | `.font(.body)` | `type.body.md` |
| Typography — message | color | RN-wrapper | `color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceVariant` | `theme.colors.onSurfaceVariant` | `color.onSurface.muted` |
| Typography — message | lineHeight | RN-wrapper | 22 | `22.sp` | `.lineSpacing(22 - 16)` = 6 | ESCALATE — `type.body.md.lineHeight = 22` |
| Layout — list | backgroundColor | RN-wrapper | `rgba(color.surface.default, 0.5)` | `LaneShadowTheme.colors.surface.copy(alpha = 0.5f)` | `theme.colors.surface.opacity(0.5)` | ESCALATE — `color.surfaceOverlay = 50% alpha` |
| Layout — list | borderRadius | RN-wrapper | `radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| Layout — list | padding | RN-wrapper | `space.md` = 12 | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |
| Layout — list | gap | RN-wrapper | `space.sm` = 8 | `Arrangement.spacedBy(8.dp)` | `Spacer(minLength: 8)` | `space.sm` |
| Typography — list item | variant | RN-wrapper | bodyMedium | `MaterialTheme.typography.bodyMedium` | `.font(.body)` | `type.body.md` |
| Typography — list item | color | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography — guidance | variant | RN-wrapper | bodySmall | `MaterialTheme.typography.bodySmall` | `.font(.caption)` | `type.body.sm` |
| Typography — guidance | color | RN-wrapper | `color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceVariant` | `theme.colors.onSurfaceVariant` | `color.onSurface.muted` |
| Typography — guidance | lineHeight | RN-wrapper | 20 | `20.sp` | `.lineSpacing(20 - 14)` = 6 | ESCALATE — `type.body.sm.lineHeight = 20` |
| Visual | snapPoints | RN-wrapper | `['60%']` | `BottomSheetScaffold` or similar | `presentationDetents([.medium])` | n/a |

---

### PlanningErrorSheet

**Source files read:**
- LaneShadow: `react-native/components/sheets/planning-error-sheet.tsx`
- Framework: `node_modules/@gorhom/bottom-sheet/src/components/bottomSheet/BottomSheet.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | gap | RN-wrapper | `space.md` = 12 | `Arrangement.spacedBy(12.dp)` | `Spacer(minLength: 12)` | `space.md` |
| Layout — header gap | RN-wrapper | `space.xs` = 4 | `Arrangement.spacedBy(4.dp)` | `Spacer(minLength: 4)` | `space.xs` |
| Layout — actions gap | RN-wrapper | `space.sm` = 8 | `Arrangement.spacedBy(8.dp)` | `Spacer(minLength: 8)` | `space.sm` |
| Typography — title | variant | RN-wrapper | titleMedium | `MaterialTheme.typography.titleMedium` | `.font(.title2)` | `type.title.md` |
| Typography — title | color | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography — message | variant | RN-wrapper | bodyMedium | `MaterialTheme.typography.bodyMedium` | `.font(.body)` | `type.body.md` |
| Typography — message | color | RN-wrapper | `color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceVariant` | `theme.colors.onSurfaceVariant` | `color.onSurface.muted` |

---

### PlanningLoading

**Source files read:**
- LaneShadow: `react-native/components/sheets/planning-loading.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native-paper/src/components/ActivityIndicator/ActivityIndicator.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | position | RN-wrapper | `'absolute'` full screen | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Layout | zIndex | RN-wrapper | 1000 | `Modifier.zIndex(1000)` | `.zIndex(1000)` | n/a |
| Visual | backgroundColor | RN-wrapper | `color.scrim.default` | `LaneShadowTheme.colors.scrim` | `theme.colors.scrim` | `color.scrim.default` |
| Layout | gap | RN-wrapper | `space.lg` = 16 | `Arrangement.spacedBy(16.dp)` | `Spacer(minLength: 16)` | `space.lg` |
| Visual — indicator | size | RN-wrapper | `space.xl` = 24 | `24.dp` | `24` | `space.xl` |
| Visual — indicator | color | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Typography | variant | RN-wrapper | bodyMedium | `MaterialTheme.typography.bodyMedium` | `.font(.body)` | `type.body.md` |
| Typography | color | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Interaction | accessibilityRole | RN-wrapper | `'progressbar'` | `Modifier.semantics { role = Role.ProgressBar }` | `.accessibilityAddTraits(.updatesFrequently)` | n/a |

---

### TogglesContainer

**Source files read:**
- LaneShadow: `react-native/components/sheets/toggles-container.tsx`
- Framework: `node_modules/react-native/Libraries/Components/View/View.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | backgroundColor | RN-wrapper | `color.input.default` | `LaneShadowTheme.colors.input` | `theme.colors.input` | `color.input.default` |
| Layout | borderRadius | RN-wrapper | `radius.lg` = 16 | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |
| Layout | borderWidth | RN-wrapper | 1 | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | ESCALATE — propose `borderWidth.thin = 1` |
| Layout | borderColor | RN-wrapper | `color.divider.default` | `LaneShadowTheme.colors.divider` | `theme.colors.divider` | `color.divider.default` |
| Layout | overflow | RN-wrapper | `'hidden'` | `Modifier.clip(shape)` | `.clipped()` | n/a |
| Layout — row | paddingHorizontal | RN-wrapper | `space.lg` = 16 | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| Layout — row | paddingVertical | RN-wrapper | `space.lg` = 16 | `Modifier.padding(vertical = 16.dp)` | `.padding(.vertical, 16)` | `space.lg` |
| Layout — row | borderBottomWidth | RN-wrapper | 1 | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | ESCALATE — same as above |
| Layout — row | borderBottomColor | RN-wrapper | `color.divider.default` | `LaneShadowTheme.colors.divider` | `theme.colors.divider` | `color.divider.default` |
| Layout — icon container | size | RN-wrapper | 32 | `32.dp` | `32` | ESCALATE — `iconSize.lg = 32` |
| Layout — icon container | borderRadius | RN-wrapper | `radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| Layout — icon container | backgroundColor | RN-wrapper | `color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| Typography — label | variant | RN-wrapper | bodyMedium | `MaterialTheme.typography.bodyMedium` | `.font(.body)` | `type.body.md` |
| Typography — label | fontWeight | RN-wrapper | 500 | `FontWeight.Medium` | `.medium` | `type.label.md.fontWeight` |
| Typography — label | color | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography — icon | size | RN-wrapper | 20 | `20.dp` | `20` | ESCALATE — `iconSize.sm = 20` |
| Typography — icon | color | RN-wrapper | `color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceVariant` | `theme.colors.onSurfaceVariant` | `color.onSurface.muted` |
| Layout — label gap | RN-wrapper | 12 | `Arrangement.spacedBy(12.dp)` | `Spacer(minLength: 12)` | ESCALATE — `space.md = 12` ✓ |

---

### SaveRouteConfirmationSheet

**Source files read:**
- LaneShadow: `react-native/components/sheets/save-route-confirmation-sheet.tsx`
- Framework: `node_modules/@gorhom/bottom-sheet/src/components/bottomSheet/BottomSheet.tsx`, `node_modules/react-native-paper/src/components/TextInput/TextInput.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | gap | RN-wrapper | 16 | `Arrangement.spacedBy(16.dp)` | `Spacer(minLength: 16)` | `space.lg` |
| Layout — header | gap | RN-wrapper | 12 | `Arrangement.spacedBy(12.dp)` | `Spacer(minLength: 12)` | ESCALATE — `space.md = 12` ✓ |
| Layout — icon container | size | RN-wrapper | 44 | `44.dp` | `44` | ESCALATE — propose `iconSize.xxl = 44` |
| Layout — icon container | borderRadius | RN-wrapper | 22 (half of 44) | `CircleShape` | `Circle()` | `radius.full` ✓ (9999/2 = 22) |
| Layout — icon container | backgroundColor | RN-wrapper | `rgba(184, 115, 50, 0.12)` | `Color(0xB87332).copy(alpha = 0.12f)` | `Color(red: 0.72, green: 0.45, blue: 0.20).opacity(0.12)` | ESCALATE — propose `color.primaryGlow = rgba(184,115,50,0.12)` |
| Typography — icon | size | RN-wrapper | 28 | `28.dp` | `28` | ESCALATE — `iconSize.xl = 28` |
| Typography — title | variant | RN-wrapper | titleLarge | `MaterialTheme.typography.titleLarge` | `.font(.title)` | `type.title.lg` |
| Typography — title | color | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography — description | variant | RN-wrapper | bodyMedium | `MaterialTheme.typography.bodyMedium` | `.font(.body)` | `type.body.md` |
| Typography — description | color | RN-wrapper | `color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceVariant` | `theme.colors.onSurfaceVariant` | `color.onSurface.subtle` |
| Typography — description | lineHeight | RN-wrapper | 22 | `22.sp` | `.lineSpacing(22 - 16)` = 6 | ESCALATE — `type.body.md.lineHeight = 22` |
| Layout — input section | marginTop | RN-wrapper | 4 | `Modifier.padding(top = 4.dp)` | `.padding(.top, 4)` | `space.xs` |
| Layout — actions | gap | RN-wrapper | 12 | `Arrangement.spacedBy(12.dp)` | `Spacer(minLength: 12)` | ESCALATE — `space.md = 12` ✓ |
| Layout — actions | marginTop | RN-wrapper | 8 | `Modifier.padding(top = 8.dp)` | `.padding(.top, 8)` | `space.sm` |
| Layout — cancel button | flex | RN-wrapper | 1 | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |
| Layout — confirm button | flex | RN-wrapper | 1.5 | `Modifier.weight(1.5f)` | `.layoutPriority(1.5)` | n/a |
| Visual | hasTextInput | RN-wrapper | true | `BottomSheet` keyboard behavior | `.presentationDetents` with keyboard | n/a |
| Interaction | editable | RN-wrapper | `!isSaving` | `enabled = !isSaving` | `.disabled(isSaving)` | n/a |

## DESIGN NOTES

- Preserve RN spacing, composition hierarchy, and edge-case fixtures such as long labels, loading, and error states.
- Define detents, handles, scrim, keyboard avoidance, and safe-area behavior explicitly.
- Avoid unstyled Material defaults and route all styling through the documented Compose theme layer.

## VERIFICATION GATES

- pnpm type-check:native
- ./android/gradlew assembleDebug
- Validate sandbox scenarios for this task in the native sandbox host

## DEPENDENCIES

- UI-013

## CODING STANDARDS

- .spec/prds/native-rewrite/08d-component-parity-spec.md — naming, interface, token, state, animation, accessibility, keyboard, and RTL parity
- .spec/prds/native-rewrite/08-design-system.md — token generation and consumption rules
- ~/Projects/brain/docs/TDD-METHODOLOGY.md — RED/GREEN/REFACTOR evidence expectations

## OUT OF SCOPE

- Feature wiring beyond sandbox-ready component translation.
- Changes to unrelated sprints or backend and server code.

---

## Native Sandbox Integration (added 2026-04-18)

`native-sandbox` is installed as a Gradle composite build (`com.nativesandbox:library` via `includeBuild("../../native-sandbox/android")` with `debugImplementation`).

### Sandbox Deliverables (in addition to the component sources above)

- `android/app/src/debug/java/com/laneshadow/sandbox/stories/<ComponentGroup>Stories.kt` — debug-only story set; `object` with `val all: List<Story>`, aggregated into `AppStories.all` at `android/app/src/debug/java/com/laneshadow/sandbox/stories/AppStories.kt`.

### Sandbox Acceptance Criterion

**GIVEN** the native-sandbox Gradle composite build is wired and the DEBUG variant is built.
**WHEN** the reviewer runs `make android_sandbox` (or triggers the long-press gesture / sends intent extra `com.laneshadow.OPEN_SANDBOX=true`).
**THEN** every component named in DELIVERABLES has at least one registered `Story(id = "<tier>.<component>.<state>", tier = ComponentTier.<Tier>, component = "<Name>", name = "<State>", summary = "<rn-reference-path>") { <Composable usage> }` appearing in the sandbox story-tree drawer, wrapped by `previewWrapper = themedPreview { content -> LaneShadowTheme { content() } }` so the preview canvas inherits LaneShadow tokens while chrome stays neutral.

### Reviewer Launch

- **Primary:** `make android_sandbox` (from repo root) — builds debug APK, installs, launches MainActivity with the sandbox intent extra.
- **Secondary:** long-press app root (debug-only gesture), or `adb shell am start -a android.intent.action.VIEW -d "app-sandbox://sandbox"`.

### Contract references

- `com.nativesandbox.model.Story` — `id`, `tier` (ComponentTier), `component`, `name`, `summary`, `content: @Composable`.
- `com.nativesandbox.views.SandboxRoot` — entry composable; receives `stories`, optional `themeController`, `previewWrapper`.
- Chrome is theme-neutral by design; only the preview canvas is re-themed via `previewWrapper`.
