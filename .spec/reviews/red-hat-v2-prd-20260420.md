# Red-Hat Review Report: V2 Native Design System PRD

**Report Date**: 2026-04-20
**Target**: Native Design System V2 (Copper Navigator) PRD — `.spec/prds/v2/`
**Reviewed By**: product-manager, swift-planner, kotlin-planner

---

## Executive Summary

**ALL THREE REVIEWERS AGREE: NEEDS-REVISION.**

The PRD demonstrates strong product thinking and architectural discipline — the atomic hierarchy, token-driven approach, cross-platform parity strategy, and Navigator product frame are well-designed. However, **critical prerequisite artifacts don't exist**, and the timeline is optimistic. Four blocking issues must be resolved before Sprint 1 can start: (1) 25 SVG icons don't exist, (2) Mapbox Studio styles haven't been published, (3) the design source (`designs.html`) is a bundled JS artifact unreadable by agents or humans, and (4) the token generation pipeline (`generate.ts`) is aspirational, not implemented.

**Verdict: NEEDS-REVISION** — Fix 4 critical blockers, then green-light Sprint 1 with adjusted expectations.

---

## CONSOLIDATED READINESS VERDICT

| Reviewer | Verdict | Confidence |
|----------|---------|------------|
| product-manager | NEEDS-REVISION | HIGH |
| swift-planner | NEEDS-REVISION | HIGH |
| kotlin-planner | NEEDS-REVISION | HIGH |

---

## HIGH Confidence Findings (3/3 Agents Agree)

### CRITICAL — Blocks Sprint 1 Start

- [ ] **F1: SVG icon catalog doesn't exist** | Severity: CRITICAL
  `tokens/icons/` directory is absent. 25 design-owned SVG icons referenced by UC-ATM-10, UC-TOK-05, and every downstream component that uses `LSIcon` cannot be implemented. `pnpm icons:check` would fail immediately.
  Agents: product-manager, swift-planner, kotlin-planner

- [ ] **F2: Mapbox Studio styles don't exist** | Severity: CRITICAL
  PRD assumes published `mapbox://styles/laneshadow/copper-paper-light` and `copper-paper-dark` styles. UC-TOK-05 stores these as tokens; UC-ATM-12/13 require them for implementation. No styles exist in Mapbox Studio.
  Agents: product-manager, swift-planner, kotlin-planner

- [ ] **F3: Token generation pipeline is aspirational** | Severity: CRITICAL
  `tokens/scripts/generate.ts` does not exist. The PRD describes deterministic generation of Swift/Kotlin/TS outputs from `semantic.tokens.json` + icons + fonts, but no implementation exists. Sprint 1 (UC-TOK-05) cannot complete without it.
  Agents: product-manager, swift-planner, kotlin-planner

- [ ] **F4: Design source is inaccessible** | Severity: CRITICAL
  `concepts/designs.html` is a 1.5MB bundled JavaScript artifact, not readable HTML. Every UC that references "per concepts/designs.html" cannot be validated. Neither humans nor AI agents can extract screen layouts from it.
  Agents: product-manager, swift-planner, kotlin-planner

### HIGH — Significant Schedule Risk

- [ ] **F5: 6-week appetite is unrealistic** | Severity: HIGH
  45 UCs with Mapbox SDK integration, cross-platform parity, snapshot testing, and two cleanup passes. Week 2 alone has 13 ATM UCs including 3 Mapbox implementations. Sprint 5 adds 270+ snapshot tests on top of 6 screens. All three reviewers estimate 8-9 weeks is realistic.
  Agents: product-manager, swift-planner, kotlin-planner

- [ ] **F6: Token schema migration is breaking** | Severity: HIGH
  Existing `semantic.tokens.json` uses v1.x namespaces (`primary`, `secondary`, `success`). V2 requires complete rewrite (`typography.opinion.*`, `color.weather.*`, `color.role.agent.*`). Existing `LaneShadowTheme` Swift/Kotlin packages will fail to compile with new schema. UC-SBX-05 cleanup scope must include theme package rewrite.
  Agents: swift-planner, kotlin-planner

- [ ] **F7: UC-SBX-05 cleanup scope is underestimated** | Severity: HIGH
  iOS has 40+ SwiftUI views under `Views/Molecules/`; Android has 32+ composables under `ui/components/atoms/`. PRD mentions deleting "Avatar, Badge, BottomSheetInput, Button" but doesn't enumerate the full deletion set. No dependency analysis before deletion.
  Agents: swift-planner, kotlin-planner

---

## MEDIUM Confidence Findings (2/3 Agents Agree)

- [ ] **F8: No user journey validation across screens** | Severity: MEDIUM
  SCR UCs define per-screen ACs but no end-to-end flow. Missing: "User can navigate Idle → Planning → RouteResults → RouteDetails → Ride this" journey. Could ship 6 beautiful screens that don't work together.
  Agents: product-manager, swift-planner

- [ ] **F9: Mapbox platform integration underspecified** | Severity: MEDIUM
  No SPM package URL/version for iOS. No Gradle dependency version for Android. No `UIViewRepresentable` lifecycle specification (Coordinator pattern). No `AndroidView` factory pattern. No gesture reconciliation with parent scroll views.
  Agents: swift-planner, kotlin-planner

- [ ] **F10: Sandbox infrastructure undefined** | Severity: MEDIUM
  How to launch `/native-sandbox --platform android` (Gradle task? Shell script?). Where sandbox entry point files come from. How `argTypes` controls work in Compose. No `native-sandbox` Android documentation exists.
  Agents: swift-planner, kotlin-planner

- [ ] **F11: SVG-to-native conversion path undecided** | Severity: MEDIUM
  Icons become "Asset.xcassets or native Shape wrappers" (iOS) or "ImageVector constants or bundled SVG" (Android). No decision made. Choice affects bundle size, color resolution, and Dynamic Type support.
  Agents: swift-planner, kotlin-planner

- [ ] **F12: Font assets don't exist and registration path unclear** | Severity: MEDIUM
  No fonts in `tokens/fonts/`, no fonts in `ios/LaneShadow/Resources/Fonts/`, no fonts in `android/app/src/main/assets/fonts/`. No Info.plist `UIAppFonts` specification. No Android font loading mechanism documented.
  Agents: swift-planner, kotlin-planner

- [ ] **F13: Snapshot testing scope is unbounded** | Severity: MEDIUM
  UC-SBX-06 says "every story has snapshots in light+dark" but doesn't define story count. 45 UCs × ~3 variants × 2 themes = 270+ snapshots. No variant selection criteria. No Gradle/plugin configuration for dropshots.
  Agents: product-manager, kotlin-planner

---

## LOW Confidence Findings (Single Agent)

- [ ] **F14: No accessibility ACs beyond touch-target size** | Severity: MEDIUM
  Agent: product-manager

- [ ] **F15: No rollback plan if V2 fails** | Severity: LOW
  Agent: product-manager

- [ ] **F16: Font licensing unconfirmed for commercial bundling** | Severity: MEDIUM
  Agent: product-manager

- [ ] **F17: Dynamic Type strategy undefined (iOS)** | Severity: MEDIUM
  Agent: swift-planner

- [ ] **F18: No SwiftUI Preview strategy** | Severity: LOW
  Agent: swift-planner

- [ ] **F19: Motion recipe Animation API unspecified** | Severity: LOW
  Agent: swift-planner

- [ ] **F20: Color token type system ambiguous (enum vs string vs token)** | Severity: MEDIUM
  Agent: swift-planner

- [ ] **F21: Hilt/DI specification missing despite organism ViewModels** | Severity: MEDIUM
  Agent: kotlin-planner

- [ ] **F22: Gradle build config versions unverified (compileSdk/targetSdk mismatch)** | Severity: LOW
  Agent: kotlin-planner

- [ ] **F23: Cross-platform type mapping undefined (Swift ↔ Kotlin conventions)** | Severity: LOW
  Agent: kotlin-planner

---

## Agent Contradictions & Debates

| Topic | product-manager | swift-planner | kotlin-planner | Assessment |
|-------|----------------|---------------|----------------|------------|
| Timeline | 9 weeks realistic | Sprint 2 adds 3-5 day delay | 5-7 day "Sprint 0" needed before S1 | **All agree 6 weeks is tight. PM says 9; platform planners say add buffer upfront.** |
| Snapshot testing | Defer to Phase 2 | Not addressed directly | Critical setup gap | **Defer SBX-06 is the pragmatic call.** |
| DI/Hilt needed? | Not mentioned | Not mentioned | Yes — organisms need ViewModels | **Kotlin-planner raises valid point; PRD says organisms are "data-agnostic props" so DI may not be needed in V2. Clarify.** |

---

## GAP LIST (Blocks Sprint Execution)

### Must resolve before Sprint 1

| Gap | Owner | Effort | Sprint Impact |
|-----|-------|--------|---------------|
| 25 SVG icon files at `tokens/icons/` | frontend-designer | 2-3 days | Blocks UC-ATM-10, all LSIcon consumers |
| Mapbox Studio styles (light + dark) | frontend-designer + Mapbox Studio | 1-2 days | Blocks UC-ATM-12, UC-ATM-13, all map consumers |
| Token generator `tokens/scripts/generate.ts` | shared tooling | 2-3 days | Blocks UC-TOK-05, all downstream token consumption |
| Readable design reference | frontend-designer | 1 day | Blocks visual validation of every UC |
| V2 `semantic.tokens.json` schema | shared tooling | 1 day | Blocks UC-TOK-01 through UC-TOK-04 |

### Must resolve before Sprint 2

| Gap | Owner | Effort | Sprint Impact |
|-----|-------|--------|---------------|
| Mapbox SPM package URL + version (iOS) | swift-planner | 0.5 days | Blocks UC-ATM-12 |
| Mapbox Gradle dependency + version (Android) | kotlin-planner | 0.5 days | Blocks UC-ATM-13 |
| Icon conversion strategy decision (Assets vs Shapes / ImageVector vs SVG) | swift-planner + kotlin-planner | 0.5 days | Blocks UC-ATM-10 |
| Font assets + registration config | shared tooling | 1 day | Blocks UC-TOK-01, UC-TOK-05 |
| `LSMap` contract document (`tokens/api/LSMap.contract.md`) | shared | 1 day | Blocks UC-ATM-11/12/13 |
| UC-SBX-05 audit script + full deletion manifest | shared tooling | 1 day | Blocks Sprint 1 parallel cleanup |

---

## RISK REGISTER

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Icon catalog delays Sprint 2 | HIGH | CRITICAL | Sprint 0 task: Designer creates 25 SVGs. Gate Sprint 2 on `pnpm icons:check`. |
| Mapbox styles not published | HIGH | CRITICAL | Sprint 0 task: Create in Studio. Gate Sprint 2 on style URLs resolving. |
| 6-week timeline slips by 2-3 weeks | HIGH | HIGH | Accept 8-9 weeks OR cut SBX-06 snapshot testing to Phase 2. |
| Token schema migration breaks existing builds | HIGH | HIGH | UC-SBX-05 must run BEFORE any V2 tokens land. Tag pre-deletion commit. |
| Cleanup deletes needed code | LOW | HIGH | Audit script + dependency analysis before deletion. Tag backup. |
| Mapbox SDK integration surprises | MEDIUM | MEDIUM | Build 3-day buffer per platform. Test style loading early. |
| Snapshot testing scope explodes | MEDIUM | MEDIUM | Limit to happy-path variants. Max 1 snapshot per UC per theme. |
| Font licensing blocks release | LOW | CRITICAL | Sprint 0 legal review. Newsreader=OFL, Geist=custom, JetBrains Mono=OFL — all allow bundling. |

---

## Recommendations

### MUST FIX before Sprint 1 (est. 5-7 days)

1. **Create 25 SVG icons** at `tokens/icons/`. Gate Sprint 2 on `pnpm icons:check`.
2. **Publish Mapbox Studio styles** (light + dark). Gate Sprint 2 on style URLs resolving.
3. **Implement `tokens/scripts/generate.ts`** to produce Swift/Kotlin/TS outputs.
4. **Unbundle `designs.html`** into accessible reference (static HTML or per-screen PNGs).
5. **Write V2 `semantic.tokens.json`** with all V2 namespaces.
6. **Write UC-SBX-05 audit script** producing full deletion manifest.

### SHOULD FIX before Sprint 2 (est. 3-5 days)

7. **Specify Mapbox integration** — SPM URL/version for iOS, Gradle for Android.
8. **Decide icon conversion strategy** — Shapes vs Assets (iOS), ImageVector vs resources (Android).
9. **Specify font registration** — Info.plist `UIAppFonts`, Android asset loading.
10. **Create `LSMap` contract document** at `tokens/api/LSMap.contract.md`.
11. **Add user journey UC** (Idle → Planning → RouteResults → RouteDetails) as Sprint 5 gate.

### CAN FIX during execution

12. Define accessibility baseline (semantic labels, keyboard nav, color contrast).
13. Add rollback plan (tag pre-deletion commits).
14. Specify Dynamic Type scaling strategy (iOS).
15. Specify motion recipe Animation API.
16. Limit snapshot testing scope (happy-path only, 150 max).

---

## Agent Reports (Summary)

- **product-manager**: 10 findings (4 CRITICAL, 3 HIGH, 2 MEDIUM, 1 LOW). Verdict: NEEDS-REVISION. Strong product thinking but prerequisite artifacts missing.
- **swift-planner**: 10 findings (4 CRITICAL, 4 HIGH, 2 LOW). Verdict: NEEDS-REVISION. PRD 70% ready; SwiftUI implementation details underspecified in Mapbox, icons, tokens, fonts, Dynamic Type.
- **kotlin-planner**: 15 findings (8 CRITICAL-equivalent, 4 MEDIUM, 3 LOW). Verdict: NEEDS-REVISION. Token generation aspirational, icons missing, Mapbox undefined, cleanup underestimated. Recommends 5-7 day "Sprint 0".

---

## Metadata

- **Agents**: product-manager (16 tool uses, 82s), swift-planner (32 tool uses, 90s), kotlin-planner (32 tool uses, 121s)
- **Confidence Framework**: HIGH (3/3 agents), MEDIUM (2/3 agents), LOW (1 agent)
- **Report Generated**: 2026-04-20
- **Duration**: ~3 min (parallel execution)
- **Next Steps**: Address 6 MUST-FIX items in Sprint 0, then green-light Sprint 1
