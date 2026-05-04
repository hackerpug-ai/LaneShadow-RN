---
sprint: 5
title: Design Review Pipeline
sequence: 5
timeline: Phase 2 · Week 5
status: Planned
---

# Sprint 05: Design Review Pipeline

**Sequence:** 5
**Timeline:** Phase 2 · Week 5
**Status:** Planned (inserted 2026-05-04 from `~/.claude/plans/plan-a-design-review-logical-clock.md`)

---

## Overview

Sprint 05 ships an automated **design fidelity review pipeline** for iOS that retires the brittle sandbox-snapshot parity infrastructure (`StorySnapshotTests.swift` + `tokens/sandbox/snapshots.parity.json` + `pnpm snapshots:check`) and replaces it with a calibrated vision-LLM eval loop. The pipeline drives the production iOS app through every reachable design-system view state via XCUITest, captures screenshots from real flows, evaluates them against per-state design references rendered from `.spec/design/system/views/{view}/{view}.html`, and emits a structured fix-oriented JSON report consumable by a `design-review` Claude Code skill that can dispatch a fix agent and re-eval until passing — capped at 3 iterations.

The 10 tasks follow the strategy at https://acrobatic-echidna-253.convex.site/article/ec83f182-3599-482a-88c5-b5e76ce28e51 (XCUITest → screenshot → vision LLM eval against Figma + functional requirements → fix-oriented JSON → Claude code skill agent → re-eval loop). T01 removes the legacy parity infra in a clean baseline, preserving the in-app sandbox catalog UI for dev exploration. T02 produces ~84 per-state PNGs and ~42 annotations.json files under `.spec/design/system/refs/` from the existing design HTMLs. T03 builds the XCUITest capture harness using the Sprint 03 RF-38 Clerk auth pattern. T04–T07 build the manifest, vision-LLM eval engine (Claude Sonnet 4.6 multimodal), calibration harness, and human/machine reports. T08–T09 ship the `design-review` Claude skill with its re-eval loop. T10 executes the end-to-end smoke test (deliberate regression injection + revert) and documents the pipeline.

**Scope locks** (per user directives 2026-05-04): iOS-only for v0; visual-fidelity axis only (article §3.1) — behavioral axis (§3.2) is a follow-up plan; vision LLM from day one (no pixel-diff phase); cross-platform parity infra removed (HUMAN SIGNAL: high failure rate, brittle); sandbox catalog UI preserved.

---

## Human Testing Gate

**Gate:** A reviewer can run `pnpm design:review --screens <…>` (and dispatch the equivalent `design-review` Claude Code skill) to drive iOS XCUITest captures of every reachable design-system view state, evaluate them against rendered design-system references via a calibrated (≥85% precision/recall) Claude Sonnet 4.6 vision LLM, and receive a structured fix-oriented JSON report of per-component issues — with observed/expected token deltas, severity, confidence, bounding-box, and `code_search_hint` — that an autonomous fix agent can act on with a 3-iteration re-eval cap.

---

## Human Test Deliverable

**Test Steps:**

1. Verify Phase 0 cleanup: confirm `ios/LaneShadowTests/Sandbox/StorySnapshotTests.swift`, `android/.../AllStoriesSnapshotTest.kt`, `tokens/sandbox/snapshots.parity.json`, `tokens/sandbox/parity-thresholds.json`, `scripts/snapshots/`, all `snapshots:*` package.json scripts, and the lefthook pre-push parity gates have been removed; `RULES.md` "Cross-Platform Component Parity" section is annotated as deferred; `pnpm dev`, `pnpm type-check:native`, `xcodebuild build -scheme LaneShadow`, and `cd android && ./gradlew :app:assembleDebug` all succeed; sandbox catalog UI still loads in debug builds on both platforms
2. Run `pnpm design:references` and confirm ~84 PNGs and ~42 annotations.json files are produced under `.spec/design/system/refs/{screen}/`, with iOS-viewport (390×844) renders for every (screen, state, theme) combination across all 7 design system views (auth, idle, planning, route-results, route-details, sessions, error)
3. Run `pnpm design:capture --screens auth-screen` and confirm `xcodebuild test` runs `DesignReviewCaptureTests` against iPhone 15 Pro Simulator, signs in via real Clerk auth (no `bypassAuthForTesting`), drives the app through every reachable auth-screen state (entry, email-entry, existing-user, new-user, invalid-email, submitting), and produces `build/xcresults/design-review.xcresult` with one XCTAttachment per (screen, state)
4. Run `pnpm design:export` and `pnpm design:manifest` and confirm `.design-review/manifest.json` lists every (captured, reference, annotations) triple with no missing pairings; non-zero exit on any orphan capture or missing reference
5. Run `pnpm design:eval` against the unmodified app and confirm zero `high`-severity issues are produced; spot-check that any `med`/`low` issues include observed/expected token names (not raw hex/pixel values), confidence scores in [0,1], and component bounding boxes
6. Inject a deliberate spacing regression on iOS AuthScreen (replace one `var(--space-4)` token usage with hardcoded `12.0` padding); re-run `pnpm design:review --screens auth-screen`; confirm the eval flags the spacing issue with severity ≥ med, confidence ≥ 0.7, and a `fix_hint` mentioning token replacement; revert the regression and confirm zero med+ issues
7. Run `pnpm design:calibrate` and confirm ≥85% precision and ≥85% recall on the 10-entry calibration set, with held-out 5-entry test score within 5pp; verify `scripts/design-review/prompts/visual-eval.locked.md` exists
8. Open `.design-review/report.html` in a browser and confirm the side-by-side reference vs captured layout renders for every captured screen, with severity-color-coded issue lists per (screen, state, theme); dispatch the `design-review` Claude Code skill from a fresh session and verify it returns the article §6 schema (`{issues, summary}`)

---

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| FID-S05-T01 | Phase 0 cleanup — remove sandbox snapshot tests + parity infra | swift-implementer + kotlin-implementer | 120 min |
| FID-S05-T02 | Reference asset production — design HTML → per-state PNGs + annotations | convex-implementer | 360 min |
| FID-S05-T03 | iOS XCUITest capture harness — DesignReviewCaptureTests + helpers | swift-implementer | 480 min |
| FID-S05-T04 | Screenshot export from .xcresult + manifest builder | convex-implementer | 240 min |
| FID-S05-T05 | Vision LLM eval engine — Claude Sonnet 4.6 multimodal + Zod | convex-implementer | 360 min |
| FID-S05-T06 | Calibration set + prompt tuning to ≥85% precision/recall | convex-implementer | 480 min |
| FID-S05-T07 | Merge + report — JSON + side-by-side HTML | convex-implementer | 240 min |
| FID-S05-T08 | Claude Code design-review skill — `~/.claude/skills/design-review/` | convex-implementer | 180 min |
| FID-S05-T09 | Re-eval loop with 3-iteration cap | convex-implementer | 120 min |
| FID-S05-T10 | End-to-end smoke test + REAL_DEVICE_E2E.md docs + scope flag | qa-engineer | 120 min |

---

## Source Coverage

- UC-FID-01 (automated audit subset — pipeline that supersedes `pnpm snapshots:check` + `pnpm snapshots:parity-report` for design fidelity verification)
- `~/.claude/plans/plan-a-design-review-logical-clock.md` (the approved pipeline plan — context, phases, schemas, verification)
- Strategy article: `https://acrobatic-echidna-253.convex.site/article/ec83f182-3599-482a-88c5-b5e76ce28e51` (XCUITest → vision LLM eval → fix-oriented JSON → skill agent → re-eval loop)
- `.spec/design/system/manifest.json` + per-view README.md files (×7) — visual ground-truth + token recipes
- `RULES.md` "Cross-Platform Component Parity" section — parity-rule deferral source-of-truth

### Per-Task Design Files

| Task | Design Reference |
|------|-----------------|
| FID-S05-T02 | [`.spec/design/system/views/auth-screen/auth-screen.html`](../../../../.spec/design/system/views/auth-screen/auth-screen.html) (representative; references span all 7 views) |
| FID-S05-T03 | [`.spec/design/system/manifest.json`](../../../../.spec/design/system/manifest.json) (state inventory drives test method enumeration) |
| FID-S05-T05 | [`.spec/design/system/views/auth-screen/README.md`](../../../../.spec/design/system/views/auth-screen/README.md) (Token Recipe table format used for all 7 views) |

---

## Blocks

- Sprint 06 (Saved Routes, Sessions & Settings) — design-review pipeline ready before Sprint 06 ships new UI; sessions-screen + saved-routes states added to coverage in Sprint 06's verification
- Sprint 07 (Map, Offline, Error Recovery & Ship Gate) — Sprint 07's human gate Step 7 invokes `pnpm design:review` across all reachable screens for ship-gate verification

---

## Task Detail Files

Generated by /kb-sprint-tasks-plan on 2026-05-04. Avg quality 94/115 (range 88–100; minimum 80). 10 tasks expanded by convex-planner (×9) + swift-planner (×1 for T03 iOS XCUITest harness).

- [FID-S05-T01-phase-0-cleanup.md](FID-S05-T01-phase-0-cleanup.md) (swift-implementer + kotlin-implementer, 120 min, INFRA, 5 ACs / 9 TCs)
- [FID-S05-T02-reference-asset-production.md](FID-S05-T02-reference-asset-production.md) (convex-implementer, 360 min, 5 ACs / 8 TCs)
- [FID-S05-T03-ios-xcuitest-capture-harness.md](FID-S05-T03-ios-xcuitest-capture-harness.md) (swift-implementer, 480 min, 6 ACs / 8 TCs)
- [FID-S05-T04-screenshot-export-and-manifest.md](FID-S05-T04-screenshot-export-and-manifest.md) (convex-implementer, 240 min, 5 ACs / 8 TCs)
- [FID-S05-T05-vision-llm-eval-engine.md](FID-S05-T05-vision-llm-eval-engine.md) (convex-implementer, 360 min, 6 ACs / 10 TCs)
- [FID-S05-T06-calibration-set-and-prompt-tuning.md](FID-S05-T06-calibration-set-and-prompt-tuning.md) (convex-implementer, 480 min, 6 ACs / 8 TCs)
- [FID-S05-T07-merge-and-report.md](FID-S05-T07-merge-and-report.md) (convex-implementer, 240 min, 5 ACs / 8 TCs)
- [FID-S05-T08-design-review-skill.md](FID-S05-T08-design-review-skill.md) (convex-implementer, 180 min, 6 ACs / 8 TCs)
- [FID-S05-T09-re-eval-loop.md](FID-S05-T09-re-eval-loop.md) (convex-implementer, 120 min, 5 ACs / 6 TCs)
- [FID-S05-T10-smoke-test-and-docs.md](FID-S05-T10-smoke-test-and-docs.md) (qa-engineer, 120 min, INFRA, 5 ACs / 8 TCs)

### Planner Concerns / Escalations Surfaced

These were flagged at expansion time and require user/reviewer judgment before/during execution:

- **FID-S05-T01** — `SandboxSnapshotTestBase.kt` deletion is conditional on grep importer-check (TC-7). If any other test imports it, keep the base and delete only the test class.
- **FID-S05-T03** — May require a small `#if DEBUG` accessibility-driven theme override hook in `ios/LaneShadow/` if no existing light/dark toggle exists. Flagged as `boundaries.ask_first` — confirm before adding.
- **FID-S05-T05** — `claude-sonnet-4-6` model id assumed available; flagged ask-first if API surface differs at run time.
- **FID-S05-T06** — Calibration may plateau below 85% after 10 prompt rounds; agent will escalate prompt-strategy decision rather than silently lock below threshold.
- **FID-S05-T08** — SKILL.md path is outside the project tree (`~/.claude/skills/design-review/`). `scope.write_allowed` reflects absolute path; reviewer should confirm Claude Code skill discovery still works after install.
- **FID-S05-T10** — Deliberate regression must be performed on a temp branch only; `! git log -p main -- ios | grep 12.0` is a hard gate. Smoke regression detection is calibration-dependent (depends on T06 hitting ≥85%).

**Note:** All 10 task files end with a valid `<!-- REQUIREMENT-CONTRACT v1 -->` block. Stable AC-N / TC-N IDs; no gaps; every TC carries `maps_to_ac`. Per-AC `verify` commands target real test classes (xcodebuild for iOS T03, pnpm tsx for TS scripts) and follow project verification command discipline from `lefthook.yml`.
