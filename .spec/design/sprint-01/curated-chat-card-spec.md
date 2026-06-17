# Curated-Route Chat-Card Visual Spec

**Task:** DESIGN-S01-002  
**Component:** `RouteAttachmentCard` variant `'curated'` (extends `components/chat/route-attachment-card.tsx`)  
**Scope:** Score rendering contract, `curated` variant layout spec, visual differentiation table, prop plan, token path table

---

## 1. Score Rendering Contract

### Core Formula

The ONLY valid score display form for curated-route chat cards is:

```javascript
Math.round(score * 100) + '%'
```

Where `score` is the raw 0–1 float from `useCuratedDiscovery` / the agent curated-discovery tool.

**Examples:**
- `score = 0.73` → Display: `"73%"`
- `score = 0.95` → Display: `"95%"`
- `score = 0.12` → Display: `"12%"`
- `score = 0.0` → Display: `"0%"`

### Forbidden Display Patterns

The following display patterns are **BUGS** and must NOT appear in curated-route chat cards:

| Forbidden Pattern | Example | Bug Type |
|-------------------|---------|----------|
| Raw 0–1 decimal | `"0.73"` | Score-field mapping bug — see DATA-008b |
| Raw 0–100 integer | `"73"` | Missing percentage symbol |
| "0%" when score non-zero | `"0%"` for a route with actual scores | Score-field mapping bug |
| Fixed decimal with `.toFixed(2)` | `"0.73"` | Unnecessary precision |
| Integer division without percentage | `Math.floor(score * 100)` | Missing percentage symbol |

### Score Arrival (Data Flow)

- **Source:** `useCuratedDiscovery` hook / agent curated-discovery tool
- **Scale:** Raw 0–1 float (e.g., 0.73, 0.95, 0.12)
- **Transformation:** PROHIBITED — scores arrive as 0–1 and must be carried through unmodified to the rendering formula
- **No rescaling in hook/store:** The spec prohibits any rescaling in the hook or store — the component applies `Math.round(score * 100) + '%'` directly

### Composite Score Display

**Typography:**
- Token path: `semantic.type.title.lg`
- fontSize: 17pt
- fontWeight: 600
- lineHeight: 21pt

**Color:**
- Token path: `semantic.color.primary.default`
- Light: `#EE7C2B` (copper-500)
- Dark: `#EE7C2B` (copper-500 — unchanged in dark)

### Dimension Score Bars (ScoreDimensionBar)

For each dimension score (curvature, scenic, technical), render a `ScoreDimensionBar` component:

**Component spec (from 10-design-system.md §2):**

```typescript
type ScoreDimensionBarProps = {
  label: string          // 'Curvature' | 'Scenic' | 'Technical'
  score: number          // 0–1 float from Convex
  testID?: string
}
```

**Visual spec:**

| Property | Token Path | Resolved Value | Notes |
|----------|------------|----------------|-------|
| **Label Typography** | `semantic.type.label.sm` | fontSize 9, lineHeight 9, fontWeight 600 | Left-aligned |
| **Label Color** | `semantic.color.onSurface.muted` | Light: `#6B6460`, Dark: `#9CA3AF` | Subtle text |
| **Track Background** | `semantic.color.surface.inset` | Light: `#F2EFED`, Dark: `#362A1F` | Full-width View |
| **Track Height** | `semantic.space.xs × 2` | 4pt × 2 = 8pt | From design-system.md §1 |
| **Track Border Radius** | `semantic.radius.full` | 9999pt | Rounded bar ends |
| **Fill Background** | `semantic.color.primary.default` | Light: `#EE7C2B`, Dark: `#EE7C2B` | Copper signal |
| **Fill Width** | `${Math.round(score * 100)}%` | Dynamic | Track-relative |
| **Value Typography** | `semantic.type.label.sm` | fontSize 9, lineHeight 9, fontWeight 600 | Right-aligned |
| **Value Font** | JetBrains Mono (instrument font) | Monospace | Numeric readout |
| **Value Color** | `semantic.color.onSurface.default` | Light: `#1E1A16`, Dark: `#F2EEE8` | Primary text |
| **Value Text** | `Math.round(score * 100) + '%'` | `"73%"`, `"95%"`, etc. | Same formula as composite |
| **Layout Gap** | `semantic.space.sm` | 8pt | Between label and bar |

**Outer layout:**
- `flexDirection: 'row'`
- `alignItems: 'center'`
- `gap: semantic.space.sm`
- Track is relative-positioned container
- Fill is absolute inside track

**Reuse boundary:** `ScoreDimensionBar` is display-only and serves curated-route detail and chat cards. Do NOT reuse the interactive `Slider` component.

---

## 2. Layout Spec for `curated` Variant

### Row 1: Route Name (Primary)

**Typography:**
- Token path: `semantic.type.title.lg`
- fontSize: 17pt
- fontWeight: 600
- lineHeight: 21pt

**Color:**
- Token path: `semantic.color.onSurface.default`
- Light: `#1E1A16`
- Dark: `#F2EEE8`

**Content:**
- Display route name as-is (e.g., "Blue Ridge Parkway")
- DO NOT use `{startLabel} → {endLabel}` format
- `numberOfLines: 1` (truncate with ellipsis if too long)

**NOT the `{startLabel} → {endLabel}` pattern from planned-trip cards:**
- The curated variant shows route name, not start/end labels
- The `{startLabel} → {endLabel}` row (lines 189-230 of `route-attachment-card.tsx`) is a planned-trip pattern and MUST NOT appear on the curated variant

### Row 2: Mileage + Archetype Badge

**Layout:**
- `flexDirection: 'row'`
- `gap: semantic.space.sm` (8pt)
- `alignItems: 'center'`

**Mileage Typography:**
- Token path: `semantic.type.body.md`
- fontSize: 12pt
- fontWeight: 400
- lineHeight: 18pt
- Color: `semantic.color.onSurface.default` (Light: `#1E1A16`, Dark: `#F2EEE8`)
- Format: `${Math.round(distanceMi)}mi` (e.g., "24mi", "12mi")

**Archetype Badge:**
- Component: Existing `Badge` component (`components/ui/badge.tsx`)
- Variant: `'secondary'`
- Content: Archetype label (e.g., "Twisties", "Scenic", "Technical")
- Mapping per 10-design-system.md §4 (UI → DB archetype table)

**Archetype mapping (UI → DB for display):**
| UI archetype | DB primaryArchetype |
|--------------|---------------------|
| twisties | {twisties} |
| scenic | {scenic_byway, coastal} → display as "Scenic" |
| technical | {mountain} → display as "Technical" |
| adventure | {adventure, desert} → display as "Adventure" |

### Row 3: Composite Score + Dimension Bars

**Composite Score (Primary Display):**
- Typography: `semantic.type.title.lg` (fontSize 17, fontWeight 600)
- Color: `semantic.color.primary.default` (Light: `#EE7C2B`, Dark: `#EE7C2B`)
- Display: `Math.round(compositeScore * 100) + '%'`
- Prominent placement — this is the key visual signal for curated routes

**Dimension Score Bars (Optional - 2–3 bars):**
- Render 2–3 dimension bars below composite score
- Each bar uses `ScoreDimensionBar` component (see §1)
- Typical dimensions: Curvature, Scenic, Technical
- Layout: `flexDirection: 'column'`, `gap: semantic.space.sm` (8pt)

**Note:** The task spec says "optionally followed by 2–3 dimension score bars." This allows implementer discretion — if screen space is limited, composite score alone is acceptable. If space permits, show dimension bars for richer detail.

### Card Background & Elevation

**Background:**
- Token path: `semantic.color.surfaceVariant.default`
- Light: `#FDFBF8` (paper-50)
- Dark: `#2D2218` (ink-700)
- Same as existing `full` variant of `RouteAttachmentCard`

**Border Radius:**
- Token path: `semantic.radius.md`
- Value: 10pt

**Elevation:**
- Token path: `semantic.elevation[2]`
- shadowOpacity: 0.21
- shadowRadius: 6pt
- elevation: 2

**Border:**
- Token path: `semantic.color.border.default`
- Light: `#E5DED9`
- Dark: `rgba(242,238,232,0.12)`
- borderWidth: 1 (from `semantic.borderWidth.thin`)

### Padding

**Horizontal Padding:**
- Token path: `semantic.space.md`
- Value: 12pt

**Vertical Padding:**
- Token path: `semantic.space.md`
- Value: 12pt

**Note:** Matches existing `full` variant padding (line 154 of `route-attachment-card.tsx`)

### Touch Target

**Requirement:** Full card must meet `semantic.control.minTouchTarget` (44pt) minimum

**Implementation:**
- Card height must reach 44pt minimum via natural content or explicit `minHeight`
- `TouchableOpacity` wrapper covers full card area
- Tap anywhere on card to trigger `onSelect` / `onViewOnMap`

**Note:** The existing `full` variant already meets this via content height (lines 154, 312 in `route-attachment-card.tsx`). Ensure curated variant maintains 44pt minimum.

### TestID

**Value:** `'route-attachment-card'`

**Pattern:** Reuse existing testID per 07-ui-infrastructure.md §6
- Do NOT use a different testID for curated variant
- Maintain existing testID consistency for testing infrastructure

---

## 3. Visual Differentiation Table

### Side-by-Side Comparison

| Feature | Planned-trip `full` variant (RouteAttachmentCard) | Curated `curated` variant |
|---------|---------------------------------------------------|---------------------------|
| **Start → End labels** | PRESENT (lines 189-228) | ABSENT — shows route name only |
| **Route name** | Secondary (route.label, lines 234-244) | Primary (row 1, `semantic.type.title.lg`) |
| **Mileage display** | PRESENT (formatDistance, lines 256-259) | PRESENT (row 2, `${Math.round(distanceMi)}mi`) |
| **Archetype badge** | ABSENT | PRESENT (row 2, Badge variant='secondary') |
| **Composite score** | ABSENT | PRESENT (row 3, `Math.round(compositeScore*100)+'%'`) |
| **Dimension score bars** | ABSENT | OPTIONAL (2–3 bars below composite) |
| **Route description** | PRESENT (rationale, lines 234-244) | MAY be present if space permits (not required) |
| **Mini-map preview** | PRESENT (if geometry available, lines 170-185) | MAY be present (same as full variant) |
| **Weather badges** | PRESENT (rainSummary, windSummary, lines 276-312) | MAY be present (same as full variant) |
| **Favorites badge** | PRESENT (if favorites.count > 0, lines 314-321) | MAY be present (same as full variant) |
| **Card background** | `semantic.color.surfaceVariant.default` | `semantic.color.surfaceVariant.default` (same) |
| **Border radius** | `semantic.radius.md` (10pt) | `semantic.radius.md` (10pt, same) |
| **Padding** | `semantic.space.md` (12pt horizontal/vertical) | `semantic.space.md` (12pt horizontal/vertical, same) |
| **Elevation** | `semantic.elevation[2]` | `semantic.elevation[2]` (same) |
| **testID** | `'route-attachment-card'` | `'route-attachment-card'` (reuse) |

### Key Differentiators (Summary)

1. **Start → End labels:** PRESENT on planned-trip, ABSENT on curated
2. **Score bars:** ABSENT on planned-trip, PRESENT (composite + optional dimension) on curated
3. **Archetype badge:** ABSENT on planned-trip, PRESENT on curated
4. **Route name prominence:** Secondary (planned-trip) vs Primary (curated)

### Anti-Patterns to Avoid

1. **DO NOT** show start→end labels on curated cards — this is a planned-trip pattern only
2. **DO NOT** hide composite score on curated cards — this is the key visual signal
3. **DO NOT** use hardcoded hex colors — all colors must use token paths
4. **DO NOT** create a separate component for curated cards — extend `RouteAttachmentCard` with `variant='curated'`
5. **DO NOT** use a different testID — reuse `'route-attachment-card'` for testing consistency

---

## 4. Prop Plan

### Recommendation: Add `variant='curated'` to `RouteAttachmentCardProps`

**Rationale:**
- Avoids a new component file
- Keeps the tap→map loop machinery intact (existing `onPress`, `onViewOnMap` handlers)
- Leverages existing `full` variant layout as base
- Minimal code duplication
- TestID reuse maintains testing infrastructure

**Prop extension:**

```typescript
type RouteAttachmentCardProps = {
  route: PlannedRouteOptionsView['options'][0] | CuratedRouteData
  isSelected: boolean
  onSelect: (routeId: string) => void
  testID?: string
  /** Visual variant: 'compact' for map overlay, 'full' for chat transcript, 'curated' for curated discovery */
  variant?: 'compact' | 'full' | 'curated'
  elevationGainFt?: number
  includeFavorites?: boolean
  onViewOnMap?: () => void
  onLegSelect?: (legIndex: number) => void
  selectedLegIndex?: number

  /** Curated route data (only used when variant='curated') */
  curatedRoute?: {
    name: string
    distanceMi: number
    archetype: RouteArchetype
    compositeScore: number
    curvatureScore?: number
    scenicScore?: number
    technicalScore?: number
  }
}
```

### Alternative: New `CuratedRouteCard` Component

**Acceptable if:**
- Implementer (DISC-020) determines conditional branching inside `RouteAttachmentCard` would become too complex
- Separate component improves code clarity
- Curated routes have fundamentally different data shape from planned routes

**New component signature:**

```typescript
interface CuratedRouteCardProps {
  curatedRoute: {
    name: string
    distanceMi: number
    archetype: RouteArchetype
    compositeScore: number
    curvatureScore?: number
    scenicScore?: number
    technicalScore?: number
  }
  isSelected: boolean
  onSelect: () => void
  onViewOnMap?: () => void
  testID?: string
}
```

**Spec preference:** Add `variant='curated'` to existing `RouteAttachmentCard` (see recommendation above). Implementer has discretion to choose the alternative if complexity warrants it.

### Archetype Type Definition

```typescript
type RouteArchetype =
  | 'twisties'
  | 'scenic'
  | 'technical'
  | 'cruising'
  | 'sport'
  | 'adventure'
```

Matches the UI enum from 10-design-system.md §4.

---

## 5. Token Path Table

### Colors

| Property | Token Path | Resolved Value (Light) | Resolved Value (Dark) | Notes |
|----------|------------|----------------------|----------------------|-------|
| **Card background** | `semantic.color.surfaceVariant.default` | `#FDFBF8` | `#2D2218` | paper-50 (light), ink-700 (dark) |
| **Card border** | `semantic.color.border.default` | `#E5DED9` | `rgba(242,238,232,0.12)` | Standard divider |
| **Route name text** | `semantic.color.onSurface.default` | `#1E1A16` | `#F2EEE8` | ink-900 (light), ink-050 (dark) |
| **Mileage text** | `semantic.color.onSurface.default` | `#1E1A16` | `#F2EEE8` | Same as route name |
| **Composite score text** | `semantic.color.primary.default` | `#EE7C2B` | `#EE7C2B` | copper-500 (unchanged in dark) |
| **Score bar track** | `semantic.color.surface.inset` | `#F2EFED` | `#362A1F` | paper-200 (light), ink-600 (dark) |
| **Score bar fill** | `semantic.color.primary.default` | `#EE7C2B` | `#EE7C2B` | copper-500 (unchanged in dark) |
| **Score dimension label** | `semantic.color.onSurface.muted` | `#6B6460` | `#9CA3AF` | ink-300 (light), ink-200 (dark) |
| **Score value text** | `semantic.color.onSurface.default` | `#1E1A16` | `#F2EEE8` | Same as route name |
| **Selected border** | `semantic.color.primary.default` | `#EE7C2B` | `#EE7C2B` | copper-500 (unchanged in dark) |

### Spacing

| Property | Token Path | Resolved Value | Notes |
|----------|------------|----------------|-------|
| **Card padding horizontal** | `semantic.space.md` | 12pt | Matches full variant |
| **Card padding vertical** | `semantic.space.md` | 12pt | Matches full variant |
| **Row gap** | `semantic.space.sm` | 8pt | Between route name and mileage/archetype |
| **Score bar gap** | `semantic.space.sm` | 8pt | Between composite score and dimension bars |
| **Score bar layout gap** | `semantic.space.sm` | 8pt | Between label and bar in ScoreDimensionBar |

### Radii

| Property | Token Path | Resolved Value | Notes |
|----------|------------|----------------|-------|
| **Card border radius** | `semantic.radius.md` | 10pt | Matches full variant |
| **Score bar radius** | `semantic.radius.full` | 9999pt | Rounded bar ends |

### Typography

| Property | Token Path | fontSize | fontWeight | lineHeight | Notes |
|----------|------------|----------|------------|-----------|-------|
| **Route name** | `semantic.type.title.lg` | 17pt | 600 | 21pt | Geist font |
| **Mileage** | `semantic.type.body.md` | 12pt | 400 | 18pt | Geist font |
| **Composite score** | `semantic.type.title.lg` | 17pt | 600 | 21pt | Geist font |
| **Score dimension label** | `semantic.type.label.sm` | 9pt | 600 | 9pt | Geist font |
| **Score value** | `semantic.type.label.sm` | 9pt | 600 | 9pt | JetBrains Mono (instrument font) |

### Elevation

| Property | Token Path | shadowOpacity | shadowRadius | elevation | Notes |
|----------|------------|--------------|-------------|-----------|-------|
| **Card elevation** | `semantic.elevation[2]` | 0.21 | 6pt | 2 | Matches full variant |

### Controls

| Property | Token Path | Resolved Value | Notes |
|----------|------------|----------------|-------|
| **Min touch target** | `semantic.control.minTouchTarget` | 44pt | Mobile accessibility floor |
| **Score bar height** | `semantic.space.xs × 2` | 4pt × 2 = 8pt | From design-system.md §1 |

---

## For DISC-020 Implementer

### Required Changes

1. **Add `variant='curated'` to `RouteAttachmentCardProps`** (or create new `CuratedRouteCard` component if complexity warrants)
2. **Add `curatedRoute` prop** with required fields (name, distanceMi, archetype, compositeScore) and optional dimension scores
3. **Render curated layout** when `variant === 'curated'`:
   - Row 1: Route name (NOT start→end labels)
   - Row 2: Mileage + archetype badge
   - Row 3: Composite score + optional dimension bars
4. **Implement score rendering formula**: `Math.round(score * 100) + '%'`
5. **Create `ScoreDimensionBar` component** (per 10-design-system.md §2) if not already implemented
6. **Reuse testID `'route-attachment-card'`** — do NOT change testID for curated variant

### Exact Prop Shape

```typescript
type CuratedRouteData = {
  name: string
  distanceMi: number
  archetype: RouteArchetype
  compositeScore: number
  curvatureScore?: number
  scenicScore?: number
  technicalScore?: number
}

type RouteArchetype =
  | 'twisties'
  | 'scenic'
  | 'technical'
  | 'cruising'
  | 'sport'
  | 'adventure'
```

### Implementation Checklist

- [ ] Add `variant='curated'` to `RouteAttachmentCardProps` union type
- [ ] Add `curatedRoute?: CuratedRouteData` prop to `RouteAttachmentCardProps`
- [ ] Conditionally render curated layout when `variant === 'curated'`
- [ ] Implement route name display (row 1) with `semantic.type.title.lg`
- [ ] Implement mileage + archetype badge display (row 2) with `flexDirection: 'row', gap: semantic.space.sm`
- [ ] Implement composite score display (row 3) with `Math.round(compositeScore * 100) + '%'`
- [ ] Implement optional dimension score bars (ScoreDimensionBar component)
- [ ] Create `ScoreDimensionBar` component (per 10-design-system.md §2) if not already implemented
- [ ] Ensure NO start→end labels render on curated variant
- [ ] Ensure testID remains `'route-attachment-card'` for all variants
- [ ] Verify all colors use token paths (no hardcoded hex)
- [ ] Verify touch target meets 44pt minimum

### Anti-Patterns to Avoid

1. **DO NOT** render start→end labels on curated cards
2. **DO NOT** display score as raw 0–1 decimal (e.g., "0.73")
3. **DO NOT** display score as raw 0–100 integer (e.g., "73")
4. **DO NOT** show "0%" when score is non-zero (score-field mapping bug)
5. **DO NOT** rescale scores in hook/store — apply `Math.round(score * 100) + '%'` in component only
6. **DO NOT** use hardcoded hex colors — all colors must use token paths
7. **DO NOT** create a separate component unless complexity warrants it
8. **DO NOT** change testID for curated variant — reuse `'route-attachment-card'`

### Verification Steps

After implementing changes:
1. Run `pnpm tokens:validate` to confirm all token paths are valid
2. Test on a real device with light and dark themes
3. Verify curated cards show route name (NOT start→end labels)
4. Verify composite score displays as percentage (e.g., "73%")
5. Verify dimension score bars render correctly (if implemented)
6. Verify archetype badge displays with correct label
7. Verify touch targets meet 44pt minimum
8. Verify testID `'route-attachment-card'` is present on curated cards

### Cross-References

- **ScoreDimensionBar spec:** 10-design-system.md §2
- **Archetype mapping table:** 10-design-system.md §4
- **Existing RouteAttachmentCard:** components/chat/route-attachment-card.tsx (lines 72-344)
- **Score rendering requirement:** 05-uc-disc.md (lines 89-96) — UC-DISC-10 AC
- **Card→map loop machinery:** 07-ui-infrastructure.md §1
- **TestID reuse requirement:** 07-ui-infrastructure.md §6
- **Token files:** tokens/semantic/semantic.tokens.json, tokens/semantic/colors.tokens.json