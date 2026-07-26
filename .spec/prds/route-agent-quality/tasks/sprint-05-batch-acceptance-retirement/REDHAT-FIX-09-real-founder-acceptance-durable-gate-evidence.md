# REDHAT-FIX-09 — Record a real Founder acceptance with fresh runId + durable committed gate evidence (no fictional functions, real identity, real retirement/unretire transcripts)

> Status: Backlog
> Proposed By: `convex-planner`

| Field | Value |
|---|---|
| TASK_ID | REDHAT-FIX-09 |
| SPRINT | [Sprint 05 — Batch acceptance + retirement](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 180 min |
| EFFORT | M |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-04 |
| DEPENDS_ON | REDHAT-FIX-08 |
| BLOCKS | Sprint 05 gate durability (re-acceptance) and Sprint 10 unblocking based on accepted catalog |

RUNTIME_COMMANDS:
- No fictional symbols anywhere: `rg "runFullBatchAll|coverageReportLivePublic" convex/ scripts/ .spec/`
- Fresh runId (not previously rejected) used everywhere: `rg "s5-full-batch-redhatfix07-20260725T075100Z" .spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/`
- Coverage report is persisted and accessible: `pnpm tsx scripts/geometry-coverage-report.ts --run-id=<NEW_RUN_ID>`
- Typecheck: `pnpm type-check`
- Lint: `pnpm exec biome check convex scripts`
- Durable evidence resolvable at written_at_commit: `git show <WRITTEN_AT_COMMIT>:.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/gate-results.json`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

A new runId has a persisted coverageReport; the founder acceptance is recorded via requestBatchAcceptance→escalation_required→resolveBatchEscalation with real founder identity; gate-results + step logs + sprint-goal-state are committed and resolvable at written_at_commit; `.tmp/S5-T4` artifacts exist and match gate-results pointers; ripgrep finds no fictional symbol references.

## BACKGROUND

Red-hat review found staged/undurable evidence (F3/F4/G4), fictional function references (F5/G1), seed-shaped operatorIdentity (F6), runId replay/invalid state transitions (F8), and unobservable step-7/8 evidence (F9/F10/G2/G3).

**Objective:** Replace staged Sprint 05 gate evidence with a real, durable founder acceptance packet using real entry points, a fresh runId, real founder identity, and committed row-level retirement/unretire evidence.

**Agent rationale:** This remediation is a backend+evidence integrity task: run real Convex entry points, capture real mutation transcripts, and commit durable gate artifacts. It also requires cleaning fictional symbol references from .spec evidence and ensuring the acceptance state machine is legitimate and non-replayable. No RN UI changes.

## 🚫 CRITICAL CONSTRAINTS (Never tier)

- **MUST** run a fresh real full batch with a new runId via `waterfallOrchestrator:runFullBatch` (not fictional symbols). The prior rejected runId `s5-full-batch-redhatfix07-20260725T075100Z` must not be reused for acceptance.
- **MUST** obtain the persisted report via `curatedGeometry:coverageReport({ runId })` and use that real persisted artifact as the basis for acceptance evidence.
- **MUST** execute the legitimate founder decision state machine: `requestBatchAcceptance(runId, accept)` producing `escalation_required` (if escalations exist) followed by `resolveBatchEscalation(runId, accept, rationale)`; capture stdout/JSON transcripts of both mutations.
- **MUST** ensure the authenticated identity is a real founder (requireFounder passes) and operatorIdentity in artifacts matches that identity (not seed-like s4t* strings).
- **MUST** commit durable evidence: `.spec/.../gate-results.json`, `.spec/.../gate-logs/step-1..8.log`, and `.spec/.../sprint-goal-state.json` updated to the new runId and correct symbols; written_at_commit must be the commit SHA that contains these files.
- **MUST** populate `.tmp/S5-T4/{coverage-report-accepted,top50-manifest,founder-gate-packet}.json` with real content for the new runId (non-empty, consistent with gate-results artifacts pointers).
- **MUST** include step-7 retirement candidate evidence (IDs + per-route reasons) and step-8 unretireRoute transcript (before/after retiredAt) in committed gate logs.
- **MUST** correct honesty metadata: cycle counter must reflect reality (non-zero if prior cycles exist), and internal contradictions (e.g. redhat_fix_07 founder_decision mismatch) must be removed from sprint-goal-state.json for the new run.
- **NEVER** NEVER accept a runId that has a prior `rejected` decision as if it were accepted; resolveBatchEscalation requires an open escalation_required state and must not be bypassed by deleting/recreating artifacts without transcript.
- **NEVER** NEVER reference fictional function names (runFullBatchAll, coverageReportLivePublic) in gate logs, sprint-goal-state.json, scripts, or Convex code.
- **NEVER** NEVER fabricate `.tmp/S5-T4` artifacts by hand-editing empty shells; artifacts must be produced by real scripts/queries and must match the new runId.
- **NEVER** NEVER use a seed/test identity for founder acceptance; requireFounder must succeed with the actual founder identity.
- **NEVER** NEVER leave gate evidence uncommitted or dependent on working-tree modifications.
- **STRICTLY** STRICTLY `rg "runFullBatchAll|coverageReportLivePublic" convex/ scripts/ .spec/` MUST return zero matches after remediation.
- **STRICTLY** STRICTLY git show MUST be able to resolve every committed gate artifact at the SHA recorded by sprint-goal-state.json written_at_commit.
- **STRICTLY** STRICTLY step-7 and step-8 logs MUST include concrete routeIds and outputs sufficient for an auditor to re-run the same queries/mutations and observe consistent behavior.

## SPECIFICATION

**Objective:** Replace staged Sprint 05 gate evidence with a real, durable founder acceptance packet using real entry points, a fresh runId, real founder identity, and committed row-level retirement/unretire evidence.

**Success state:** A new runId has a persisted coverageReport; the founder acceptance is recorded via requestBatchAcceptance→escalation_required→resolveBatchEscalation with real founder identity; gate-results + step logs + sprint-goal-state are committed and resolvable at written_at_commit; `.tmp/S5-T4` artifacts exist and match gate-results pointers; ripgrep finds no fictional symbol references.

## CAPABILITY CHAIN

- **touches_capabilities:** CAP-GEO-04
- **provides:** fresh_runFullBatch_runId_with_persisted_coverageReport, legitimate_founder_acceptance_state_machine_transcript, durable_committed_gate-results_and_gate-logs_and_sprint-goal-state, real_tmp_S5T4_artifacts_packet_present, row_level_retirement_candidates_and_unretire_transcript_committed
- **consumes:** REDHAT-FIX-08 exhaustive + hygiene-correct coverageReport and top-50 export, Real entrypoints: waterfallOrchestrator:runFullBatch and curatedGeometry:coverageReport, Founder-only mutations: curatedGeometry:requestBatchAcceptance and curatedGeometry:resolveBatchEscalation, Top-50 export: top50Review:exportTop50Manifest and scripts/top-50-curated-review.ts, deriveSprint05GoalState tool for goal-state derivation (tools/gate/deriveSprint05GoalState.ts)
- **boundary_contracts:**
  - A rejected runId MUST NOT be reused as accepted evidence. A fresh runId is required for any acceptance after a rejection (honest state machine).
  - Gate evidence MUST be durable: gate-results.json, all 8 gate logs, and sprint-goal-state.json must be committed at a SHA that written_at_commit resolves via git show.
  - Founder acceptance MUST use real authenticated founder identity (requireFounder), not a seed-shaped or non-existent operatorIdentity string.
  - Documented entry points MUST be real (no runFullBatchAll / coverageReportLivePublic references anywhere in convex/, scripts/, or .spec/).
  - Step-7 and Step-8 gate evidence MUST be row-level and recomputable: retirement candidates list with per-route reasons + unretireRoute transcript proving reversibility.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `redhatfix09-fresh-run-full-batch` (seed_method: `public_api`): Real full batch execution on Convex dev deployment producing a persisted coverage_report artifact for a NEW runId.
  - Choose a fresh runId: s5-full-batch-redhatfix09-<ISO8601Z> (must not equal the previously rejected runId).
  - Run waterfallOrchestrator:runFullBatch with real operator identity and real routeIds membership for the batch; capture stdout transcript (including runId, isDone, continueCursor, cumulativeCostUSD).
  - Verify persisted report exists: curatedGeometry:coverageReport({runId}) returns source='persisted' and includes reportProvenance.producedBy='runFullBatch'.
- `redhatfix09-real-founder-acceptance` (seed_method: `public_api`): Real founder identity executes requestBatchAcceptance and resolveBatchEscalation for the new runId with captured mutation transcripts.
  - Call curatedGeometry:requestBatchAcceptance({runId, decision:'accept'}) with founder identity; capture JSON response containing decisionTimestamp and operatorIdentity.
  - If escalations exist, observe decision='escalation_required' and retirementUnlockedAt==null; then call curatedGeometry:resolveBatchEscalation({runId, decision:'accept', rationale:'...'}) with founder identity; capture JSON response.
- `redhatfix09-durable-gate-evidence` (seed_method: `public_api`): Committed durable gate packet: gate-results.json + 8 step logs + sprint-goal-state.json updated to new runId and correct symbols.
  - Write/update .spec/.../gate-results.json run_id to new runId and ensure artifact pointers refer to real local .tmp/S5-T4 files.
  - Write/update .spec/.../gate-logs/step-1..8.log with real transcripts and no fictional symbol names.
  - Write/update .spec/.../sprint-goal-state.json with written_at_commit set to the commit SHA containing the above files, and cycle counter corrected.

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Fresh real runFullBatch (new runId) produces a persisted coverageReport via real entrypoints

**Requirement:** GIVEN REDHAT-FIX-08 is complete and the operator has a routeIds membership list for the batch WHEN the operator executes waterfallOrchestrator:runFullBatch with a new runId and then queries curatedGeometry:coverageReport({runId}) THEN coverageReport returns source='persisted' with isDone true (or explicit cursor/stop reason if incomplete), and reportProvenance indicates producedBy='runFullBatch'

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-04
- VERIFY: `npx convex run waterfallOrchestrator:runFullBatch '<json>' && pnpm tsx scripts/geometry-coverage-report.ts --run-id=<NEW_RUN_ID>`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: runId reused from a previously rejected artifact; runFullBatch is not invoked (or invoked via fictional symbol); runFullBatch stdout is mocked/stubbed (fabricated runId) rather than a real Convex execution; coverageReport is read from live unscoped scan rather than persisted runId branch; coverageReport response is hardcoded/static shell (empty report) not persisted; persisted report missing reportProvenance producedBy='runFullBatch'; disconnect from Convex dev deployment returns cached/static JSON; fictional entry point used; runId reused; runFullBatch output mocked/stubbed (fabricated) instead of real Convex execution; coverageReport response hardcoded/static (empty) instead of persisted
- EVIDENCE: `stdout` (required_capture: True)
- CASE 1 — start_ref `redhatfix09-fresh-run-full-batch`
  - ACTION (cli_user): Run waterfallOrchestrator:runFullBatch with a new runId; Run curatedGeometry:coverageReport({runId}) and capture JSON; Assert source=='persisted' and runId matches
  - MUST_OBSERVE: `coverageReport.source == 'persisted'`
  - MUST_OBSERVE: `coverageReport.runId == '<NEW_RUN_ID>'`
  - MUST_OBSERVE: `coverageReport.reportProvenance.producedBy == 'runFullBatch'`
  - MUST_OBSERVE: `coverageReport.runId contains 's5-full-batch-redhatfix09-'`
  - MUST_NOT_OBSERVE: `coverageReport.source == 'live' for the acceptance packet`
  - MUST_NOT_OBSERVE: `coverageReport.runId == '' (empty)`
  - MUST_NOT_OBSERVE: `coverageReport == {} (empty)`
  - MUST_NOT_OBSERVE: `runId == 's5-full-batch-redhatfix07-20260725T075100Z'`
  - MUST_NOT_OBSERVE: `runId == old rejected runId`

### AC-2 — Founder acceptance is recorded with real identity and legitimate state machine (escalation_required → resolve)

**Requirement:** GIVEN a persisted coverage report exists for the new runId and low-yield escalations are present (or acceptance explicitly records clean accept without escalation) WHEN the founder executes curatedGeometry:requestBatchAcceptance(accept) and then curatedGeometry:resolveBatchEscalation(accept, rationale) THEN the acceptance artifact shows a real operatorIdentity (founder), decisionTimestamp, and a legitimate transition path (open escalation required before resolve); retirementUnlockedAt is set only on accepted resolution

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-04
- VERIFY: `npx convex run curatedGeometry:requestBatchAcceptance '{"runId":"<NEW_RUN_ID>","decision":"accept"}' --identity '<FOUNDER_ID>' && npx convex run curatedGeometry:resolveBatchEscalation '{"runId":"<NEW_RUN_ID>","decision":"accept","rationale":"..."}' --identity '<FOUNDER_ID>'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: operatorIdentity is a seed/test subject (e.g. s4t5-*); resolveBatchEscalation succeeds without a prior escalation_required state; requestBatchAcceptance performed by non-founder identity (requireFounder bypassed); reused runId that was previously rejected; acceptance record is mocked/stubbed (fabricated operatorIdentity/decision) rather than written by real mutations; retirementUnlockedAt is hardcoded/static placeholder (fabricated) rather than derived from real acceptance; acceptance response is an empty/static shell (empty object) that still passes loose checks; requireFounder bypassed; resolve without open escalation; acceptance response mocked/stubbed (fabricated) rather than created by real mutations; operatorIdentity hardcoded/static seed-shaped string; acceptance is empty {} (empty) but still treated as pass
- EVIDENCE: `db_query` (required_capture: True)
- CASE 1 — start_ref `redhatfix09-real-founder-acceptance`
  - ACTION (user): As founder identity, call requestBatchAcceptance({runId, decision:'accept'}) and capture response; If response.decision=='escalation_required', call resolveBatchEscalation({runId, decision:'accept', rationale:'...'}) and capture response; Query curatedGeometry:getBatchAcceptance({runId}) and assert decision/retirementUnlockedAt/operatorIdentity
  - MUST_OBSERVE: `acceptance.operatorIdentity == '<REAL_FOUNDER_CLERK_ID>'`
  - MUST_OBSERVE: `acceptance.decision == 'accepted'`
  - MUST_OBSERVE: `acceptance.decisionTimestamp matches /^20\d{2}-\d{2}-\d{2}T/`
  - MUST_OBSERVE: `typeof acceptance.retirementUnlockedAt == 'string'`
  - MUST_OBSERVE: `acceptance.retirementUnlockedAt matches /^20\d{2}-\d{2}-\d{2}T/`
  - MUST_OBSERVE: `acceptance.retirementUnlockedAt.length >= 20`
  - MUST_NOT_OBSERVE: `operatorIdentity == 's4t5-redhatfix07-operator'`
  - MUST_NOT_OBSERVE: `operatorIdentity == '' (empty)`
  - MUST_NOT_OBSERVE: `acceptance.retirementUnlockedAt == null`
  - MUST_NOT_OBSERVE: `acceptance.retirementUnlockedAt == '' (empty)`
  - MUST_NOT_OBSERVE: `resolve succeeds when no open escalation exists`
  - MUST_NOT_OBSERVE: `decisionTimestamp == null`
  - MUST_NOT_OBSERVE: `empty acceptance {}`
  - MUST_NOT_OBSERVE: `operatorIdentity == seed-shaped string`

### AC-3 — Gate evidence is durable and committed at the written_at_commit SHA

**Requirement:** GIVEN gate-results.json, gate-logs/step-1..8.log, and sprint-goal-state.json exist for the new runId WHEN the implementer commits the gate evidence and records written_at_commit THEN git show can resolve each evidence file at the recorded SHA, and git status is clean (no working-tree-only gate success)

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-04
- VERIFY: `git show <WRITTEN_AT_COMMIT>:.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/gate-results.json && git show <WRITTEN_AT_COMMIT>:.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/sprint-goal-state.json && git status --porcelain`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: gate results/logs are only present as uncommitted working-tree modifications; written_at_commit points to a SHA that does not contain gate-results.json; written_at_commit is hardcoded/static placeholder rather than a real commit containing evidence; git show success is mocked/stubbed (fabricated) rather than validated via exit_code; gate evidence references a different run_id than sprint-goal-state runId; disconnect from git history (detached/unavailable objects) makes git show impossible; evidence only exists uncommitted; written_at_commit points at SHA missing files; written_at_commit hardcoded/static placeholder; git show result mocked/stubbed (fabricated) instead of checked via exit_code; git status output ignored (disconnect) even when non-empty
- EVIDENCE: `stdout` (required_capture: True)
- CASE 1 — start_ref `redhatfix09-durable-gate-evidence`
  - ACTION (cli_user): Commit gate-results.json + gate-logs + sprint-goal-state.json; Run git show at the written_at_commit SHA for each file path; Run git status --porcelain and assert clean
  - MUST_OBSERVE: `git_show_gate_results_exit_code == 0`
  - MUST_OBSERVE: `git_show_sprint_goal_state_exit_code == 0`
  - MUST_OBSERVE: `git_show_gate_logs_resolved_count == 8`
  - MUST_OBSERVE: `git_status_porcelain_output == ''`
  - MUST_OBSERVE: `gate-results.json@'<WRITTEN_AT_COMMIT>' contains "run_id":"<NEW_RUN_ID>"`
  - MUST_NOT_OBSERVE: `fatal: path does not exist in '<SHA>'`
  - MUST_NOT_OBSERVE: `git_show_gate_results_exit_code != 0`
  - MUST_NOT_OBSERVE: `git_status_porcelain_output != '' (non-empty)`
  - MUST_NOT_OBSERVE: `modified_file_count > 0`
  - MUST_NOT_OBSERVE: `fatal path missing`

### AC-4 — Local .tmp/S5-T4 artifacts exist and match the new runId (no empty evidence pointers)

**Requirement:** GIVEN gate-results.json references .tmp/S5-T4 artifact paths WHEN the operator runs the report + top-50 harness and writes the founder gate packet THEN .tmp/S5-T4/coverage-report-accepted.json, .tmp/S5-T4/top50-manifest.json, and .tmp/S5-T4/founder-gate-packet.json exist, are non-empty, and contain the new runId

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-04/UC-VER-05
- VERIFY: `pnpm tsx scripts/geometry-coverage-report.ts --run-id=<NEW_RUN_ID> && pnpm tsx scripts/top-50-curated-review.ts --run-id=<NEW_RUN_ID> --out=.tmp/S5-T4 --limit=50`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: .tmp/S5-T4 directory is empty; artifacts contain a different runId than gate-results.json; artifacts are hand-authored shells without real API output; artifacts are fabricated/empty JSON shells (static) that do not correspond to command output; tmp artifacts missing; tmp artifacts directory is empty; runId mismatch; artifacts fabricated/static shells (mocked) rather than command output
- EVIDENCE: `file_artifact` (required_capture: True)
- CASE 1 — start_ref `redhatfix09-fresh-run-full-batch`
  - ACTION (cli_user): Generate and copy/emit coverage report JSON to .tmp/S5-T4/coverage-report-accepted.json; Generate and copy/emit top-50 manifest JSON to .tmp/S5-T4/top50-manifest.json; Assemble founder-gate-packet.json including runId, decision transcript refs, and pointers to the above
  - MUST_OBSERVE: `file .tmp/S5-T4/coverage-report-accepted.json exists && file_size_bytes > 0`
  - MUST_OBSERVE: `file .tmp/S5-T4/coverage-report-accepted.json contains '<NEW_RUN_ID>'`
  - MUST_OBSERVE: `file .tmp/S5-T4/top50-manifest.json exists && file_size_bytes > 0`
  - MUST_OBSERVE: `file .tmp/S5-T4/top50-manifest.json contains '<NEW_RUN_ID>' || top50.manifest.rows.length >= 1`
  - MUST_OBSERVE: `file .tmp/S5-T4/founder-gate-packet.json exists && file_size_bytes > 0`
  - MUST_OBSERVE: `file .tmp/S5-T4/founder-gate-packet.json contains '<NEW_RUN_ID>'`
  - MUST_OBSERVE: `tmp_file_count >= 3`
  - MUST_OBSERVE: `rg '<NEW_RUN_ID>' .tmp/S5-T4/*.json match_count >= 3`
  - MUST_OBSERVE: `file_size_bytes > 0`
  - MUST_NOT_OBSERVE: `missing files`
  - MUST_NOT_OBSERVE: `empty JSON objects`
  - MUST_NOT_OBSERVE: `runId == null`
  - MUST_NOT_OBSERVE: `file_size_bytes == 0 (empty)`
  - MUST_NOT_OBSERVE: `empty directory`

### AC-5 — Step-7 retirement evidence is row-level and Step-8 proves reversibility; no fictional symbols remain

**Requirement:** GIVEN retirement is unlocked only after accepted decision, and REDHAT-FIX-08 scrub prevents fixture contamination WHEN gate-logs step-7 and step-8 are captured and the repo is scanned for fictional symbol references THEN step-7 includes a concrete candidate list with reasons, step-8 includes unretireRoute transcript (before/after), and `rg "runFullBatchAll|coverageReportLivePublic" convex/ scripts/ .spec/` returns no matches

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-05
- VERIFY: `rg "runFullBatchAll|coverageReportLivePublic" convex/ scripts/ .spec/ && cat .spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/gate-logs/step-7.log && cat .spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/gate-logs/step-8.log`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: step-7 contains only a generic note (no candidate rows); step-7 evidence is empty [] (static placeholder) rather than real output; step-8 contains only self-attested booleans (no unretire transcript); step-8 transcript is mocked/stubbed (fabricated) with no before/after retiredAt; fictional symbol references remain anywhere in convex/, scripts/, or .spec/; rg output is hardcoded/static (disconnect) instead of real scan results; step-7/8 logs are non-observable; step-7 is empty [] (static placeholder) rather than real rows; step-8 transcript mocked/stubbed (fabricated); fictional strings remain; rg output hardcoded/static (disconnect) rather than real scan result
- EVIDENCE: `file_artifact` (required_capture: True)
- CASE 1 — start_ref `redhatfix09-durable-gate-evidence`
  - ACTION (cli_user): Run listRetirementCandidates against the accepted runId and capture output to step-7.log (include routeIds and reasons); Select one candidate, retire it (if applicable), then unretireRoute and capture before/after to step-8.log; Run rg scan to ensure no fictional symbol strings remain
  - MUST_OBSERVE: `step7_candidate_row_count >= 1`
  - MUST_OBSERVE: `step7_reason_count >= 1`
  - MUST_OBSERVE: `step8_unretire_transcript_count >= 1`
  - MUST_OBSERVE: `rg_match_count == 0`
  - MUST_NOT_OBSERVE: `step7_candidate_row_count == 0 (empty)`
  - MUST_NOT_OBSERVE: `step-7.log contains '[]' (empty list)`
  - MUST_NOT_OBSERVE: `step-7.log only contains a note without rows`
  - MUST_NOT_OBSERVE: `step-8.log only contains {"reversible":true} without evidence (static shell)`
  - MUST_NOT_OBSERVE: `rg_match_count > 0`
  - MUST_NOT_OBSERVE: `generic note-only logs`

## TEST CRITERIA (boolean — map 1:1+ to ACs)

- **TC-1** → AC-1: A fresh runId executed via waterfallOrchestrator:runFullBatch yields a persisted curatedGeometry:coverageReport source='persisted' with runFullBatch provenance
  - VERIFY: `pnpm tsx scripts/geometry-coverage-report.ts --run-id=<NEW_RUN_ID>`
- **TC-2** → AC-2: Founder acceptance uses requireFounder and legitimate state transition: requestBatchAcceptance(accept) → escalation_required → resolveBatchEscalation(accept, rationale)
  - VERIFY: `npx convex run curatedGeometry:requestBatchAcceptance '{"runId":"<NEW_RUN_ID>","decision":"accept"}' --identity '<FOUNDER_ID>' && npx convex run curatedGeometry:resolveBatchEscalation '{"runId":"<NEW_RUN_ID>","decision":"accept","rationale":"..."}' --identity '<FOUNDER_ID>'`
- **TC-3** → AC-3: Gate evidence is committed and resolvable via git show at written_at_commit; git status is clean
  - VERIFY: `git show <WRITTEN_AT_COMMIT>:.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/gate-results.json && git status --porcelain`
- **TC-4** → AC-4: .tmp/S5-T4 artifacts exist, are non-empty, and contain the new runId referenced by gate-results.json
  - VERIFY: `ls -la .tmp/S5-T4 && rg "<NEW_RUN_ID>" .tmp/S5-T4/*.json`
- **TC-5** → AC-5: Step-7/8 gate logs contain row-level retirement + unretire transcripts; repo contains zero fictional symbol references
  - VERIFY: `rg "runFullBatchAll|coverageReportLivePublic" convex/ scripts/ .spec/`

## READING LIST

- `.spec/reviews/red-hat-sprint-05-batch-acceptance-retirement-20260725T164517Z.md` (1-220): Findings F3-F6/F8-F11/G1-G4 that this task remediates
- `.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/S5-T4-founder-accept-realized-yield-review-retirement-candidates.md` (1-240): Human gate step requirements; artifacts expected
- `.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/gate-results.json` (1-220): Artifact pointers and fields that must be made real and consistent
- `.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/sprint-goal-state.json` (1-240): Remove fictional symbol refs; correct cycle counter; ensure written_at_commit is resolvable
- `convex/curatedGeometry.ts` (1513-1760): requestBatchAcceptance / resolveBatchEscalation semantics and state constraints
- `convex/waterfallOrchestrator.ts` (1147-1135): runFullBatch action and persisted coverage report stamping
- `scripts/geometry-coverage-report.ts` (1-140): How coverageReport is fetched and where local artifacts are written
- `scripts/top-50-curated-review.ts` (1-220): Manifest + gate evidence generation; ensure it runs against new runId and identity
- `tools/gate/deriveSprint05GoalState.ts` (1-220): Goal-state fail-closed semantics and fields that must match the committed evidence

## GUARDRAILS

### WRITE-ALLOWED

- .spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/gate-results.json (MODIFY — new runId + real pointers)
- .spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/gate-logs/step-1.log..step-8.log (MODIFY — real transcripts, row-level evidence)
- .spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/sprint-goal-state.json (MODIFY — correct symbols, runId, cycle counter, written_at_commit)
- scripts/top-50-curated-review.ts and scripts/geometry-coverage-report.ts (MODIFY minimal if needed to write .tmp/S5-T4 artifacts)
- .tmp/S5-T4/*.json (WRITE — local artifacts; do not commit unless repo policy says otherwise)

### WRITE-PROHIBITED

- react-native/**
- changing Convex acceptance state machine semantics (that is already implemented); only exercise and evidence it
- fabricating evidence by editing JSON without corresponding command output
- using fictional symbols or seed/test identities as founder proof

## CODE PATTERN

**Pattern:** Run real entry points → capture stdout/JSON transcripts → write gate logs/results/goal-state → commit and verify resolvability via git show → verify no fictional symbols via ripgrep.

**Pattern source:** Sprint 04 .gate-evidence precedent; tools/gate/deriveSprint05GoalState.ts; scripts/geometry-coverage-report.ts; scripts/top-50-curated-review.ts

**Anti-pattern:** Working-tree-only passing evidence, reusing rejected runIds, fictional symbol references, note-only step logs, and seed-shaped founder identities

### Interaction notes

- This task is evidence integrity + real execution. The output is committed artifacts and transcripts, not new product behavior.
- The founder identity must be real: requireFounder must pass. Use `npx convex run ... --identity '<json>'` with the founder's actual Clerk subject in the dev deployment, not a synthetic s4t* string.
- If the full-batch routeIds membership list is not already available, implement the smallest possible helper (script or internal query+action) to enumerate batch membership without exceeding Convex limits; keep scope strictly bounded to enabling runFullBatch execution.

## DESIGN REFERENCES

- Red-hat review findings F3-F6, F8-F11, F15-F18, G1-G4
- S5-T4 human gate requirements
- deriveSprint05GoalState fail-closed semantics
- curatedGeometry acceptance state machine rules

## VERIFICATION GATES

| Gate | Command | Expected |
|---|---|---|
| No fictional symbols anywhere | `rg "runFullBatchAll|coverageReportLivePublic" convex/ scripts/ .spec/` | 0 matches |
| Fresh runId (not previously rejected) used everywhere | `rg "s5-full-batch-redhatfix07-20260725T075100Z" .spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/` | 0 matches (after evidence refresh), or matches only in archived prev-cycle files clearly labeled |
| Coverage report is persisted and accessible | `pnpm tsx scripts/geometry-coverage-report.ts --run-id=<NEW_RUN_ID>` | Outputs source=persisted and runId=<NEW_RUN_ID> |
| Typecheck | `pnpm type-check` | Exit 0 |
| Lint | `pnpm exec biome check convex scripts` | Exit 0 |
| Durable evidence resolvable at written_at_commit | `git show <WRITTEN_AT_COMMIT>:.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/gate-results.json` | Resolves (no fatal missing path) |

## AGENT ASSIGNMENT

- Implementer: `convex-implementer`
- Reviewer: `convex-reviewer`
- Rationale: This remediation is a backend+evidence integrity task: run real Convex entry points, capture real mutation transcripts, and commit durable gate artifacts. It also requires cleaning fictional symbol references from .spec evidence and ensuring the acceptance state machine is legitimate and non-replayable. No RN UI changes.
- Proposed by: `convex-planner` (RULES.md#Agent Dispatch (prior REDHAT-FIX expansions proposed_by: convex-planner))

## AGENT INSTRUCTIONS (TDD flow)

1. Read READING LIST and CRITICAL CONSTRAINTS.
2. RED: write failing integration tests per AC scenarios (public_api seeds). Capture RED evidence.
3. GREEN: implement minimal code to pass ACs.
4. REFACTOR: clean up without weakening oracles.
5. Run all VERIFICATION GATES; paste evidence into the task PR/notes.

## ORCHESTRATOR VERIFICATION PROTOCOL

- Confirm `proposed_by` is a specialist (not orchestrator).
- Confirm every AC scenario passes `validate_scenario` (zero CRITICAL).
- Confirm PRIMARY AC is integration/e2e with real Convex deployment.
- Confirm REQUIREMENT-CONTRACT block present and parseable.

## EVIDENCE GATES

- RED evidence: failing test output before implementation for each behavioral AC.
- GREEN evidence: passing `npx vitest run` for cited integration files.
- Static guards: any `rg` gates in VERIFICATION GATES must match expected.

## REVIEW CRITERIA

- No stubs/mocks as primary proof.
- Negative controls would fail on truncation/fabrication/seed identity.
- WRITE-ALLOWED respected; no RN UI scope creep.

## DEPENDENCIES

- depends_on: REDHAT-FIX-08
- blocks: Sprint 05 gate durability (re-acceptance) and Sprint 10 unblocking based on accepted catalog

## CODING STANDARDS

- convex/_generated/ai/guidelines.md
- brain/docs/CONVEX-RULES.md
- Honesty rule: no fabricated evidence; durable commit chain required; negative controls must remain meaningful

## NOTES

This task remediates red-hat evidence failures: staged/undurable artifacts, fictional entrypoint references, seed-shaped founder identity, invalid runId replay, and missing row-level retirement/unretire evidence. It must be executed after REDHAT-FIX-08 so coverageReport/top-50 are truthful and uncontaminated.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-09",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "redhatfix09-fresh-run-full-batch": {
      "description": "Real full batch execution on Convex dev deployment producing a persisted coverage_report artifact for a NEW runId.",
      "seed_method": "public_api",
      "records": [
        "Choose a fresh runId: s5-full-batch-redhatfix09-<ISO8601Z> (must not equal the previously rejected runId).",
        "Run waterfallOrchestrator:runFullBatch with real operator identity and real routeIds membership for the batch; capture stdout transcript (including runId, isDone, continueCursor, cumulativeCostUSD).",
        "Verify persisted report exists: curatedGeometry:coverageReport({runId}) returns source='persisted' and includes reportProvenance.producedBy='runFullBatch'."
      ]
    },
    "redhatfix09-real-founder-acceptance": {
      "description": "Real founder identity executes requestBatchAcceptance and resolveBatchEscalation for the new runId with captured mutation transcripts.",
      "seed_method": "public_api",
      "records": [
        "Call curatedGeometry:requestBatchAcceptance({runId, decision:'accept'}) with founder identity; capture JSON response containing decisionTimestamp and operatorIdentity.",
        "If escalations exist, observe decision='escalation_required' and retirementUnlockedAt==null; then call curatedGeometry:resolveBatchEscalation({runId, decision:'accept', rationale:'...'}) with founder identity; capture JSON response."
      ]
    },
    "redhatfix09-durable-gate-evidence": {
      "description": "Committed durable gate packet: gate-results.json + 8 step logs + sprint-goal-state.json updated to new runId and correct symbols.",
      "seed_method": "public_api",
      "records": [
        "Write/update .spec/.../gate-results.json run_id to new runId and ensure artifact pointers refer to real local .tmp/S5-T4 files.",
        "Write/update .spec/.../gate-logs/step-1..8.log with real transcripts and no fictional symbol names.",
        "Write/update .spec/.../sprint-goal-state.json with written_at_commit set to the commit SHA containing the above files, and cycle counter corrected."
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN a new runId WHEN runFullBatch executes THEN coverageReport(runId) returns persisted report with runFullBatch provenance",
      "verify": "npx convex run waterfallOrchestrator:runFullBatch '<json>' && pnpm tsx scripts/geometry-coverage-report.ts --run-id=<NEW_RUN_ID>",
      "test_tier": "integration",
      "flow_ref": "UC-REC-04",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "runId reused from a previously rejected artifact",
            "runFullBatch is not invoked (or invoked via fictional symbol)",
            "runFullBatch stdout is mocked/stubbed (fabricated runId) rather than a real Convex execution",
            "coverageReport is read from live unscoped scan rather than persisted runId branch",
            "coverageReport response is hardcoded/static shell (empty report) not persisted",
            "persisted report missing reportProvenance producedBy='runFullBatch'",
            "disconnect from Convex dev deployment returns cached/static JSON",
            "fictional entry point used",
            "runId reused",
            "runFullBatch output mocked/stubbed (fabricated) instead of real Convex execution",
            "coverageReport response hardcoded/static (empty) instead of persisted"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix09-fresh-run-full-batch",
            "action": {
              "actor": "cli_user",
              "steps": [
                "Run waterfallOrchestrator:runFullBatch with a new runId",
                "Run curatedGeometry:coverageReport({runId}) and capture JSON",
                "Assert source=='persisted' and runId matches"
              ]
            },
            "end_state": {
              "must_observe": [
                "coverageReport.source == 'persisted'",
                "coverageReport.runId == '<NEW_RUN_ID>'",
                "coverageReport.reportProvenance.producedBy == 'runFullBatch'",
                "coverageReport.runId contains 's5-full-batch-redhatfix09-'"
              ],
              "must_not_observe": [
                "coverageReport.source == 'live' for the acceptance packet",
                "coverageReport.runId == '' (empty)",
                "coverageReport == {} (empty)",
                "runId == 's5-full-batch-redhatfix07-20260725T075100Z'",
                "runId == old rejected runId"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "A fresh runId executed via waterfallOrchestrator:runFullBatch yields a persisted curatedGeometry:coverageReport source='persisted' with runFullBatch provenance",
      "maps_to_ac": "AC-1",
      "verify": "pnpm tsx scripts/geometry-coverage-report.ts --run-id=<NEW_RUN_ID>"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN a persisted run WHEN founder accepts THEN acceptance uses real founder identity and legitimate escalation_required \u2192 resolve path with rationale",
      "verify": "npx convex run curatedGeometry:requestBatchAcceptance '{\"runId\":\"<NEW_RUN_ID>\",\"decision\":\"accept\"}' --identity '<FOUNDER_ID>' && npx convex run curatedGeometry:resolveBatchEscalation '{\"runId\":\"<NEW_RUN_ID>\",\"decision\":\"accept\",\"rationale\":\"...\"}' --identity '<FOUNDER_ID>'",
      "test_tier": "integration",
      "flow_ref": "UC-REC-04",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "operatorIdentity is a seed/test subject (e.g. s4t5-*)",
            "resolveBatchEscalation succeeds without a prior escalation_required state",
            "requestBatchAcceptance performed by non-founder identity (requireFounder bypassed)",
            "reused runId that was previously rejected",
            "acceptance record is mocked/stubbed (fabricated operatorIdentity/decision) rather than written by real mutations",
            "retirementUnlockedAt is hardcoded/static placeholder (fabricated) rather than derived from real acceptance",
            "acceptance response is an empty/static shell (empty object) that still passes loose checks",
            "requireFounder bypassed",
            "resolve without open escalation",
            "acceptance response mocked/stubbed (fabricated) rather than created by real mutations",
            "operatorIdentity hardcoded/static seed-shaped string",
            "acceptance is empty {} (empty) but still treated as pass"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix09-real-founder-acceptance",
            "action": {
              "actor": "user",
              "steps": [
                "As founder identity, call requestBatchAcceptance({runId, decision:'accept'}) and capture response",
                "If response.decision=='escalation_required', call resolveBatchEscalation({runId, decision:'accept', rationale:'...'}) and capture response",
                "Query curatedGeometry:getBatchAcceptance({runId}) and assert decision/retirementUnlockedAt/operatorIdentity"
              ]
            },
            "end_state": {
              "must_observe": [
                "acceptance.operatorIdentity == '<REAL_FOUNDER_CLERK_ID>'",
                "acceptance.decision == 'accepted'",
                "acceptance.decisionTimestamp matches /^20\\d{2}-\\d{2}-\\d{2}T/",
                "typeof acceptance.retirementUnlockedAt == 'string'",
                "acceptance.retirementUnlockedAt matches /^20\\d{2}-\\d{2}-\\d{2}T/",
                "acceptance.retirementUnlockedAt.length >= 20"
              ],
              "must_not_observe": [
                "operatorIdentity == 's4t5-redhatfix07-operator'",
                "operatorIdentity == '' (empty)",
                "acceptance.retirementUnlockedAt == null",
                "acceptance.retirementUnlockedAt == '' (empty)",
                "resolve succeeds when no open escalation exists",
                "decisionTimestamp == null",
                "empty acceptance {}",
                "operatorIdentity == seed-shaped string"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Founder acceptance uses requireFounder and legitimate state transition: requestBatchAcceptance(accept) \u2192 escalation_required \u2192 resolveBatchEscalation(accept, rationale)",
      "maps_to_ac": "AC-2",
      "verify": "npx convex run curatedGeometry:requestBatchAcceptance '{\"runId\":\"<NEW_RUN_ID>\",\"decision\":\"accept\"}' --identity '<FOUNDER_ID>' && npx convex run curatedGeometry:resolveBatchEscalation '{\"runId\":\"<NEW_RUN_ID>\",\"decision\":\"accept\",\"rationale\":\"...\"}' --identity '<FOUNDER_ID>'"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN gate artifacts WHEN committed THEN written_at_commit resolves them via git show and working tree is clean",
      "verify": "git show <WRITTEN_AT_COMMIT>:<path> && git status --porcelain",
      "test_tier": "integration",
      "flow_ref": "UC-REC-04",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "gate results/logs are only present as uncommitted working-tree modifications",
            "written_at_commit points to a SHA that does not contain gate-results.json",
            "written_at_commit is hardcoded/static placeholder rather than a real commit containing evidence",
            "git show success is mocked/stubbed (fabricated) rather than validated via exit_code",
            "gate evidence references a different run_id than sprint-goal-state runId",
            "disconnect from git history (detached/unavailable objects) makes git show impossible",
            "evidence only exists uncommitted",
            "written_at_commit points at SHA missing files",
            "written_at_commit hardcoded/static placeholder",
            "git show result mocked/stubbed (fabricated) instead of checked via exit_code",
            "git status output ignored (disconnect) even when non-empty"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix09-durable-gate-evidence",
            "action": {
              "actor": "cli_user",
              "steps": [
                "Commit gate-results.json + gate-logs + sprint-goal-state.json",
                "Run git show at the written_at_commit SHA for each file path",
                "Run git status --porcelain and assert clean"
              ]
            },
            "end_state": {
              "must_observe": [
                "git_show_gate_results_exit_code == 0",
                "git_show_sprint_goal_state_exit_code == 0",
                "git_show_gate_logs_resolved_count == 8",
                "git_status_porcelain_output == ''",
                "gate-results.json@'<WRITTEN_AT_COMMIT>' contains \"run_id\":\"<NEW_RUN_ID>\""
              ],
              "must_not_observe": [
                "fatal: path does not exist in '<SHA>'",
                "git_show_gate_results_exit_code != 0",
                "git_status_porcelain_output != '' (non-empty)",
                "modified_file_count > 0",
                "fatal path missing"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Gate evidence is committed and resolvable via git show at written_at_commit; git status is clean",
      "maps_to_ac": "AC-3",
      "verify": "git show <WRITTEN_AT_COMMIT>:.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/gate-results.json && git status --porcelain"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN gate-results artifact pointers WHEN artifacts are generated THEN .tmp/S5-T4 JSON files exist, are non-empty, and match runId",
      "verify": "ls -la .tmp/S5-T4 && rg \"<NEW_RUN_ID>\" .tmp/S5-T4/*.json",
      "test_tier": "integration",
      "flow_ref": "UC-REC-04/UC-VER-05",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            ".tmp/S5-T4 directory is empty",
            "artifacts contain a different runId than gate-results.json",
            "artifacts are hand-authored shells without real API output",
            "artifacts are fabricated/empty JSON shells (static) that do not correspond to command output",
            "tmp artifacts missing",
            "tmp artifacts directory is empty",
            "runId mismatch",
            "artifacts fabricated/static shells (mocked) rather than command output"
          ]
        },
        "evidence": {
          "artifact_type": "file_artifact",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix09-fresh-run-full-batch",
            "action": {
              "actor": "cli_user",
              "steps": [
                "Generate and copy/emit coverage report JSON to .tmp/S5-T4/coverage-report-accepted.json",
                "Generate and copy/emit top-50 manifest JSON to .tmp/S5-T4/top50-manifest.json",
                "Assemble founder-gate-packet.json including runId, decision transcript refs, and pointers to the above"
              ]
            },
            "end_state": {
              "must_observe": [
                "file .tmp/S5-T4/coverage-report-accepted.json exists && file_size_bytes > 0",
                "file .tmp/S5-T4/coverage-report-accepted.json contains '<NEW_RUN_ID>'",
                "file .tmp/S5-T4/top50-manifest.json exists && file_size_bytes > 0",
                "file .tmp/S5-T4/top50-manifest.json contains '<NEW_RUN_ID>' || top50.manifest.rows.length >= 1",
                "file .tmp/S5-T4/founder-gate-packet.json exists && file_size_bytes > 0",
                "file .tmp/S5-T4/founder-gate-packet.json contains '<NEW_RUN_ID>'",
                "tmp_file_count >= 3",
                "rg '<NEW_RUN_ID>' .tmp/S5-T4/*.json match_count >= 3",
                "file_size_bytes > 0"
              ],
              "must_not_observe": [
                "missing files",
                "empty JSON objects",
                "runId == null",
                "file_size_bytes == 0 (empty)",
                "empty directory"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": ".tmp/S5-T4 artifacts exist, are non-empty, and contain the new runId referenced by gate-results.json",
      "maps_to_ac": "AC-4",
      "verify": "ls -la .tmp/S5-T4 && rg \"<NEW_RUN_ID>\" .tmp/S5-T4/*.json"
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN retirement unlocked WHEN step-7/8 captured THEN row-level candidate list + unretire transcript exist, and fictional symbol strings are absent repo-wide",
      "verify": "rg \"runFullBatchAll|coverageReportLivePublic\" convex/ scripts/ .spec/",
      "test_tier": "integration",
      "flow_ref": "UC-REC-05",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "step-7 contains only a generic note (no candidate rows)",
            "step-7 evidence is empty [] (static placeholder) rather than real output",
            "step-8 contains only self-attested booleans (no unretire transcript)",
            "step-8 transcript is mocked/stubbed (fabricated) with no before/after retiredAt",
            "fictional symbol references remain anywhere in convex/, scripts/, or .spec/",
            "rg output is hardcoded/static (disconnect) instead of real scan results",
            "step-7/8 logs are non-observable",
            "step-7 is empty [] (static placeholder) rather than real rows",
            "step-8 transcript mocked/stubbed (fabricated)",
            "fictional strings remain",
            "rg output hardcoded/static (disconnect) rather than real scan result"
          ]
        },
        "evidence": {
          "artifact_type": "file_artifact",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix09-durable-gate-evidence",
            "action": {
              "actor": "cli_user",
              "steps": [
                "Run listRetirementCandidates against the accepted runId and capture output to step-7.log (include routeIds and reasons)",
                "Select one candidate, retire it (if applicable), then unretireRoute and capture before/after to step-8.log",
                "Run rg scan to ensure no fictional symbol strings remain"
              ]
            },
            "end_state": {
              "must_observe": [
                "step7_candidate_row_count >= 1",
                "step7_reason_count >= 1",
                "step8_unretire_transcript_count >= 1",
                "rg_match_count == 0"
              ],
              "must_not_observe": [
                "step7_candidate_row_count == 0 (empty)",
                "step-7.log contains '[]' (empty list)",
                "step-7.log only contains a note without rows",
                "step-8.log only contains {\"reversible\":true} without evidence (static shell)",
                "rg_match_count > 0",
                "generic note-only logs"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Step-7/8 gate logs contain row-level retirement + unretire transcripts; repo contains zero fictional symbol references",
      "maps_to_ac": "AC-5",
      "verify": "rg \"runFullBatchAll|coverageReportLivePublic\" convex/ scripts/ .spec/"
    }
  ],
  "proposed_by": "convex-planner",
  "touches_capabilities": [
    "CAP-GEO-04"
  ],
  "provides": [
    "fresh_runFullBatch_runId_with_persisted_coverageReport",
    "legitimate_founder_acceptance_state_machine_transcript",
    "durable_committed_gate-results_and_gate-logs_and_sprint-goal-state",
    "real_tmp_S5T4_artifacts_packet_present",
    "row_level_retirement_candidates_and_unretire_transcript_committed"
  ],
  "consumes": [
    "REDHAT-FIX-08 exhaustive + hygiene-correct coverageReport and top-50 export",
    "Real entrypoints: waterfallOrchestrator:runFullBatch and curatedGeometry:coverageReport",
    "Founder-only mutations: curatedGeometry:requestBatchAcceptance and curatedGeometry:resolveBatchEscalation",
    "Top-50 export: top50Review:exportTop50Manifest and scripts/top-50-curated-review.ts",
    "deriveSprint05GoalState tool for goal-state derivation (tools/gate/deriveSprint05GoalState.ts)"
  ],
  "boundary_contracts": [
    "A rejected runId MUST NOT be reused as accepted evidence. A fresh runId is required for any acceptance after a rejection (honest state machine).",
    "Gate evidence MUST be durable: gate-results.json, all 8 gate logs, and sprint-goal-state.json must be committed at a SHA that written_at_commit resolves via git show.",
    "Founder acceptance MUST use real authenticated founder identity (requireFounder), not a seed-shaped or non-existent operatorIdentity string.",
    "Documented entry points MUST be real (no runFullBatchAll / coverageReportLivePublic references anywhere in convex/, scripts/, or .spec/).",
    "Step-7 and Step-8 gate evidence MUST be row-level and recomputable: retirement candidates list with per-route reasons + unretireRoute transcript proving reversibility."
  ]
}
-->
<!-- /REQUIREMENT-CONTRACT -->
