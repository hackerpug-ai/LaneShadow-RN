---
sprint: 5
title: Design Review Pipeline
sequence: 5
timeline: Phase 2 · Week 5
status: In Progress (auth-only rescope 2026-05-04)
---

# Sprint 05: Design Review Pipeline

**Sequence:** 5
**Timeline:** Phase 2 · Week 5
**Status:** In Progress (auth-only rescope 2026-05-04)

---

## Rescope Note (2026-05-04)

Original scope covered all 7 design-system views. Project slowdown + map-view descope means **auth-screen is the only functional view** with real app code. Sprint 05 is now scoped to:

- **Validate the pipeline end-to-end for auth-screen only** (6 states, light + dark themes)
- **Fix T06** (stub calibration data) and **T07** (merge-report semantic stub)
- **Ship T08** (design-review skill) and **T10** (smoke test + docs)
- **Descoped T09** (re-eval loop) — not needed for v0 validation; deferred to post-Sprint-05

All other views (idle, planning, route-results, route-details, sessions, error) will be covered incrementally as their corresponding app screens ship in Sprints 06–10.

---

## Overview

Sprint 05 ships an automated **design fidelity review pipeline** for iOS that retires the brittle sandbox-snapshot parity infrastructure (`StorySnapshotTests.swift` + `tokens/sandbox/snapshots.parity.json` + `pnpm snapshots:check`) and replaces it with a calibrated vision-LLM eval loop. The pipeline drives the production iOS app through every reachable design-system view state via XCUITest, captures screenshots from real flows, evaluates them against per-state design references rendered from `.spec/design/system/views/{view}/{view}.html`, and emits a structured fix-oriented JSON report consumable by a `design-review` Claude Code skill that can dispatch a fix agent and re-eval until passing — capped at 3 iterations.

**Current scope** (auth-only rescope): The pipeline is proven for auth-screen (6 states, 7 XCUITest methods, 6 reference PNGs + annotations). Other views will be added incrementally as sprints 06–10 ship real app code.

---

## Human Testing Gate

**Gate:** A reviewer can run `pnpm design:review --screens auth-screen` to drive iOS XCUITest captures of every reachable auth-screen state, evaluate them against rendered design-system references via a Claude Sonnet 4.6 vision LLM, and receive a structured fix-oriented JSON report of per-component issues — with observed/expected token deltas, severity, confidence, bounding-box, and `code_search_hint`.

---

## Human Test Deliverable

**Test Steps:**

1. Verify Phase 0 cleanup: confirm snapshot tests + parity infra removed; `pnpm type-check:native` and `xcodebuild build` pass; sandbox catalog UI preserved
2. Run `pnpm design:references` and confirm 6 auth-screen PNGs + 6 annotations.json files in `.spec/design/system/refs/auth-screen/` (email-entry, existing-user-sign-in, new-user-create-account, default.dark, invalid-email-error, submitting-loading)
3. Run `pnpm design:review --screens auth-screen` and confirm the pipeline runs end-to-end (capture → export → manifest → eval → report)
4. Inspect `.design-review/report.json` and confirm it has a flat `issues[]` array with all article §5 fields, plus a `summary` block with per-severity counts and screens_passed/failed
5. Open `.design-review/report.html` and confirm side-by-side reference vs captured layout for auth-screen states with severity-color-coded issue lists
6. Inject a deliberate spacing regression on iOS AuthScreen (replace one `--space-4` token usage with hardcoded `12.0` padding); re-run `pnpm design:review --screens auth-screen`; confirm the eval flags the spacing issue with severity >= med and a `fix_hint` mentioning token replacement; revert the regression and confirm zero med+ issues

---

## Tasks

| ID | Title | Agent | Estimate | Status |
|----|-------|-------|----------|--------|
| FID-S05-T01 | Phase 0 cleanup — remove sandbox snapshot tests + parity infra | swift-implementer + kotlin-implementer | 120 min | **Done** |
| FID-S05-T02 | Reference asset production — design HTML → per-state PNGs + annotations | convex-implementer | 360 min | **Done** |
| FID-S05-T03 | iOS XCUITest capture harness — DesignReviewCaptureTests + helpers | swift-implementer | 480 min | **Done** |
| FID-S05-T04 | Screenshot export from .xcresult + manifest builder | convex-implementer | 240 min | **Done** |
| FID-S05-T05 | Vision LLM eval engine — Claude Sonnet 4.6 multimodal + Zod | convex-implementer | 360 min | **Done** |
| FID-S05-T06 | Calibration set + prompt tuning to >=85% precision/recall | convex-implementer | 480 min | **In Progress** (stub data + missing tests) |
| FID-S05-T07 | Merge + report — JSON + side-by-side HTML | convex-implementer | 240 min | **In Progress** (semantic stub — missing severity filter, code_search_hint, article §5 fields) |
| FID-S05-T08 | Claude Code design-review skill | convex-implementer | 180 min | Backlog |
| FID-S05-T09 | Re-eval loop with 3-iteration cap | convex-implementer | 120 min | **Descoped** (deferred to post-Sprint-05) |
| FID-S05-T10 | End-to-end smoke test + docs + scope flag | qa-engineer | 120 min | Backlog |

---

## Task Detail Files

- [FID-S05-T01-phase-0-cleanup.md](FID-S05-T01-phase-0-cleanup.md) — DONE
- [FID-S05-T02-reference-asset-production.md](FID-S05-T02-reference-asset-production.md) — DONE
- [FID-S05-T03-ios-xcuitest-capture-harness.md](FID-S05-T03-ios-xcuitest-capture-harness.md) — DONE
- [FID-S05-T04-screenshot-export-and-manifest.md](FID-S05-T04-screenshot-export-and-manifest.md) — DONE
- [FID-S05-T05-vision-llm-eval-engine.md](FID-S05-T05-vision-llm-eval-engine.md) — DONE
- [FID-S05-T06-calibration-set-and-prompt-tuning.md](FID-S05-T06-calibration-set-and-prompt-tuning.md) — IN PROGRESS (needs stub deletion + missing tests)
- [FID-S05-T07-merge-and-report.md](FID-S05-T07-merge-and-report.md) — IN PROGRESS (needs severity filter, code_search_hint, flat issues[], annotations integration)
- [FID-S05-T08-design-review-skill.md](FID-S05-T08-design-review-skill.md) — BACKLOG (auth-screen-only scope)
- [FID-S05-T09-re-eval-loop.md](FID-S05-T09-re-eval-loop.md) — DESCOPED
- [FID-S05-T10-smoke-test-and-docs.md](FID-S05-T10-smoke-test-and-docs.md) — BACKLOG (auth-screen-only smoke test)

---

## Blocks

- Sprint 06 (IdleScreen) — design-review pipeline ready to gate IdleScreen when it ships
- Subsequent view sprints (07–10) — each adds its screen to pipeline coverage

---

## Source Coverage

- UC-FID-01 (automated audit subset — pipeline that supersedes `pnpm snapshots:check` + `pnpm snapshots:parity-report` for design fidelity verification)
- Strategy article: `https://acrobatic-echidna-253.convex.site/article/ec83f182-3599-482a-88c5-b5e76ce28e51`
- `.spec/design/system/manifest.json` + per-view README.md files — visual ground-truth + token recipes
- `RULES.md` "Cross-Platform Component Parity" section — parity-rule deferral source-of-truth
