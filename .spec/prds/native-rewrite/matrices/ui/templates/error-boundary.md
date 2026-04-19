# ErrorBoundary — STYLE PROPERTIES MATRIX

**Component:** ErrorBoundary
**Level:** Template
**Source:** `react-native/components/logging/error-boundary.tsx`
**Platform Mapping:** Android `try-catch` + error composable, iOS error handling + error view

---

## TRANSLATION SOURCES

| Property | RN wrapper source | Framework primitives | Native target file | Variants |
|---|---|---|---|---|
| Layout | `react-native/components/logging/error-boundary.tsx` | `react-native/Libraries/Components/View/View.js`, `react-native/Libraries/ErrorHandling/ErrorUtils.js` | Android: `app/src/main/java/com/laneshadow/ui/templates/ErrorBoundary.kt`<br>iOS: `app/ui/templates/ErrorBoundary.swift` | 1 fixed layout (error state) |

---

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources.

### Layout — Error Container

**Source files read:**
- LaneShadow: `react-native/components/logging/error-boundary.tsx`
- Framework: `react-native/Libraries/Components/View/View.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flex | RN-wrapper | `flex: 1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Layout | justifyContent | RN-wrapper | `'center'` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Layout | alignItems | RN-wrapper | `'center'` | `Modifier.wrapContentSize(Alignment.Center)` | `.multilineTextAlignment(.center)` | n/a |
| Layout | paddingHorizontal | RN-wrapper | `space.xl` = 24 | `Modifier.padding(horizontal = 24.dp)` | `.padding(.horizontal, 24)` | `space.xl` |
| Visual | backgroundColor | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |

### Visual — Error Icon

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Icon | name | RN-wrapper | `alert-circle` | `Icons.Outlined.Error` | `exclamationmark.triangle` | n/a |
| Icon | size | RN-wrapper | `48` | `Modifier.size(48.dp)` | `.frame(width: 48, height: 48)` | `iconSize.emptyState` |
| Icon | color | RN-wrapper | `semantic.color.danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |
| Layout | marginBottom | RN-wrapper | `space.lg` = 16 | `Modifier.padding(bottom = 16.dp)` | `.padding(.bottom, 16)` | `space.lg` |

### Typography — Error Message

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | variant | RN-wrapper | `titleLarge` (Paper) | `MaterialTheme.typography.titleLarge` | `.font(.titleLarge)` | ESCALATE — map to semantic |
| Typography | fontSize | titleLarge | 22 | `22.sp` | `22` | ESCALATE — `type.heading.md.fontSize = 18` (closest) |
| Typography | fontWeight | RN-wrapper | `'600'` | `FontWeight.SemiBold` | `.semibold` | `type.heading.md.fontWeight` |
| Typography | color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography | textAlign | RN-wrapper | `'center'` | `textAlign = TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |

### Layout — Error Details

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | marginTop | RN-wrapper | `space.md` = 12 | `Modifier.padding(top = 12.dp)` | `.padding(.top, 12)` | `space.md` |
| Layout | maxWidth | RN-wrapper | `400` | `Modifier.requiredWidthIn(max = 400.dp)` | `.frame(maxWidth: 400)` | ESCALATE — `size.errorMaxWidth = 400` |

### Typography — Error Details Text

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | variant | RN-wrapper | `bodyMedium` (Paper) | `MaterialTheme.typography.bodyMedium` | `.font(.bodyMedium)` | ESCALATE — map to semantic |
| Typography | fontSize | bodyMedium | 14 | `14.sp` | `14` | `type.body.sm.fontSize` |
| Typography | color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| Typography | textAlign | RN-wrapper | `'center'` | `textAlign = TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |

---

## DESIGN NOTES

- Catches JavaScript errors in child components
- Displays user-friendly error message
- Prevents app crash from propagating
- Error details shown for debugging
- Centered layout with icon

---

## VERIFICATION GATES

- Errors caught and displayed
- App doesn't crash on error
- Error message readable
- Icon visible and colored correctly
- Centered layout works

---

## DEPENDENCIES

- UI-001 (core theme contract)
- IconSymbol component
- Platform error handling (Android `try-catch`, iOS `NSError`)

---

## BEHAVIOR

- Wraps child components in error boundary
- On error, displays error UI instead of crashing
- Logs error to console/crashlytics
- Provides restart option to user
