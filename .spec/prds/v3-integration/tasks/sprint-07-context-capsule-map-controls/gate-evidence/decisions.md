# CAPS-S07-T09 — Gate decisions log

**Reviewer:** qa-engineer
**Date:** 2026-05-07T20:35:00-07:00
**Verdict:** **BLOCKED** — Sprint 07 gate cannot be flipped to PASS. See escalation below.

This file follows the IDLE-S06-T11 precedent: every P0/P1 design-review-skill finding that is **not** fixed in-cycle is recorded here with explicit rationale, owner, and unblock condition.

---

## Decision D-001 — Defer P0-001 (iOS sandbox full-screen template rendering) to a new task

**Finding:** Cross-reference `gate-evidence/design-review-skill-report.md` §P0-001.

**Decision:** **Defer** (not "won't fix"). Track via a new follow-up task and re-run the strict gate after that task lands. Sprint 07 status remains **NOT Done** until then.

**Rationale:**
- The blocker lives in the iOS sandbox host (`ios/LaneShadow/Sandbox/LaneShadowSandboxEntry.swift`) — a file outside every CAPS-S07-T0x write-allowed scope.
- CAPS-S07-T05 cycle 4 honestly documented the blocker (commit 1a9ccb196: "Test successfully detects zoom buttons but they remain unhittable due to sandbox story clipping — documented as known blocker in original task specification").
- CAPS-S07-T07 cycle 2 honestly reproduced the failure (commit 2396053c0: "Tests currently fail at sandbox rendering level (idle-context-capsule and idle-map-controls not found in XCUITest accessibility hierarchy)").
- CAPS-S07-T07 cycle 3 (commit 6df337bcc) claimed "Verified with real waitForExistence assertions on idle-context-capsule + idle-map-controls" but the reviewer probe at 2026-05-07T20:33Z (archived as `gate-evidence/ios-simulator/probe-tests.json` + `probe-summary.json`) reproduces the same failure — `XCTAssertTrue failed - idle-context-capsule must be present on idle-screen default.light` at `DesignReviewCaptureTests.swift:179`. That cycle 3 claim was either a misread of build success vs runtime success, or a verification gap.
- Per RULES.md §Verification Standards and CLAUDE.md §"Honest verdicts never softened," I am not lowering the severity threshold or hand-editing pipeline outputs to dodge this finding.

**What is NOT being deferred:** Component fidelity itself. The `LSContextCapsule` molecule (T01) and `LSMapControls` organism (T03) and their iOS template wiring (T05) are observably correct against the design HTML and ref PNGs at the source-code level. The deferral is only of the **runtime capture pipeline** path that the strict gate spec requires.

**Owner:** Recommend a new follow-up task — proposed slug `CAPS-S07-T17-ios-sandbox-fullscreen-template-preview-fix` (or fold into Sprint 08 setup as a prerequisite). Specialist: `swift-implementer`.

**Unblock condition:** After the new task ships either (a) `LaneShadowSandboxStoryDetail` honoring `Story.previewMode == .fullScreen` via a `fullScreenCover` push, OR (b) re-pointing `DesignReviewCaptureTests` at the existing `-DirectIdleScreenUITest` launch path with mocked-variant support, re-run:

```bash
pnpm design:references --screens idle-screen \
  && xcodebuild test \
       -scheme LaneShadow \
       -destination 'platform=iOS Simulator,name=iPhone 16,OS=latest' \
       -only-testing:LaneShadowUITests/DesignReviewCaptureTests \
  && pnpm design:review --screens idle-screen \
  && jq '[.issues[] | select(.screen=="idle-screen" and .severity=="high")] | length' \
       .design-review/report.json
```

The gate re-flips to PASS only when (a) all 14 capture methods produce attachments named `idle-screen.<state>.<theme>` and (b) `jq` returns `0`.

---

## Decision D-002 — Defer P1-001 (Android parity capture run) to platform owner

**Finding:** Cross-reference `gate-evidence/design-review-skill-report.md` §P1-001.

**Decision:** **Defer to Android parity audit (CAPS-S07-T16) or kotlin-implementer follow-up.** Recorded as **MANUAL/BLOCKED** for Android per RULES.md §Real Device E2E Testing.

**Rationale:**
- CAPS-S07-T08 cycle 3 (commit 62fa4f090) added `captureToImage()` to the Android instrumented capture path. The qa-engineer running this gate has not been provisioned an Android emulator session and no automation has been routed through `gradlew connectedAndroidTest`.
- Sprint 07 component code (`LSContextCapsule`, `LSMapControls`, `IdleScreen` retrofit) on Android exists and references the same `idle-context-capsule` / `idle-map-controls` testTags as iOS (parity-correct at source level).
- `pnpm design:review`'s current pipeline (`scripts/design-review/export-from-xcresult.ts`) only ingests iOS xcresult bundles, so even a successful Android capture run would not be merged into the `report.json` consumed by AC-2's `jq` check today.

**Owner:** kotlin-implementer + qa-engineer (separately tracked). Possibly CAPS-S07-T16 if its scope expands to instrumented-capture parity verification.

**Unblock condition:** Either (a) the Android instrumented capture refresh is run on an emulator with attachments archived under `gate-evidence/android/`, OR (b) Sprint 07 acceptance is amended to track Android via a separate parity task and the iOS pipeline alone is treated as the gate.

---

## Decision D-003 — Do NOT run `pnpm design:review` end-to-end this cycle

**Decision:** Skip the `pnpm design:review --screens idle-screen` end-to-end run for this gate cycle.

**Rationale:**
- Step 2 of the pipeline (xcodebuild captures) reproducibly fails at `waitForExistence(idle-context-capsule)` per probe `.tmp/CAPS-S07-T09/probe.xcresult`.
- Running the pipeline now would either (a) error out at the export step (no captures to ingest) or (b) emit an automation-fallback `report.json` containing the `.design-review-automation` placeholder issues (med severity) that misrepresent the actual fidelity state.
- Generating an empty/fallback `report.json` and saving it as gate evidence would constitute **fabricating PASS** — which is explicitly prohibited by the task spec ("DO NOT fabricate 'zero high-severity issues' without actually running the pipeline") and by user standing preferences ("honest verdicts, never softened. Escalate instead of fabricating.")
- Therefore the honest action is: defer the pipeline run to after D-001 is resolved, and surface BLOCKED to the orchestrator now.

**No fabricated `gate-evidence/report.json`, `gate-evidence/report.html`, or `gate-evidence/comparison.png` is being produced this cycle.** Those AC-3 artifacts will be generated as part of the next gate cycle after D-001 lands.

---

## Decision D-004 — Do NOT flip Sprint 07 SPRINT.md status to Done

**Decision:** Leave `.spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/SPRINT.md` `Status:` line unchanged (`Planned`).

**Rationale:**
- AC-2 (zero-high-severity from a real pipeline run) and AC-3 (full evidence-set archived) are unmet because of D-001 + D-003.
- Per spec: "Flip Sprint 07 status to Done **only after** AC-1..3 pass."
- AC-1 itself is also unmet — the design-review-skill report has unresolved P0/P1 findings and the AC-1 verify regex (`unresolved.*P[01]`) will match.

**Unblock condition:** All ACs pass after the next cycle. SPRINT.md is updated only then.

---

## Decision D-005 — Do NOT close IDLE-S06-T11 yet

**Decision:** Leave `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/IDLE-S06-T11-sprint-gate.md` status as `🟡 In Progress`.

**Rationale:**
- AC-5 explicitly conditions IDLE-S06-T11 closure on AC-1..4 passing.
- D-001..D-004 mean those pre-conditions are unmet.
- IDLE-S06-T11's roll-forward into CAPS-S07-T09 evidence is a real intent, but the rollover happens **after** the strict gate passes — not before.

**Unblock condition:** When the next CAPS-S07-T09 cycle achieves a PASS verdict, IDLE-S06-T11 is updated in the same commit set with `Status: Done` + a body reference to `.spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/gate-evidence/`.

---

## Summary

| ID | Type | Status | Blocks |
|---|---|---|---|
| D-001 | Defer P0 | Open | AC-2 (gate verdict cannot be PASS) |
| D-002 | Defer P1 | Open | AC-2 Android parity (cross-platform) |
| D-003 | Skip pipeline run | Done (this cycle) | AC-2/AC-3 evidence artifacts |
| D-004 | Hold SPRINT.md status | Done (this cycle) | AC-4 |
| D-005 | Hold IDLE-S06-T11 status | Done (this cycle) | AC-5 |

**Net gate verdict for this cycle:** **BLOCKED**, escalated to orchestrator. See `verification-summary.json` (`.tmp/CAPS-S07-T09/verification-summary.json`).
