# DISC-014: No-route empty home state: curated suggestion pills (≥44pt touch targets) + discovery-invite copy with a surface.glass scrim (72% alpha) + empty-catalog messaging

> **Delta-replan 2026-06-15:** enriched with three changes to absorb the ROADMAP Sprint 01 DISC-014 task-description expansion: (1) AC-4 — legible empty-catalog messaging when `listCuratedRoutes` returns `[]`; (2) AC-5 — invite line "Discover roads near you" rendered with a surface.glass scrim at 72% alpha (composed from `theme.colors.surface.default` + opacity 0.72) for legibility over Mapbox base layers in light + dark modes, REPLACING the superseded textShadow-only approach; (3) TC-3 — curated pills meet ≥44pt touch targets per §6 constitution. Existing AC-1..AC-3 unchanged. **Token-resolution notes (frontend-designer):** no `surface.glass` token exists in the design system → compose from `surface.default` @ opacity 0.72; `onSurface.muted` is NOT exposed by `unwrapColorStates()` → derive via `onSurface.default` @ opacity 0.6.

| Field | Value |
|---|---|
| Sprint | [sprint-01-live-discovery-home](./SPRINT.md) |
| Type | FEATURE |
| Agent | implementer = `react-native-ui-implementer` · reviewer = `react-native-ui-reviewer` |
| Estimate | S |
| Priority | P2 |
| Status | Backlog |
| Proposed By | react-native-ui-planner |
| Depends on | DISC-010, DISC-011 |
| Blocks | — |
| PRD refs | DELTA-001 §2/§5(UC-DISC-01)/§7 · ROADMAP Sprint 01 (DISC-014) · 05-uc-disc UC-DISC-01 |

## Background

Once the pill slot is re-keyed (DISC-010) and filled with curated routes (DISC-011), the no-route home needs a complete empty state. This task adds a discovery-invite placeholder to the chat input via a new optional `placeholder` prop keyed on `hasActiveRoute === false` (e.g. "Find a route — try 'twisties near Asheville'" instead of the generic "Plan a ride…"), keeps the curated pills present, and verifies no residual route/planning UI (route cards, weather pills) leaks into the empty state.

## Critical constraints

- The empty state is keyed on `hasActiveRoute === false` (from DISC-010) — NOT on message count or session presence.
- Add a new OPTIONAL `placeholder` prop to ChatInput; when no route is active, the placeholder reads as a discovery invite (e.g. "Find a route — try 'twisties near Asheville'") instead of the generic "Plan a ride…".
- No residual route/planning UI (route cards, weather pills, save control) may show in the no-route empty state.
- Discovery is a STATE of index.tsx — no new screen; use useSemanticTheme() tokens, no hardcoded hex.
- Do NOT regress the curated pills delivered by DISC-011 — they must be present in this state.
- **≥44pt touch targets for the curated suggestion pills per §6 constitution** (`semantic.control.minTouchTarget` = 44) — the pills in the empty state must each meet this minimum.
- **The invite line "Discover roads near you" (testID `home-empty-state`) MUST use a surface.glass scrim at 72% alpha for legibility over Mapbox base layers in BOTH light + dark modes — this REPLACES the superseded textShadow rgba(0,0,0,0.4) 0/1/3 approach.** NOTE: no `surface.glass` token exists in the design system JSON; the implementer composes it from `theme.colors.surface.default` at 72% alpha (a `<View>` with `opacity: 0.72` + `backgroundColor: theme.colors.surface.default`). Light surface = #F8F7F6, dark surface = #221810. `onSurface.muted` is NOT exposed by `unwrapColorStates()` — derive muted text via `theme.colors.onSurface.default` with `opacity: 0.6`.
- **When the curated catalog returns 0 routes for the current viewport/bbox, a legible empty-catalog message MUST render in place of the pill row (testID `home-empty-catalog-message`, e.g. "No curated roads available in this area") — never a blank gap, never a crash on null/undefined catalog response.**

## Specification

**Objective:** When no route is on the map (hasActiveRoute false), the home shows curated suggestion pills plus a discovery-invite placeholder in the chat input, with no residual route/planning UI.

**Success state:** When no route is on the map (hasActiveRoute false), the home shows curated suggestion pills plus a discovery-invite placeholder in the chat input, with no residual route/planning UI. Verified end-to-end on a real iOS Simulator against a live Convex deployment (the negative controls below bite an empty/static/disconnected build).

## Acceptance criteria

- **AC-1** (PRIMARY) — Discovery-invite placeholder when no route is active. **GIVEN** A cold-open home (no session route, hasActiveRoute false) **WHEN** The home renders in map mode **THEN** The chat input placeholder reads as a discovery invite (not the default "Plan a ride…"). _test_tier: e2e · service: iOS Simulator + live Convex._ **Oracle:** observe placeholder containing "Find a route" (discovery invite); must NOT observe "Plan a ride…" while no route is on the map. **Negative control:** placeholder still hardcoded "Plan a ride…" (static); new placeholder prop ignored (no-op); placeholder not keyed on hasActiveRoute (disconnect).
- **AC-2** — Curated pills present in the empty state. **GIVEN** A cold-open home with no route and a seeded curated catalog **WHEN** The home renders in map mode **THEN** The curated suggestion pills are shown. _test_tier: e2e · service: iOS Simulator + live Convex._ **Oracle:** observe visible pill row (testID `chat-input-suggestion-chips`); pill labeled "Tail of the Dragon"; must NOT observe 0 pills in the no-route empty state. **Negative control:** pills hidden in empty state (DISC-011 regression) (empty); catalog not seeded (empty).
- **AC-3** — No residual route/planning UI in the empty state. **GIVEN** A cold-open home with no route **WHEN** The home renders **THEN** No route cards or weather pills are shown. _test_tier: e2e · service: iOS Simulator._ **Oracle:** observe the discovery empty home: map + chat input + ≥1 pill, with 0 route/planning panels; must NOT observe any route card (testID `route-card-` / routing-card-route-) (start/empty signature: 0 / none present); weather-pills-container. **Negative control:** a stale route card renders with no route (disconnect); weather pills show with no selected route (bug).
- **AC-4** — Empty-catalog messaging. **GIVEN** The curated catalog returns 0 routes for the current viewport (empty bbox or empty catalog) **WHEN** The no-route empty home renders **THEN** A legible empty-catalog message (testID `home-empty-catalog-message`) shows in place of the pill row AND the discovery-invite placeholder still reads. _test_tier: e2e · service: iOS Simulator + live Convex._ **Oracle:** observe an empty-catalog message (testID `home-empty-catalog-message`) e.g. "No curated roads available in this area"; the discovery-invite placeholder still reads "Find a route"; must NOT observe a blank gap where pills would be; a crash/error screen; hardcoded suggestion pills rendering despite the catalog returning 0 routes. **Negative control:** blank gap with no message (empty); hardcoded pills ignoring the empty catalog response (static); crash on null/undefined catalog response (disconnect).
- **AC-5** — Invite line with surface.glass scrim legibility (light + dark). **GIVEN** No route on the map and no transcript messages **WHEN** The empty home renders **THEN** The invite line "Discover roads near you" (testID `home-empty-state`) renders with a surface.glass scrim at 72% alpha (composed from `theme.colors.surface.default` + opacity 0.72) for legibility over the Mapbox base layer in BOTH light and dark modes — NOT the superseded textShadow-only treatment. _test_tier: e2e · service: iOS Simulator + live Convex._ **Oracle:** observe the invite Text 'Discover roads near you' (testID `home-empty-state`) wrapped in a View whose `style.opacity === 0.72` and `style.backgroundColor === theme.colors.surface.default`; in light mode the scrim resolves to #F8F7F6 @ 0.72 (rgba(248,247,246,0.72)) with text #1E1A16 @ 0.6 (rgba(30,26,22,0.6)) fontStyle 'italic'; in dark mode the scrim resolves to #221810 @ 0.72 (rgba(34,24,16,0.72)) with text #F2EEE8 @ 0.6 (rgba(242,238,232,0.6)) fontStyle 'italic'; must NOT observe a textShadow-only treatment with no background scrim (the superseded approach); illegible text washing out against the map in either light or dark mode. **Negative control:** textShadow-only treatment with no surface scrim backing (static — the superseded approach, illegible over light Mapbox base layers); invite line not rendered at all in the empty state (disconnect); scrim missing — transparent background over the map, text washes out (empty).

## Test criteria

| ID | Statement | Maps to | Verify |
|---|---|---|---|
| TC-1 | ChatInput exposes an optional placeholder prop applied to the TextInput | AC-1 | `grep -nE 'placeholder\??: ?string' components/chat/chat-input.tsx` |
| TC-2 | Type-check + lint clean | AC-1 | `pnpm type-check && pnpm lint` |
| TC-3 | Curated suggestion pills in the empty state meet ≥44pt touch targets (per §6 constitution: `semantic.control.minTouchTarget` = 44) | AC-2 | e2e layout assertion: measure rendered height of ≥1 testID `discovery-suggestion-pill-*` element — assert height ≥ 44pt on iOS Simulator |

## Reading list

- `components/chat/chat-input.tsx:249-274` — [PRIMARY PATTERN] The TextInput with hardcoded placeholder="Plan a ride…" (line 257) — the exact prop to parameterize.
- `app/(app)/(tabs)/index.tsx:1346-1358` — ChatInput call site — add `placeholder` keyed on hasActiveRoute.
- `app/(app)/(tabs)/index.tsx:1237-1253, 1283-1321` — Weather pills + route cards gating — confirm they are off in the no-route state.
- `tokens/semantic/semantic.tokens.json` — [VISUAL DESIGN SOURCE] `semantic.color.{light,dark}.surface.default` (#F8F7F6 light / #221810 dark — compose the glass scrim via opacity 0.72; NO `surface.glass` token exists); `semantic.color.{light,dark}.onSurface.default` (#1E1A16 light / #F2EEE8 dark — derive "muted" via opacity 0.6; `onSurface.muted` NOT exposed by `unwrapColorStates()`); `semantic.type.body.md` (fontSize 12, lineHeight 18, fontWeight 400); `semantic.control.minTouchTarget` = 44.

## Guardrails

**Write-allowed:** `components/chat/chat-input.tsx` (MODIFY: Add optional `placeholder?: string` prop; default to "Plan a ride…"; apply it to the TextInput placeholder (line 257).) · `app/(app)/(tabs)/index.tsx` (MODIFY: Pass a discovery-invite placeholder to ChatInput when `hasActiveRoute` is false (reuse the DISC-010 boolean); render the invite line "Discover roads near you" (testID `home-empty-state`) above the chat input area with a **surface.glass scrim at 72% alpha composed from `theme.colors.surface.default` + opacity 0.72 (NOT the superseded textShadow rgba(0,0,0,0.4) approach)**; render the invite text in `theme.type.body.md` italic with color `theme.colors.onSurface.default` @ opacity 0.6 (muted resolution — `onSurface.muted` is not exposed by `unwrapColorStates()`); render an empty-catalog message (testID `home-empty-catalog-message`, e.g. "No curated roads available in this area") when `useCuratedDiscovery` returns `[]` in the no-route state, using the same glass-scrim treatment; verify the no-route state shows no residual route cards/weather pills; verify pill touch targets meet ≥44pt.) · `e2e/disc-014-empty-home.e2e.ts` (NEW: e2e covering AC-1..AC-5 against a seeded live Convex cold open + an empty-catalog scenario.)

**Write-prohibited:** The pill gate logic (owned by DISC-010) — reuse hasActiveRoute, do not re-implement. · The pill content wiring (owned by DISC-011) — reuse, do not duplicate. · Any file not explicitly listed above

## Verification gates

1. `pnpm test` — all AC scenarios green; PRIMARY AC-1 watched RED against the start state (negative control: placeholder still hardcoded "Plan a ride…" (static)) before GREEN.
2. **On-device e2e** — run each `e2e/*.e2e.ts` AC on a real iOS Simulator against a live Convex deployment (seed via the fixtures below); capture the required screenshot evidence per AC.
3. `pnpm type-check` (exit 0) · `pnpm lint` (exit 0).
4. `git diff --name-only` ⊆ write-allowed.
5. **Un-fakeable:** AC-1 evidence (screenshot) shows the asserted on-screen oracle AND the negative-control build (empty/static/disconnected) produces the must-NOT-observe state.

## Design / approach

**Design enrichment (frontend-designer, delta-replan 2026-06-15):** Empty home state = map-mode, no route, no messages. Conditional render above ChatInput (absolute positioning, `pointerEvents='none'`, bottom anchored above pills+insets): Text 'Discover roads near you' in `theme.type.body.md` italic + `theme.colors.onSurface.default` @ opacity 0.6 (the muted-resolution — `onSurface.muted` is NOT exposed by `unwrapColorStates()`), **backed by a surface.glass scrim at 72% alpha** (composed from `<View style={{opacity: 0.72, backgroundColor: theme.colors.surface.default}}>` — NO `surface.glass` token exists in the design system). This REPLACES the superseded textShadow rgba(0,0,0,0.4) 0/1/3 approach (illegible over light Mapbox base layers). Gate: `!hasActiveRoute && !chatMode && transcriptMessages.length === 0`. testID `home-empty-state`. **Empty-catalog message** (testID `home-empty-catalog-message`, e.g. "No curated roads available in this area") uses the SAME glass-scrim + muted-text treatment, rendered in place of the pill row when `useCuratedDiscovery` returns `[]`.

Resolves correctly in both themes: light surface #F8F7F6 @ 0.72 + dark text #1E1A16 @ 0.6; dark surface #221810 @ 0.72 + light text #F2EEE8 @ 0.6. Verified against the semantic tokens JSON (light/dark variants present).

Anti-patterns: don't show when `transcriptMessages.length > 0` (returning riders see pills, not onboarding copy); no icon/CTA button (pills are the action); do NOT use the superseded textShadow-only approach; do NOT attempt to access `theme.colors.onSurface.muted` (not exposed); do NOT attempt to use a `surface.glass` token (does not exist).

```ts
// Reference stylesheet the implementer can adapt
const emptyStateStyles = StyleSheet.create({
  glassScrim: {
    position: 'absolute',
    bottom: PILL_ROW_HEIGHT + theme.space.lg + SAFE_AREA_BOTTOM,
    left: theme.space.lg,
    right: theme.space.lg,
    opacity: 0.72,                                            // surface.glass scrim (no token; composed)
    backgroundColor: theme.colors.surface.default,           // #F8F7F6 light / #221810 dark
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.md,
    borderRadius: theme.radius.md,
    pointerEvents: 'none',
  },
  inviteText: {
    ...theme.type.body.md,                                   // fontSize 12 / lineHeight 18 / fontWeight 400
    color: theme.colors.onSurface.default,                   // derive muted via opacity (onSurface.muted NOT exposed)
    opacity: 0.6,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
```

**Interaction / implementation notes:**
- Default the new `placeholder` prop to the existing "Plan a ride…" so non-empty/route states are unchanged.
- Key the invite placeholder on hasActiveRoute (false → invite copy).
- Confirm route cards and weather pills are already gated off when no route is present (index.tsx already gates weather pills on selectedOption).

**Ask first:**
- Final discovery-invite copy wording.
- Whether to also surface a small invite line above the pills vs. placeholder-only (placeholder-only is the spec default).

## Dependencies

- **Depends on:** DISC-010, DISC-011.
- **Blocks:** —.
- **Parallel:** DISC-013.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "cold_open_no_route": {
      "description": "A fresh home launch with no prior session route and a seeded curated catalog",
      "seed_method": "ui_flow",
      "records": [
        "no displayed route plan",
        "≥3 seeded curated routes incl. \"Tail of the Dragon\""
      ]
    },
    "empty_catalog_area": {
      "description": "A map viewport where listCuratedRoutes returns [] (0 curated routes) - e.g. ocean bbox or a region with no seeded routes",
      "seed_method": "ui_flow",
      "records": [
        "pan map to a region with 0 curated routes",
        "live Convex returns [] for the viewport bbox"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN no route on the map WHEN home renders THEN the chat input shows a discovery-invite placeholder",
      "verify": "pnpm test -- e2e/disc-014-empty-home.e2e.ts -t discoveryInvitePlaceholderWhenNoRoute",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "tier": "visible",
        "verification_service": "iOS Simulator + live Convex",
        "negative_control": {
          "would_fail_if": [
            "placeholder still hardcoded \"Plan a ride…\" (static)",
            "new placeholder prop ignored (no-op)",
            "placeholder not keyed on hasActiveRoute (disconnect)"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "cold_open_no_route",
            "action": {
              "actor": "user",
              "steps": [
                "Cold-open with no route",
                "Read the chat input placeholder"
              ]
            },
            "end_state": {
              "must_observe": [
                "placeholder containing \"Find a route\" (discovery invite)"
              ],
              "must_not_observe": [
                "\"Plan a ride…\" while no route is on the map"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN no route + seeded catalog WHEN home renders THEN curated pills are present",
      "verify": "pnpm test -- e2e/disc-014-empty-home.e2e.ts -t curatedPillsPresentInEmptyState",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "tier": "visible",
        "verification_service": "iOS Simulator + live Convex",
        "negative_control": {
          "would_fail_if": [
            "pills hidden in empty state (DISC-011 regression) (empty)",
            "catalog not seeded (empty)"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "cold_open_no_route",
            "action": {
              "actor": "user",
              "steps": [
                "Seed ≥3 curated routes",
                "Cold-open in map mode",
                "Observe pills"
              ]
            },
            "end_state": {
              "must_observe": [
                "visible pill row (testID `chat-input-suggestion-chips`)",
                "pill labeled \"Tail of the Dragon\""
              ],
              "must_not_observe": [
                "0 pills in the no-route empty state"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN no route WHEN home renders THEN no residual route/planning UI shows",
      "verify": "pnpm test -- e2e/disc-014-empty-home.e2e.ts -t noResidualRouteUiInEmptyState",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "tier": "visible",
        "verification_service": "iOS Simulator",
        "negative_control": {
          "would_fail_if": [
            "a stale route card renders with no route (disconnect)",
            "weather pills show with no selected route (bug)"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "cold_open_no_route",
            "action": {
              "actor": "user",
              "steps": [
                "Cold-open with no route",
                "Inspect for route/planning UI"
              ]
            },
            "end_state": {
              "must_observe": [
                "the discovery empty home: map + chat input + ≥1 pill, with 0 route/planning panels"
              ],
              "must_not_observe": [
                "any route card (testID `route-card-` / routing-card-route-) (start/empty signature: 0 / none present)",
                "weather-pills-container"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "ChatInput exposes an optional placeholder prop applied to the TextInput",
      "verify": "grep -nE 'placeholder\\??: ?string' components/chat/chat-input.tsx",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Type-check + lint clean",
      "verify": "pnpm type-check && pnpm lint",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the curated catalog returns 0 routes for the current viewport WHEN the no-route empty home renders THEN a legible empty-catalog message shows in place of the pill row AND the discovery-invite placeholder still reads.",
      "verify": "pnpm test -- e2e/disc-014-empty-home.e2e.ts -t emptyCatalogMessageShown",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "tier": "visible",
        "verification_service": "iOS Simulator + live Convex",
        "negative_control": {
          "would_fail_if": [
            "empty: blank gap with no message where the pill row would be",
            "static: hardcoded pills ignoring the empty catalog response",
            "disconnect: crash on null/undefined catalog response"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "empty_catalog_area",
            "action": {
              "actor": "user",
              "steps": [
                "Pan/navigate the map to a region with 0 curated routes (ocean bbox) or a viewport where listCuratedRoutes returns []",
                "Cold-open the home in map mode with no route displayed",
                "Observe the pill row area + the chat input placeholder"
              ]
            },
            "end_state": {
              "must_observe": [
                "an empty-catalog message (testID `home-empty-catalog-message`) e.g. 'No curated roads available in this area' rendered where the pill row would be",
                "the discovery-invite placeholder still reads 'Find a route'"
              ],
              "must_not_observe": [
                "a blank gap where pills would be with no message",
                "a crash or error screen",
                "hardcoded suggestion pills rendering despite the catalog returning 0 routes"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN no route on the map and no transcript messages WHEN the empty home renders THEN the invite line 'Discover roads near you' (testID home-empty-state) renders with a surface.glass scrim at 72% alpha (composed from theme.colors.surface.default + opacity 0.72) for legibility over the Mapbox base layer in BOTH light and dark modes - not the superseded textShadow-only treatment.",
      "verify": "pnpm test -- e2e/disc-014-empty-home.e2e.ts -t inviteLineGlassScrimLegibility",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "tier": "visible",
        "verification_service": "iOS Simulator + live Convex",
        "negative_control": {
          "would_fail_if": [
            "static: textShadow-only treatment with no surface scrim backing (the superseded approach)",
            "disconnect: invite line not rendered at all in the empty state",
            "empty: scrim missing - transparent background over the map (text washes out)"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "cold_open_no_route",
            "action": {
              "actor": "user",
              "steps": [
                "Cold-open home in map mode with no route and no transcript messages (light mode)",
                "Observe the invite line above the chat input area",
                "Switch device to dark mode and observe the invite line again"
              ]
            },
            "end_state": {
              "must_observe": [
                "the invite line Text 'Discover roads near you' (testID `home-empty-state`) wrapped in a View whose style.opacity === 0.72 and style.backgroundColor === theme.colors.surface.default (the glass scrim)",
                "in light mode: the scrim backgroundColor resolves to #F8F7F6 at 0.72 opacity (rgba(248,247,246,0.72)) and the invite text color resolves to #1E1A16 at 0.6 opacity (rgba(30,26,22,0.6)) with fontStyle 'italic'",
                "in dark mode: the scrim backgroundColor resolves to #221810 at 0.72 opacity (rgba(34,24,16,0.72)) and the invite text color resolves to #F2EEE8 at 0.6 opacity (rgba(242,238,232,0.6)) with fontStyle 'italic'"
              ],
              "must_not_observe": [
                "a textShadow-only treatment with no background scrim (the superseded approach from the 2026-06-14 design enrichment)",
                "illegible text washing out against the map in either light or dark mode"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Curated suggestion pills in the empty state meet >=44pt touch targets (semantic.control.minTouchTarget = 44)",
      "verify": "e2e layout assertion: measure rendered height of testID `discovery-suggestion-pill-*` - assert height >= 44pt",
      "maps_to_ac": "AC-2"
    }
  ]
}
-->
