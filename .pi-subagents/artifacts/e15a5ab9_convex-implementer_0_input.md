# Task for convex-implementer

You are implementing the CRITICAL "couch-gate forgeability" remediation in the LaneShadow-RN Convex backend (Sprint 04 trust pipeline, REDHAT-FIX-03/04/10 + the couch-fixture portion of FIX-08). An adversarial red-hat review found the founder couch gate is forgeable: any authenticated user can record a PASS over arbitrary routeIds and unlock the full `--all` batch. The gate is NOT achieved until this is fixed with REAL tests.

**Working directory:** /Users/inference1/Projects/LaneShadow-RN
**Backend root:** convex/
**Stack:** Convex ^1.41.0, TypeScript, Vitest. Commands: `pnpm test` (Vitest; S4 integration tests are slow — ~7min), `pnpm type-check`, `pnpm lint` (Biome).

**MANDATORY FIRST STEPS:**
1. Read `convex/_generated/ai/guidelines.md` fully — it overrides stale Convex patterns.
2. Read the authoritative review: `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260720T160338Z.md` (FIX-03/04/10 entries, with file:line citations).
3. Read the S4-T6 task spec: `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/S4-T6-couch-sample-assembler-25-stratified-recordcouchverdict-co.md`.
4. Read these files fully before editing: `convex/couchVerdict.ts`, `convex/couchSampleAssembler.ts`, `convex/schema.ts` (couch_samples + couch_verdicts tables, ~lines 323-365), `convex/guards.ts` (requireOperator/requireFounder already exist from FIX-06).

## The defect (confirmed in code)
- `recordCouchVerdict` (couchVerdict.ts:51) only rejects empty routeVerdicts and a pass containing `wrong`; it does NOT load/validate a stored sample, does NOT require exact one-to-one membership, does NOT bind to a catalog/geometry snapshot/version, does NOT verify the sample is frozen/active. Any operator can pass arbitrary routeIds. (`requireOperator` from FIX-06 is already wired — good.)
- `storeCouchSample` (couchSampleAssembler.ts:523) validates only size/provenance presence, not route existence, uniqueness, gate-pass, or immutable export.
- `couchGateStatus` (couchVerdict.ts:128) accepts the newest stored pass with no current-sample/membership/version binding.
- `seedCouchFixtures`/`teardownCouchFixtures`/`clearCouchVerdicts` are public mutations any operator can use to manufacture/erase production trust evidence (FIX-08 couch portion).

## What to implement (RED→GREEN TDD, ONE COMMIT PER FIX)

### FIX-10 — couch samples become immutable, hash-bound manifests of REAL gate-passing routes
- Enhance the `couch_samples` table (migration-safe: add optional fields first) with: `manifestHash` (string, computed server-side from sorted member routeIds + per-route geometry hash + catalog version), `catalogVersion` (string|number), `status` (`'draft'|'frozen'`), `frozenAt`, `frozenBy` (operator identity), and a per-member `{ routeId, geometryHash, verdict? }` structure (or a parallel `couch_sample_members` table — your call, but it must enforce EXACT UNIQUE membership).
- `storeCouchSample`: validate every `routeId` EXISTS in `curated_routes` AND has gate-passing geometry (`curated_route_geometry.verification.verdict === 'pass'`); reject duplicates and non-members; compute the per-route geometry hash + manifest hash SERVER-SIDE; then freeze (`status:'frozen'`, set manifestHash/frozenAt/frozenBy). Once frozen, the manifest is IMMUTABLE — reject re-freeze/mutation of a frozen manifest.

### FIX-03 + FIX-04 — verdicts are bound to a frozen manifest with exact membership + reviewer identity (append-only)
- `recordCouchVerdict`: load the FROZEN manifest by `sampleId`; reject if not found or not frozen. Verify the submitted `routeVerdicts` cover the manifest's membership EXACTLY (same set, no missing, no extras, no duplicates). Record the binding `manifestHash` + `catalogVersion` on the verdict doc; record `recordedBy` (operator/founder identity from FIX-06). Make verdicts APPEND-ONLY (do not silently `replace` prior verdicts — keep history; `couchGateStatus` reads the latest). Reject a `pass` whose routeVerdict set does not exactly match the frozen manifest.
- `couchGateStatus`: only report `allowed:true` from the latest verdict bound to the CURRENT active/frozen manifest whose `catalogVersion` matches the live catalog; if the manifest's geometry/catalog version has drifted since the verdict, block (`reason` explaining drift).

### FIX-08 (couch portion) — fixture/cleanup seams cannot manufacture or erase production trust evidence
- Make `seedCouchFixtures`, `teardownCouchFixtures`, `clearCouchVerdicts`, and any couch fixture mutations either `internalMutation` (test/dev-only, not callable via `npx convex run` by authenticated clients) OR require `requireFounder` AND a server-issued test-environment signal (e.g. an env-gated flag). Prefer `internalMutation` for the pure-fixture ones so production callers cannot seed/erase trust evidence. Keep them callable from tests via `ctx.runMutation(internal...)`.

## Hard constraints
- **TDD per fix:** write a failing test FIRST (Vitest in `convex/__tests__/`), confirm it fails for the right reason, then implement to GREEN. ONE commit per fix. Tests must exercise the FORGERY rejection (e.g. wrong routeId set, non-frozen manifest, mutated manifest, drift) — not just the happy path.
- **MUST run the FULL S4 integration suite before reporting** (`pnpm exec vitest run convex/__tests__/S4T1- convex/__tests__/S4T2- convex/__tests__/S4T3- convex/__tests__/S4T4- convex/__tests__/S4T5- convex/__tests__/S4T6- convex/__tests__/S4T7-`) and FIX any regressions your changes cause. The existing S4-T6 tests likely use the old forgeable flow — UPDATE them to the new bound flow (legitimately; the old flow was the defect). Do NOT just skip tests to go green. Note: ~3 S4T5/S4T2 "review-queue" tests are pre-existing flaky due to stale dev data + a broken teardown (`teardownWaterfallFixtures` throws "Too many bytes read") — if those are your ONLY failures and they're the known flaky REVIEW-queue ones (reviewQueue.length window), note them but don't block on them.
- **Commit messages:** `fix(S4-T6): immutable couch sample manifest of real gate-passing routes (REDHAT-FIX-10)`, `fix(S4-T6): bind verdict to frozen manifest with exact membership (REDHAT-FIX-03/04)`, `fix(S4-T6): gate couch fixture/cleanup seams to internal-only (REDHAT-FIX-08)`.
- **Do NOT touch** `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/.gate-evidence/` or regenerate gate-results JSON. The human founder gate + live-provider run are OUT OF SCOPE.
- **Do NOT mark the sprint goal `met`/`complete`** in any state file.
- Run `pnpm type-check` before each commit (must pass). You are the SOLE writer of couchVerdict.ts/couchSampleAssembler.ts/schema.ts this turn.
- If you cannot complete all fixes within budget, COMMIT what's done coherently (green + type-checked) and report exactly what remains with file:line.

## Stop condition & report
Stop when FIX-10/03/04 + couch-FIX-08 are implemented, tested (RED→GREEN), full-suite-checked (with regressions fixed or explicitly identified as pre-existing flaky), type-checked clean, committed.
Report:
1. Per fix: commit hash, test file(s), RED→GREEN evidence, key files changed.
2. `pnpm type-check` result.
3. FULL S4 suite result (pass/fail counts) — and which failures (if any) are the known pre-existing flaky REVIEW-queue ones vs. real regressions you fixed.
4. The schema changes you made (new fields/tables) so I can verify migration-safety.
5. Any fix you could NOT complete and exactly why (file:line).
6. Confirm you did NOT touch gate-evidence or mark the sprint goal.

## Acceptance Contract
Acceptance level: reviewed
Completion is not accepted from prose alone. End with a structured acceptance report.

Criteria:
- criterion-1: Implement the requested change without widening scope
- criterion-2: Return evidence sufficient for an independent acceptance review

Required evidence: changed-files, tests-added, commands-run, validation-output, residual-risks, no-staged-files

Review gate: required by reviewer.

Finish with a fenced JSON block tagged `acceptance-report` in this shape:
Use empty arrays when no items apply; array fields contain strings unless object entries are shown.
`criteriaSatisfied[].status` must be exactly one of: satisfied, not-satisfied, not-applicable.
`commandsRun[].result` must be exactly one of: passed, failed, not-run.
`manualNotes` and `notes` are optional strings; an empty string means no note and does not satisfy `manual-notes` evidence.
```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "specific proof"
    },
    {
      "id": "criterion-2",
      "status": "satisfied",
      "evidence": "specific proof"
    }
  ],
  "changedFiles": [
    "src/file.ts"
  ],
  "testsAddedOrUpdated": [
    "test/file.test.ts"
  ],
  "commandsRun": [
    {
      "command": "command",
      "result": "passed",
      "summary": "short result"
    }
  ],
  "validationOutput": [
    "validation output or concise summary"
  ],
  "residualRisks": [
    "none"
  ],
  "noStagedFiles": true,
  "diffSummary": "short description of the diff",
  "reviewFindings": [
    "blocker: file.ts:12 - issue found, or no blockers"
  ],
  "manualNotes": "anything else the parent should know"
}
```