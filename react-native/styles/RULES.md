# LaneShadow Design System Rules

> Reference for AI agents and developers. Read this before writing any UI code.

---

## 1. App Identity

**Product**: AI-native motorcycle ride planner. Map-first, conversation-driven.
**Tagline**: "Ride the Moment" — turn a feeling into a road.
**Platforms**: iOS and Android (React Native + Expo v54)

### Aesthetic

Rugged, industrial-warm, copper-accented, dark-first — utilitarian motorcycle aesthetic with glassmorphic overlays.

### Design Priorities (ranked)

1. Map is always visible and primary
2. Dark-first — light mode is the adaptation
3. Warmth over sterility — copper, brown, off-white, never cold gray
4. Conversation-first UX — riders describe vibe, not coordinates
5. Progressive disclosure — collapsed by default, detail on demand

---

## 2. Tech Stack

| Concern | Tool |
|---|---|
| Framework | React Native + Expo v54 |
| UI Library | React Native Paper (MD3) — additive only, no overrides |
| State | Zustand |
| Navigation | Expo Router (tab bar hidden; drawer + `router.push`) |
| Backend | Convex |
| Auth | Clerk |
| Fonts | Inter (body), Space Grotesk (display) |
| Sandbox | Storybook for React Native |

---

## 3. Theme System

### The only way to access styles

```typescript
const { semantic } = useSemanticTheme()
// semantic.color.*  semantic.space.*  semantic.radius.*  semantic.type.*  semantic.elevation.*
```

**Never hardcode hex values, spacing numbers, or font sizes in components.**

---

## 4. Color Tokens

### Brand palette

| Name | Hex | Purpose |
|---|---|---|
| Copper (Primary) | `#B87333` | Interactive/actionable elements. The "do something" color. |
| Charcoal (Secondary) | `#1A1C1F` | Deep surfaces |
| Blue (Tertiary) | `#2B9AEB` | Informational elements only |
| Orange | `#FF6B35` | Legacy accent for UI flourishes |
| Accent | `#88C7A6` / `#407C5D` | Gentle green (light / dark) |

### Intent colors

| Intent | Hex |
|---|---|
| Success | `#31A362` |
| Warning | `#D98E04` |
| Danger | `#E35D6A` |
| Info | `#2B9AEB` |

### Surfaces

| Mode | Background | Surface | Card |
|---|---|---|---|
| Light | `#F5F0EB` (warm off-white) | `#F7F3EF` | `#FFFFFF` |
| Dark | `#1B1715` (dark warm brown) | `#2B2725` | `#24272B` |

### Copper opacity pattern (for tints and overlays)

```
primary + '1A' → 10% — subtle backgrounds
primary + '33' → 20% — selected states
primary + '4D' → 30% — borders
primary + '66' → 40% — stronger borders
primary + '80' → 50% — focus rings
primary + 'CC' → 80% — header backdrop blur
```

### Interactive state variants

Every color token supports: `default`, `hover`, `pressed`, `disabled`, `focus`.
Always handle `pressed` and `disabled` at minimum.

### Waypoint kind colors

| Kind | Hex | Purpose |
|---|---|---|
| On Route | `#31A362` | Waypoint is on the planned route |
| Off Route | `#D98E04` | Waypoint is off the planned route |
| Mixed | `#2B9AEB` | Waypoint has mixed on/off route status |

Access via `semantic.color.waypointOnRoute`, `semantic.color.waypointOffRoute`, `semantic.color.waypointMixed`.

### Enrichment phase colors

| Phase | Hex | Purpose |
|---|---|---|
| Fast | `#2C9F9B` | Fast/standard enrichment completed |
| Extended | `#8B5CF6` | Extended enrichment in progress |
| Cached | `#6B7280` (light) / `#9CA3AF` (dark) | Enrichment served from cache |

Access via `semantic.color.enrichmentFast`, `semantic.color.enrichmentExtended`, `semantic.color.enrichmentCached`.

### Deviation path colors

| Element | Hex | Purpose |
|---|---|---|
| Original Route | `#9CA3AF` (light) / `#6B7280` (dark) | The original planned route |
| Detour Path | `#FF6B35` | The active detour/deviation path |
| Reconnect Point | `#31A362` | Point where detour reconnects to original route |

Access via `semantic.color.deviationOriginalRoute`, `semantic.color.deviationDetourPath`, `semantic.color.deviationReconnectPoint`.

---

## 5. Typography

All text uses `semantic.type.*`. Never use bare React Native `<Text>`.

| Category | Size Range | Weight | Font | Usage |
|---|---|---|---|---|
| Display | 36–57px | 400 | Space Grotesk | Hero text only |
| Heading | 16–20px | 600 | — | Section titles |
| Title | 14–24px | 600–700 | — | Component titles |
| Body | 14–16px | 400 | Inter | Paragraph text |
| Label | 12–14px | 500 | — | UI labels, buttons |

---

## 6. Spacing

4px grid via `semantic.space.*`.

| Token | Value |
|---|---|
| xs | 4px |
| sm | 8px |
| md | 12px |
| lg | 16px |
| xl | 24px |
| 2xl | 32px |
| 3xl | 48px |
| 4xl | 64px |

---

## 7. Border Radius

Via `semantic.radius.*`.

| Token | Value |
|---|---|
| none | 0 |
| sm | 4px |
| md | 8px |
| lg | 16px |
| xl | 24px |
| 2xl | 32px |
| full | 9999px |

---

## 8. Elevation

6 levels (0–5) via `semantic.elevation.*`.

- Light mode shadows: 0.05–0.15 opacity
- Dark mode shadows: 0.2–0.35 opacity
- **Never use elevation > 3 on elements overlaying the map** — competes with map layers.

---

## 9. Layout Patterns

### Map Screen (primary screen)

- Uses `MenuLayout` with floating `MapHeaderOverlay`
- Map is full-bleed, edge-to-edge — **no `SafeAreaView`**
- `MapHeaderOverlay` handles its own `useSafeAreaInsets().top` padding internally
- Chat input bar at bottom
- Agent responses as glassmorphic overlays that fade — map always shows through

### Subpages (settings, profile, etc.)

- All subpages MUST use `SubpageLayout` from `components/layouts/subpage-layout.tsx`
- Pattern: back button, left-aligned title, copper accent rule beneath header
- Gradient extends through notch zone
- **Critical**: Do NOT use `SafeAreaView` with a background color on subpage headers — causes color-band artifacts at the notch. Use a plain `View` with `paddingTop: insets.top` applied to the `LinearGradient` directly.

### Navigation

- Tab bar is hidden (`display: 'none'`)
- Navigation via slide-out `MenuLayout` drawer or `router.push()`
- To return to main screen: `router.push('/(app)/(tabs)')` — **NOT** `router.back()`

---

## 10. Glassmorphic Overlay Pattern

Used for agent messages, route cards, and any UI floating over the map.

- Semi-transparent background (use copper opacity pattern from section 4)
- Background blur for depth
- Overlays should be temporary or dismissible — they are guests on the map
- Never let overlays fully obscure the map

---

## 11. Component Library

### Verified UI atoms (30+)

```
ChatInputBar         SuggestionChips       AgentMessageOverlay
RouteAttachmentCard  SessionSidebar        FullChatHistoryView
PlanningProgressIndicator  SessionCard     NewSessionButton
DragHandle           RouteBadge            OverlayPill
StatRow              WeatherPill           RouteThumbnail
BottomNavigation     PrimaryButton         SectionHeader
SearchBar            RouteOptionCard       SavedRouteCard
FAB                  RainBadge             TemperatureBadge
DepartureTimeSelector
```

### Verified sheets

```
PlanRideSheet             RouteOptionsSheet       PlanningErrorSheet
RoutePlannerLoading       RouteDetailsSheet       SaveRouteConfirmationSheet
```

### Verified screens

```
RouteOptionsScreen    SavedRoutesScreen    RouteComparisonView
```

**Before building anything new, check this list.** If a component exists, use it.

---

## 12. Component Authoring Rules

| Rule | Requirement |
|---|---|
| Exports | Named exports only |
| Styling | `useSemanticTheme()` for all visual properties |
| Interactivity | `Pressable` render props pattern for interactive states |
| Props | TypeScript interface defined for all props |
| Testing | `data-testid` attributes on all meaningful elements |
| Touch targets | Minimum 44px (WCAG AA) |
| Stories | Storybook story with controls |
| Composition | Prefer small composable components over monolithic |
| Mode support | Must work in both light and dark mode |

---

## 13. UX Principles

| Principle | Application |
|---|---|
| Map is primary | UI overlays the map, never replaces it. Agent output fades. |
| Conversation-first | Riders say "scenic 2-hour loop" — AI resolves to routes. No coordinate input. |
| Weather is first-class | Every route shows wind/rain/temp badges. Top route gets "Best for today" badge. |
| Progressive disclosure | Chat starts collapsed (input bar only). Full history on expand. Details via sheets. |
| Dark-first | Design in dark mode first, adapt to light. |
| Copper = action | Copper signals interactivity. Buttons, active states, CTAs. |
| Warmth over sterility | Warm browns, coppers, off-whites. Cold gray surfaces are wrong. |

---

## 14. Anti-Patterns

| Never do this | Why |
|---|---|
| Import from `@expo/vector-icons` directly | Use through approved icon component |
| Use bare React Native `<Text>` | Use Paper or themed text components |
| Hardcode any hex color, spacing, or font size | All values come from `semantic.*` tokens |
| Use `SafeAreaView` with background color on subpage headers | Causes notch color-band artifacts |
| Use `router.back()` for tab navigation | Breaks navigation stack |
| Set elevation > 3 on map overlays | Competes with map layers |
| Use cold or sterile grays for surfaces | Violates warm-toned design language |
| Override React Native Paper defaults | RNP is additive only — extend, never override |

---

## 15. Design Review Checklist

Before any UI work is considered complete:

- [ ] All visual properties use `useSemanticTheme()` — zero hardcoded colors
- [ ] Both light and dark mode render correctly
- [ ] All touch targets >= 44px
- [ ] `pressed` and `disabled` interactive states handled
- [ ] Map screen components use glassmorphic patterns
- [ ] Subpages use `SubpageLayout`
- [ ] Typography uses correct scale category (display/heading/title/body/label)
- [ ] Spacing follows 4px grid via `semantic.space.*`
- [ ] Storybook story exists with controls
- [ ] `data-testid` attributes on meaningful elements
- [ ] No new component duplicates an existing verified atom or sheet
- [ ] No elevation > 3 on map overlays

---

## 16. File References

| File | Purpose |
|---|---|
| `styles/theme.ts` | Theme token definitions (source of truth for values) |
| `styles/types.ts` | TypeScript types for theme system |
| `hooks/use-semantic-theme.ts` | Theme access hook — required in every styled component |
| `components/layouts/subpage-layout.tsx` | Required layout for all subpages |
| `components/CLAUDE.md` | Component-level guidelines and layout patterns |
| `.spec/design/manifest.json` | Design system metadata and component inventory |

---

*This file is the source of truth for LaneShadow design decisions. When in doubt: use tokens, stay warm, keep the map visible.*
