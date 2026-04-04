---
artifact_type: ux_spec
author: frontend-designer
date: 2026-04-03
status: draft
---

# UX Differentiation: "Describe Your Ride" — Natural Language Route Planning

## Executive Summary

LaneShadow's killer differentiator is letting riders describe a ride in plain language and receive curated route options with integrated weather context — in a single app. No competitor does this. The UX must make this feel effortless and magical, not like a chatbot bolted onto a map.

---

## Design Principles for This Flow

1. **Describe, don't drop** — the rider communicates intent; the app does the cartographic work
2. **Progressive disclosure** — preferences appear only when needed; defaults are smart
3. **Map-first results** — route options live on the map, not buried in lists
4. **Weather is always present** — not a setting the rider hunts for; it's baked into every route result

---

## Screen 1: Entry Point — The "Describe Your Ride" Bar

### What the rider sees

The existing `MapHeaderOverlay` (glassmorphic header floating over the map) is replaced by a two-line entry point:

**Top line:** Current location chip (auto-resolved from GPS, e.g. "Near Asheville, NC") — tappable to change  
**Bottom line:** A large tap-target input bar with placeholder text:

> "Where to, or describe your ride..."

The bar uses the same `var(--surface-variant)` background and `var(--radius-xl)` rounding as the existing chip system. It sits below the header in the same glassmorphic overlay zone, above the map.

A small microphone icon sits on the right edge of the bar (`IconSymbol name="microphone"`, `var(--on-surface-muted)` color). It is secondary — the text path is primary.

### What they can interact with

- **Tap the bar** → opens NLP input sheet (see Screen 2)
- **Tap the location chip** → opens a simple `LocationInput` to change start point (same component already in `PlanRideSheet`)
- **Tap the microphone** → opens NLP input sheet with voice mode active

### How it differs from competitors

Every competitor shows a plain "Where to?" search box that resolves to a pin. There is no description concept. LaneShadow's bar communicates a different mental model before the rider even types.

### Why it's better than pin-dropping

The entry point sets the tone: you're describing a ride, not navigating to an address. This primes the rider to think in terms of experience ("twisty roads, about 2 hours") rather than geography ("pin on Blue Ridge Parkway").

---

## Screen 2: NLP Input Sheet

### What the rider sees

A bottom sheet (`BottomSheetWrapper preset="half"`) rises over the map. Inside:

**Section 1 — Text input area**  
A multi-line text field (React Native `TextInput`, multiline, autoFocus) with placeholder:

> "E.g. 'Twisty mountain roads to Gatlinburg, about 3 hours, back by 5pm'"

The field uses `var(--surface-variant)` background, `var(--radius-lg)` rounding, `var(--space-md)` padding, and `var(--on-surface-default)` text color.

**Section 2 — Suggestion chips (horizontal scroll)**  
Below the text field, a horizontal `ScrollView` of 4–5 pre-written prompt chips using the existing `PreferencesRow` chip style (`height: 40, paddingHorizontal: 12, borderRadius: 20, var(--surface-variant)` background):

- "Twisty back roads"
- "Mountain passes"
- "Coastal cruise"
- "Half-day loop"
- "Avoid interstates"

Tapping a chip appends it to the text field or replaces the placeholder. Multiple chips can be combined.

**Section 3 — Quick preferences strip**  
The existing `PreferencesRow` component sits below the chips — same 4 chips (Scenic, Departure Time, No Highways, No Tolls). This lets riders refine without typing.

**Section 4 — Destination field (optional)**  
A compact, single-line `LocationInput` (using existing component) labeled "End at (optional)". If the rider's description implies a destination ("to Gatlinburg"), this auto-populates via NLP parsing on the backend. If not, the route is a loop.

### What they can interact with

- **Type freely** in the multi-line field
- **Tap suggestion chips** to append to description
- **Tap preference chips** to set scenic bias, departure time, avoid flags
- **Tap the optional destination field** to pin a specific endpoint
- **Tap "Plan It"** button — large, full-width, `variant="default"`, `size="lg"`, disabled if input is empty

A secondary link below the button: "Switch to manual mode →" (small, `var(--on-surface-muted)` color, `variant="ghost"`) — this is the fallback to the existing `PlanRideSheet` with start/end inputs.

### Voice mode

When voice mode is active (microphone tapped from entry bar), the text field background pulses with a subtle animation (scale 1.0 → 1.02 loop using `Animated.loop`), and a waveform placeholder replaces the text placeholder. Voice transcription populates the text field in real time. The "Plan It" button becomes active as soon as transcript is non-empty.

### How it differs from competitors

No competitor accepts a sentence as route input. Calimoto and Kurviger require the rider to place waypoints manually. Scenic has "curated routes" but no custom description. REVER requires building a route point-by-point.

### Why it's better than pin-dropping

The rider communicates what they want to experience, not where they want to go. The app translates intent to geography — the rider's cognitive load drops from "where are the twisty roads near me?" to "I want twisty roads."

---

## Screen 3: Processing State (~8–12 seconds)

### What the rider sees

The NLP input sheet transitions to a planning state. The sheet content morphs (not a new sheet) — the input field locks and dims, and a two-part progress area replaces the buttons:

**Top: Animated route sketch**  
A thin, animated polyline traces across the map in the background behind the sheet. It is deliberately rough/approximate — not the final route, just a "thinking" visual. The polyline uses `var(--primary-default)` with 40% opacity and a dashed stroke, animating from left-to-right using a `Animated.Value` driving the `strokeDashoffset`. This is drawn using `react-native-maps` `Polyline` with an initial bounding-box estimate.

This is distinct from the current `RoutePlannerLoading` which shows a full-screen scrim with a spinner. The new approach keeps the map visible, which is less anxiety-inducing.

**Bottom: Phase progress text**  
Inside the sheet, a centered vertical stack:

1. A small `ActivityIndicator` (size 24, `var(--primary-default)`)
2. A phase label that cycles through text strings with a fade transition (`Animated.timing` opacity 0 → 1 over 300ms):
   - "Reading your ride..."
   - "Finding scenic roads..."
   - "Checking weather along the route..."
   - "Building your options..."

Each phase label corresponds to an actual backend pipeline stage (NLP parse, waypoint discovery, weather fetch, route compile). The label advances via a prop from the planning hook — not a timer — so it reflects real progress, not fake progress.

3. A "Cancel" ghost button (`variant="ghost"`, `size="sm"`) below the indicator.

### What they can interact with

- **Tap Cancel** to abort and return to input sheet
- **Interact with the map** — pan/zoom is still live behind the semi-transparent sheet

### How it differs from competitors

Calimoto and Kurviger show a spinner or nothing during planning. There is no feedback about what the app is doing. LaneShadow's phased progress tells the rider exactly what the AI is working on, and the animated sketch signals "your ride is being built" not "we hit an API."

### Why it's better than pin-dropping

Manual pin-dropping is instant but requires significant rider effort upfront. LaneShadow shifts that effort to the AI while keeping the rider informed and engaged during the wait.

---

## Screen 4: Route Results — Map-First Presentation

### What the rider sees

The planning sheet collapses to ~30% screen height (a compact "results tray"), and the map expands to show **all route options simultaneously** as polylines.

**On the map:**
- **Selected route** (default: first / recommended): solid `var(--primary-default)` polyline, `strokeWidth: 5`
- **Alternate routes** (2nd, 3rd): semi-transparent dashed polylines, `var(--primary-default)` at 35% opacity, `strokeWidth: 3`
- Start pin and end pin (or loop endpoint) use existing `Marker` components
- Weather alert icons (see Screen 5) overlaid on route polylines at significant weather change points

**In the results tray:**

A horizontal `ScrollView` of route option cards. Each card is compact (approximately 80px tall):

```
[ Route A — Recommended ]      2h 15m  |  94 mi
[ Mountain Pass via 441 ]      scenic ★★★  |  rain at 2pm ⚠
```

Card anatomy:
- Left: Route label (from NLP enrichment, e.g. "Mountain Pass via 441")
- Middle: Duration + distance
- Right: Scenic rating dots + weather badge
- Active card uses `var(--primary-default)` left border (3px), elevated shadow (`var(--shadow-md)`)
- Inactive cards use `var(--surface-variant)` background

The `PreferencesRow` chips sit below the card list — riders can still toggle Scenic/Highways/Tolls/Departure and tap "Re-plan" to regenerate with updated preferences.

A "View Details" button (ghost, right-aligned) opens the existing `RouteDetailsSheet`.

### What they can interact with

- **Tap a route card** → selects that route, map animates to highlight its polyline, camera adjusts to fit the route bounds
- **Tap an alternate polyline on the map** → selects that route (same as tapping card)
- **Swipe the card list** horizontally → browses all options
- **Tap "View Details"** → opens existing `RouteDetailsSheet`
- **Tap preference chips + "Re-plan"** → triggers new planning pass with updated prefs (NLP description is preserved)
- **Tap "Go"** → begins navigation with selected route

### How it differs from competitors

Kurviger and Calimoto show one route at a time. You request alternatives explicitly, one by one. Scenic shows curated routes on a map but they're pre-built, not personalized. No competitor shows 2–3 personalized alternatives simultaneously with weather context.

### Why it's better than pin-dropping

Pin-dropping produces one route. The AI produces 3 options differentiated by experience type — the rider chooses the vibe, not just the path.

---

## Screen 5: Weather Integration

### What the rider sees

Weather is not a separate tab or overlay toggle. It is always visible in route results.

**On route cards:**
Each card's right column shows a weather badge. The badge is compact (24px height):

- Clear: no badge (clean)
- Rain: red/orange badge "Rain 2pm" with `IconSymbol name="weather-rainy"` (16px)
- Temp extremes: amber badge "92°F" or "38°F" with `IconSymbol name="thermometer"` (16px)
- Wind advisory: amber badge "25mph wind" with `IconSymbol name="weather-windy"` (16px)

Badge colors use `var(--warning-default)` (amber) for advisory conditions and `var(--error-default)` for dangerous conditions.

**On the map:**
At points along the selected route polyline where significant weather changes occur, a small floating label is pinned: e.g. "Rain starts" at the geographic coordinate where precipitation is forecast. These use a compact `Callout` bubble (white background, 1px border, `var(--radius-sm)` rounding, `var(--space-xs)` padding).

**In route comparison:**
When the rider views multiple route cards, weather becomes a differentiator visible at a glance. Route A might show "Clear all day" while Route B shows "Rain 3pm" — the AI can surface this distinction in the card label (e.g. "Drier Southern Loop").

### What they can interact with

- **Tap a weather badge** → expands to a compact weather timeline for that route: a horizontal chart showing hourly temp + precip probability for the ride duration. This is a modal `BottomSheetWrapper preset="half"` with a minimal line chart (using `react-native-gifted-charts` or similar already in the project).
- **"Adjust departure"** shortcut inside the weather detail sheet → pre-fills the departure time chip with a suggested time that avoids adverse weather.

### How it differs from competitors

No competitor integrates weather into route selection at this granularity. Riders currently cross-reference a weather app manually. LaneShadow makes weather a first-class route selection criterion.

### Why it's better than pin-dropping

Pin-dropping tells you where you're going. LaneShadow's weather integration tells you whether you should go — and when, if the timing matters.

---

## Screen 6: Selection → Go

### What the rider sees

After tapping a route card, the "Go" button appears in the tray (replacing the inactive state). It is full-width, `variant="default"`, `size="lg"`, with a motorbike icon:

```
[  Start Navigation  ]
```

A secondary row below shows:
- "Save Route" ghost button (left-aligned)
- "Share" ghost button (right-aligned) — for the post-MVP social layer

Tapping "Start Navigation" dismisses all sheets, the map enters navigation mode (zoomed to rider position), and the route polyline remains visible. A floating navigation bar rises from the bottom (distinct from planning sheets) showing next turn, distance, ETA.

This transition is fast and deliberate — no confirmation dialogs, no "are you sure?"

### How it differs from competitors

REVER requires saving a route before starting. Calimoto has a separate "navigate" step. LaneShadow collapses selection and go into a single tap.

---

## Screen 7: Fallback to Manual Mode

### What the rider sees

The "Switch to manual mode →" link in the NLP input sheet (Screen 2) and a "Refine manually" option in the route results tray both lead to the existing `PlanRideSheet` with standard start/end `LocationInput` fields.

When switching from NLP mode to manual mode, the system pre-fills:
- **Start:** current location (already set)
- **End:** any destination resolved from the NLP input (if present)
- **Preference chips:** carry over the scenic/highway/toll/departure settings from the NLP session

The transition is `BottomSheetWrapper` swapping content — not a navigation push — so the map stays in view throughout.

Additionally, in the route results state (Screen 4), riders can tap any alternate route polyline on the map and then tap "Add waypoint" on a route segment to inject a manual waypoint. This is an advanced refinement flow (post-MVP) but the tap target and `onMapClick` handler in `MapViewWrapper` should be reserved for it.

### How it differs from competitors

Competitors only offer manual mode. LaneShadow offers NLP as the primary path with manual as the fallback — not the other way around. The fallback is a feature, not the product.

---

## Component Inventory: Reuse vs New

### Existing components to reuse as-is

| Component | Usage in new flow |
|---|---|
| `BottomSheetWrapper` | All sheets in the flow |
| `SheetHandle` | All sheets |
| `LocationInput` | Optional destination field, manual fallback |
| `PreferencesRow` | NLP input sheet, route results tray |
| `Button` (variant/size/icon) | Plan It, Go, Cancel, Re-plan buttons |
| `Badge` | Weather condition badges on route cards |
| `IconSymbol` | Microphone, weather icons, motorbike |
| `MapViewWrapper` (polylines, markers) | Route sketch animation, alternate polylines |
| `RouteOptionsSheet` | Promoted to route results tray (restyled, not replaced) |
| `RoutePlannerLoading` | Repurposed for phase text (the spinner + cancel) |
| `RouteOptionCard` | Used inside new horizontal scroll results tray |

### New components required

| Component | Description |
|---|---|
| `DescribeRideBar` | Entry point bar in the map header area. Replaces/extends `MapHeaderOverlay` entry. |
| `NlpInputSheet` | Bottom sheet with multi-line TextInput, suggestion chips, PreferencesRow, optional destination |
| `PlanningProgressSheet` | Replaces `RoutePlannerLoading` full-screen scrim — sheet-based with phase labels |
| `RouteResultsTray` | Compact 30% bottom sheet with horizontal card scroll, weather badges, Re-plan, Go |
| `WeatherTimelineSheet` | Expandable weather detail for a single route — hourly chart |
| `RouteWeatherBadge` | Compact inline badge (icon + short label) for route cards |
| `AnimatedSketchPolyline` | Dashed animated polyline for planning state (wraps `react-native-maps` Polyline) |

### Unmodular code flags in existing components

- `RoutePlannerLoading` (`components/sheets/planning-loading.tsx:19`) — full-screen scrim approach. The new flow should not reuse the overlay approach. The cancel button and activity indicator can be extracted as standalone sub-elements into the new `PlanningProgressSheet`.
- `RouteOptionsSheet` (`components/sheets/route-options-sheet.tsx:84`) — currently `preset="full"` which covers the map. In the new flow this should be `preset="half"` to keep the map visible.

---

## Interaction State Machine (Summary)

```
IDLE
  └─ tap bar → NLP_INPUT

NLP_INPUT
  ├─ type / chip tap → (input populates)
  ├─ tap "Plan It" → PLANNING
  └─ tap "Manual mode" → MANUAL_PLAN_RIDE (existing flow)

PLANNING
  ├─ phase progress (Reading... Finding... Weather... Building...)
  └─ planning complete → ROUTE_RESULTS

ROUTE_RESULTS
  ├─ tap card → (selected route updates map)
  ├─ tap alt polyline on map → (same)
  ├─ tap "Re-plan" → PLANNING (NLP description preserved)
  ├─ tap "View Details" → ROUTE_DETAILS (existing RouteDetailsSheet)
  ├─ tap "Start Navigation" → NAVIGATION
  └─ tap "Manual mode" → MANUAL_PLAN_RIDE (prefs carried over)

ROUTE_DETAILS
  └─ back → ROUTE_RESULTS

NAVIGATION
  └─ end ride → post-ride feedback (future)
```

---

## Key Differentiation Summary

| Capability | LaneShadow | Calimoto | Kurviger | Scenic | REVER |
|---|---|---|---|---|---|
| Natural language input | Yes | No | No | No | No |
| Voice input | Yes | No | No | No | No |
| AI-curated options (2-3 at once) | Yes | No | No | Curated (not personalized) | No |
| Weather in route selection | Yes (integrated) | No | No | No | No |
| Weather on map along route | Yes | No | No | No | No |
| Favorite roads integration | Yes | No | Limited | No | No |
| Single-app complete flow | Yes | No | No | No | No |

The gap is real. The UX must make it feel as natural as asking a local rider for a recommendation.
