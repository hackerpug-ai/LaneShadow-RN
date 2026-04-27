# Red-Hat Review Report

**Report Date**: 2026-04-26T14:30:00Z
**Target**: Sprint 6: Navigator Screens & Sandbox Hardening (20 tasks)
**Reviewed By**: swift-reviewer, kotlin-reviewer, feature-dev:code-reviewer

---

## Executive Summary

Three adversarial reviewers independently analyzed the Sprint 6 spec and converged on the same core finding: **the sprint is a serial waterfall disguised as parallel execution**. All three flagged the infrastructure dependency chain (SBX-01/02/03 → screens → SBX-06), the underspecified mock provider contracts, the lack of accessibility ACs, and the unrealistic time estimates. The cross-cutting reviewer identified that the 20-task scope violates the project's 10-task gate and leaves Sprint 7 hard-blocked with no partial completion path.

---

## HIGH Confidence Findings (3 Agents Agree)

### 1. Dependency chain is serial, not parallel
**Severity: Critical**

All three reviewers independently identified that the sprint's "parallel execution" claim is contradicted by its own dependency graph. The actual critical path is:

```
SBX-01 (registry) → SBX-02 (theme) → SBX-03 (providers) → SCR-01..06 (screens) → SBX-06 (snapshots)
```

No screen task can start until all three infrastructure tasks complete. No snapshot task can start until all screens complete. The "20 tasks to expose parallel execution" rationale is a fiction — only the 6 screen tasks can run in parallel with each other (per platform), and only after the infrastructure prerequisite chain finishes.

- **swift-reviewer**: "This is a WATERFALL, not parallel"
- **kotlin-reviewer**: "This creates a sequential execution chain that prevents parallelization"
- **cross-cutting**: "The critical path is 81 hours of serial work, not 40 hours of parallel work"

### 2. Missing dependency declarations on prior sprint outputs
**Severity: Critical**

All 12 screen tasks compose organisms (LSMapLayer, LSTopBar, LSChatInput, LSNavigatorMessage, LSPhaseIndicator, etc.) from Sprint 5. None of these are listed as dependencies. The sprint assumes these exist and are functional with no verification gate.

- **swift-reviewer**: "UC-SCR-03-ios, UC-SCR-04-ios depend on UC-ORG-03-ios, UC-ORG-06-ios... these aren't in the Sprint 6 task list"
- **kotlin-reviewer**: "All screen tasks depend on LSMapLayer organism (UC-ORG-02) which is NOT listed"
- **cross-cutting**: "No verification that required atoms/molecules/organisms exist"

### 3. No accessibility ACs in any screen task
**Severity: High**

All 12 screen tasks (6 iOS + 6 Android) have zero ACs for accessibility. No VoiceOver/TalkBack labels, no Dynamic Type support, no touch target size requirements, no contrast ratio checks.

- **swift-reviewer**: "None of the screen tasks include ACs for VoiceOver, Dynamic Type, or contrast ratios"
- **kotlin-reviewer**: "Zero ACs for accessibility (TalkBack labels, content descriptions, touch target sizes, contrast ratios)"
- **cross-cutting**: (implicit in the human testing gate which has no accessibility steps)

### 4. Mock provider → screen contract is underspecified
**Severity: High**

UC-SBX-03 creates providers with type signatures, but the screen tasks don't specify which fixture variant to use by default, what "empty" means (nulls vs empty arrays), what "overflow" tests (12 items? 20?), or what "long-copy" tests (100 chars? 1000?). Implementers will guess and iOS/Android will diverge.

- **swift-reviewer**: "iOS specifies 4 variants but doesn't specify Android must match"
- **kotlin-reviewer**: "AC assumes Fixtures.kt exists but doesn't verify it. No AC for what happens when variant doesn't exist"
- **cross-cutting**: "These are type signatures, not fixture specifications. Implementers will have to guess"

### 5. Sprint 7 is hard-blocked with no partial completion path
**Severity: High**

Sprint 7 (React Native shell retirement) requires ALL 20 Sprint 6 tasks to pass the human testing gate. There's no mechanism to proceed with 5 of 6 screens done, or 90% snapshot coverage. A single screen failure blocks the entire V2 migration.

- **cross-cutting**: "It's all-or-nothing. This is a single point of failure for the entire V2 migration"

---

## MEDIUM Confidence Findings (2 Agents Agree)

### 6. Snapshot determinism is compromised by Mapbox, animations, and system fonts
**Severity: High**

UC-SBX-06 requires deterministic snapshots, but the screens include Mapbox maps (external tile loading), time-dependent animations, and system fonts that vary by OS version. The determinism harness specified (disable animations, freeze Date) cannot cover all sources of non-determinism.

- **swift-reviewer**: "Relies on Mapbox (external service), animations (time-dependent), and system fonts (device-specific)"
- **cross-cutting**: "Mapbox tile loading variance" flagged as CI flakiness risk

### 7. Cross-platform parity report compares different device geometries
**Severity: Medium**

iOS snapshots use iPhone SE (375x667), Android uses Pixel 5 (393x851) — different aspect ratios. The parity report will show geometric layout diffs that aren't real platform divergences.

- **swift-reviewer**: "Parity report compares iPhone SE vs Pixel 5 — different aspect ratios. Visual parity is mathematically impossible"
- **kotlin-reviewer**: "If iOS uses individual test methods and Android uses one looped test, parity check will fail"

### 8. Hardcoded values in ACs contradict "no literal tokens" rule
**Severity: Medium**

Multiple ACs contain hardcoded values that the Critical Constraints forbid:
- UC-SCR-01: "FRIDAY · 68°F · CLEAR" (hardcoded mock data)
- UC-SCR-05: "0.35 scrim" (hardcoded opacity)
- UC-SCR-02: "5 labeled steps" (hardcoded count)

- **swift-reviewer**: "AC-1: specific error message hardcoded — violates template-agnostic approach"
- **kotlin-reviewer**: "UC-SCR-01 AC-1: 'FRIDAY · 68°F · CLEAR' — hardcoded in AC, but spec says NEVER hardcode"

### 9. Time estimates are unrealistic (2-3x optimistic)
**Severity: Medium**

Total estimate is ~4,080 minutes (68 hours) across 20 tasks. This assumes zero debugging, zero learning time for new APIs, perfect TDD on first attempt, and all prerequisites complete. The slack is razor-thin (~1.75 days in a 10-day sprint).

- **kotlin-reviewer**: "33.5 hours for one person to complete ALL Android tasks... These estimates are 2-3× too optimistic"
- **cross-cutting**: "Realistic execution: 66 hours of serial work in an 80-hour sprint window"

### 10. No error state ACs in screen tasks
**Severity: Medium**

All 12 screen tasks have happy-path ACs only. No AC covers what happens when map fails to initialize, mock provider returns malformed data, or animations fail to load.

- **kotlin-reviewer**: "Zero ACs for what happens when map fails to initialize, Mock provider returns malformed data"
- **swift-reviewer**: (implicit — flagged incomplete ACs across all screen tasks)

---

## LOW Confidence Findings (Single Agent)

### 11. ViewInspector tests are impossible for complex map views
**Severity: High** | Agent: swift-reviewer

Multiple screen tasks specify "ViewInspector test" for map gestures, sheet drags, and animation introspection. ViewInspector cannot inspect Mapbox map views, custom sheet presentations, or animation state. These tests are impossible as specified.

### 12. UC-SBX-01 reflection API may not exist
**Severity: Medium** | Agent: kotlin-reviewer

AC-4 assumes `SandboxRoot stories list` is introspectable via reflection. Neither native-sandbox docs nor technical-requirements specify this API exists. `pnpm sandbox:parity-check` cannot be implemented without it.

### 13. UC-SBX-02 color-token control "TOK group" is undefined
**Severity: Medium** | Agent: kotlin-reviewer

AC-4 says "color-token control MUST list every token in the named TOK group" but tokens don't have "groups" in the semantic.tokens.json schema.

### 14. Motion recipe tokens assumed but not verified
**Severity: Medium** | Agent: kotlin-reviewer

Multiple ACs reference `motion.recipe.sketchPolylineLoop`, `motion.recipe.phaseDotPulse`, `motion.recipe.routeDrawOn`, `motion.recipe.sidebarSlideIn`. No AC verifies these tokens exist in `semantic.tokens.json`.

### 15. UC-SBX-06 test count contradiction
**Severity: Medium** | Agent: kotlin-reviewer

TC-2 says "Snapshot suite test count equals 2 × registered story count" but the implementation uses "1 @Test iterating all stories". These contradict.

### 16. Parity manifest has unexplained platform divergence
**Severity: Medium** | Agent: cross-cutting

Current `stories.parity.json` shows 32 Android-only template stories that conflict with the sprint's plan to create new template stories. No reconciliation task exists.

### 17. Token/style "no literals" rule is unenforced
**Severity: Low** | Agent: cross-cutting

No lint rule, pre-commit hook, or CI scanner catches hardcoded colors/dimensions. Compliance relies entirely on human vigilance.

### 18. SPM path dependency on ~/Projects/native-sandbox
**Severity: Low** | Agent: swift-reviewer

UC-SBX-01 references `~/Projects/native-sandbox` as an SPM path dependency. This assumes a specific filesystem layout and won't work for CI or other developers.

---

## Agent Contradictions & Debates

| Topic | swift-reviewer | kotlin-reviewer | Assessment |
|-------|---------------|-----------------|------------|
| Snapshot device choice | iPhone SE is too small for screens | Pixel 5 is fine | Both agree device geometry makes parity reports noisy — the disagreement is about which device to standardize on |
| Provider variant schema | 4 variants specified but undefined | 4 variants already implemented on Android | Android has already shipped, so iOS must match — but the spec doesn't say this |
| ViewInspector vs. Compose testing | ViewInspector can't test maps/gestures | No equivalent concern raised | iOS testing constraint is tighter than Android (Compose test rules are more capable) |
| Sprint feasibility | "DO NOT PROCEED" without fixes | "Re-estimate with 2-3x multiplier" | Both agree sprint will slip; differ on whether to fix specs or adjust expectations |

---

## Recommendations by Category

### 1. Gaps (missing from spec)
- **Add prerequisite gate**: Verify Sprint 5 organisms exist and are functional before Sprint 6 starts
- **Add accessibility ACs**: Every screen needs VoiceOver/TalkBack labels, touch target sizes, contrast checks
- **Add error state ACs**: Define what happens on map init failure, malformed fixtures, animation failure
- **Add parity reconciliation task**: Resolve existing 32 Android-only template stories before creating new ones

### 2. Risks (could derail the sprint)
- **Re-scope to 2 sprints**: Split into Sprint 6A (infrastructure + 3 screens) and Sprint 6B (3 screens + snapshots)
- **Establish partial completion path**: Allow Sprint 7 to start if 5/6 screens pass and snapshot coverage ≥90%
- **Add token enforcement hook**: Pre-commit hook scanning for literal hex/dimensions in screen files

### 3. Assumptions (unvalidated)
- **Verify motion recipe tokens exist**: Audit `semantic.tokens.json` for all referenced recipe names
- **Verify native-sandbox reflection API**: Confirm `SandboxRoot` story list is introspectable before relying on it
- **Verify ViewInspector capability**: Confirm it can test map overlays, sheet gestures, and animation state — or remove those AC requirements

### 4. Contradictions (spec conflicts)
- **Resolve hardcoded AC values vs "no literals" rule**: Either exempt test data/mock data from the rule, or replace hardcoded values with token references
- **Resolve UC-SBX-06 test count**: TC-2 (2×N individual tests) contradicts implementation approach (1 test iterating all stories)
- **Admit serial dependency chain**: Update SPRINT.md to reflect the actual waterfall structure instead of claiming parallel execution

---

## Agent Reports (Summary)

| Agent | Key Findings | Duration |
|-------|-------------|----------|
| **swift-reviewer** | 10 HIGH findings, 3 MEDIUM. ViewInspector impossible for maps. Snapshot determinism compromised. Cross-platform parity unverifiable at different device geometries. | ~2 min |
| **kotlin-reviewer** | 6 HIGH findings, 4 MEDIUM. SBX-06 status/dependency mismatch. Reflection API undefined. Color-token "group" undefined. Time estimates 2-3x optimistic. | ~1 min |
| **feature-dev:code-reviewer** | 3 HIGH findings, 3 MEDIUM, 4 LOW. Sprint scope violates 10-task gate. Critical path is serial. Sprint 7 hard-blocked. Total estimate needs 25% contingency. | ~1 min |

---

## Metadata

- **Agents**: swift-reviewer (Read, Grep, Glob, Bash, Task, WebSearch), kotlin-reviewer (Read, Grep, Glob, Bash, Task), feature-dev:code-reviewer (Read, Grep, Glob, Bash, WebSearch)
- **Confidence Framework**: HIGH (3 agents agree), MEDIUM (2 agents agree), LOW (1 agent)
- **Report Generated**: 2026-04-26T14:30:00Z
- **Duration**: ~3 min total (parallel dispatch)
- **Next Steps**: Review recommendations → decide on re-scoping → update SPRINT.md → proceed with execution
