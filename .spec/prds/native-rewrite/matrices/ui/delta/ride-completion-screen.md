# RideCompletionScreen — STYLE PROPERTIES MATRIX

**Component:** RideCompletionScreen
**Level:** Screen (Delta)
**Source:** UC-NAV-06, UC-FLOW-08 (NEW for Sprint 2)
**Platform Mapping:** Android `Column` + completion card, iOS `VStack` + completion card

---

## TRANSLATION SOURCES

| Property | RN wrapper source | Framework primitives | Native target file | Variants |
|---|---|---|---|---|
| Layout | NEW component (no RN source) | Column + card layout | Android: `app/src/main/java/com/laneshadow/ui/screens/RideCompletionScreen.kt`<br>iOS: `app/ui/screens/RideCompletionScreen.swift` | 1 fixed screen with completion card |

---

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property for this net-new component.

### Layout — Screen Container

**Source files read:**
- Specification: UC-NAV-06, UC-FLOW-08 (navigation/ride flow use cases)
- Design: Full completion flow composing CompletionSummaryCard

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flex | UC spec | `flex: 1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Visual | backgroundColor | UC spec | `background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |
| Layout | paddingHorizontal | UC spec | `16` | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | ESCALATE — `space.lg` |
| Layout | paddingTop | UC spec | `insets.top + 16` | `SafeAreaPadding.top + 16.dp` | `.safeAreaPadding(.top).padding(.top, 16)` | ESCALATE — `space.lg` |
| Layout | paddingBottom | UC spec | `insets.bottom + 16` | `SafeAreaPadding.bottom + 16.dp` | `.safeAreaPadding(.bottom).padding(.bottom, 16)` | ESCALATE — `space.lg` |
| Layout | gap | UC spec | `16` | `Spacer(Modifier.height(16.dp))` | `Spacer(minLength: 16)` | `space.lg` |

### Layout — Header

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flexDirection | UC spec | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | alignItems | UC spec | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| Layout | justifyContent | UC spec | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | `.frame(maxWidth: .infinity)` | n/a |
| Layout | paddingBottom | UC spec | `16` | `Modifier.padding(bottom = 16.dp)` | `.padding(.bottom, 16)` | ESCALATE — `space.lg` |

### Typography — Title

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | variant | UC spec | `heading.lg` | `MaterialTheme.typography.headlineLarge` | `.font(.headlineLarge)` | ESCALATE — map to `type.heading.lg` |
| Typography | color | UC spec | `onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Icon — Close Button

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Icon | name | UC spec | `close` | `Icons.Outlined.Close` | `xmark` | n/a |
| Icon | size | UC spec | `24` | `Modifier.size(24.dp)` | `.frame(width: 24, height: 24)` | `iconSize.lg` |
| Icon | color | UC spec | `onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| Layout | size | UC spec | `40` touch target | `Modifier.size(40.dp)` | `.frame(width: 40, height: 40)` | `touchTarget.min` |

### Layout — Completion Summary Card

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flex | UC spec | `1` (fills remaining space) | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |

> **Note**: The CompletionSummaryCard is documented in its own matrix file. This screen composes that organism.

### Layout — Bottom Actions

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flexDirection | UC spec | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | gap | UC spec | `8` | `Spacer(Modifier.width(8.dp))` | `Spacer(minLength: 8)` | `space.sm` |
| Layout | paddingBottom | UC spec | `8` | `Modifier.padding(bottom = 8.dp)` | `.padding(.bottom, 8)` | `space.sm` |

---

## DESIGN NOTES

- **Net-new component** for Sprint 2 delta
- Full-screen ride completion flow
- Header with title and close button
- CompletionSummaryCard fills remaining space
- Bottom action buttons (save, share, discard)
- Safe area handling on all edges
- Used after ride ends

---

## VERIFICATION GATES

- Card fills remaining space
- Header visible
- Close button accessible
- Actions aligned
- Safe areas respected
- Scrollable if needed

---

## DEPENDENCIES

- UI-001 (core theme contract)
- CompletionSummaryCard organism
- Button component
- IconSymbol component
- Safe area system

---

## COMPOSITION

- RideCompletionScreen = Column + [Header, CompletionSummaryCard, BottomActions]
- Header = Row + [Title, CloseButton]
- BottomActions = Row + [Button, Button, Button]
- Used by: NavigationService (after ride ends)
