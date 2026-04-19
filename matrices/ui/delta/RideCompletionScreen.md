# RideCompletionScreen - STYLE PROPERTIES MATRIX

**Component:** RideCompletionScreen (DELTA)
**Level:** Screen
**RN Source:** **NEW COMPONENT — NO RN BASELINE**
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js` (composition of existing components)

---

## DELTA CONTEXT

**Source UC:** UC-NAV-06, UC-FLOW-08 — Full completion flow screen

**Rationale:** Net-new screen composing `CompletionSummaryCard` into full-page experience. Replaces `RideCompletionScreen` + `RideSummaryScreen` use cases with unified implementation.

**Migration path:** Compose `CompletionSummaryCard` organism with screen layout templates.

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| UC Spec | `.spec/prds/native-rewrite/09-uc-navigation.md`, `15-uc-ride-flow.md` | UC-NAV-06, UC-FLOW-08 requirements |
| CompletionSummaryCard | `matrices/ui/delta/CompletionSummaryCard.md` | Summary card organism (delta) |
| BaseViewLayout | `react-native/components/layouts/base-view-layout.tsx` | Base layout (see matrices/ui/templates/BaseViewLayout.md) |

---

## NAVIGATION & ROUTING

| Aspect | RN | Android (Compose) | iOS (SwiftUI) |
|---|---|---|---|
| **Entry point** | Navigation from ride recording | `navController.navigate("rideCompletion")` | NavigationLink `/rideCompletion` |
| **Params** | `rideId: String` | `rideId: String` | `rideId: String` |
| **Transitions** | Fade in | `AnimatedContent(..., enter = fadeIn())` | `.opacity(...)` |
| **Exit** | onSave or onDiscard callback | Calls parent callback | Calls parent callback |

---

## DATA FLOW

| Prop | Type | Source | Purpose |
|---|---|---|---|
| rideId | String | Parent (recording flow) | Ride identifier |
| metrics | RideMetrics | Store/Convex query | Ride data to display |
| onDiscard | () => void | Parent callback | Discard ride and navigate back |
| onSave | () => void | Parent callback | Save ride and navigate to saved routes |

---

## STYLE PROPERTIES MATRIX

### Layout — Root Container (BaseViewLayout)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| Composition | Task spec | `BaseViewLayout with children` | `BaseViewLayout(...) { ... }` | `BaseViewLayout { ... }` | n/a |

### Layout — Content Area (ScrollView)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flex | Task spec | `1` | `Modifier.fillMaxHeight()` | `.frame(maxHeight: .infinity)` | n/a |
| contentContainerStyle padding | Task spec | `space.lg` = 16 | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |

### Layout — CompletionSummaryCard

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| Composition | Task spec | `CompletionSummaryCard with props` | `CompletionSummaryCard(title = ..., metrics = ..., ...)` | `CompletionSummaryCard(title: ..., metrics: ..., ...)` | n/a |
| title | Task spec | `'Ride Complete'` | Included above | Included above | n/a |
| metrics | Task spec | `props.metrics` | Included above | Included above | n/a |
| curvature | Task spec | `props.curvature` | Included above | Included above | n/a |
| routePreview | Task spec | `props.routePreview` | Included above | Included above | n/a |
| onDiscard | Task spec | `props.onDiscard` | Included above | Included above | n/a |
| onSave | Task spec | `props.onSave` | Included above | Included above | n/a |

---

## NOTES

- **NEW screen:** No RN baseline exists
- **BaseViewLayout:** Provides safe area handling
- **ScrollView:** Allows content to scroll on smaller screens
- **CompletionSummaryCard:** Main content displaying ride summary
- **Card handles:** All metrics, curvature, preview, and actions
- **Spacing:** 16px padding around card
- **Navigation:** Entry from ride recording, exit via save/discard
- **Callbacks:** onDiscard deletes ride, onSave saves to library
- **TestID:** Passed to container and card
- **Accessibility:** Screen announces "Ride complete" on entry
