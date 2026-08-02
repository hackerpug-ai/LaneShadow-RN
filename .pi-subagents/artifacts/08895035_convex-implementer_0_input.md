# Task for convex-implementer

You are implementing high-priority correctness/security fixes in the LaneShadow-RN Convex backend. This is wave 1 of remediation for Sprint 04 (trust pipeline), which an adversarial red-hat review found has defects that make its claimed GATE-GOAL untrustworthy. The sprint goal is NOT achieved until these are fixed with REAL tests.

**Working directory:** /Users/inference1/Projects/LaneShadow-RN
**Backend root:** convex/
**Stack:** Convex ^1.41.0, TypeScript, Vitest. Commands: `pnpm test` (Vitest), `pnpm type-check`, `pnpm lint` (Biome).

**MANDATORY FIRST STEP:** Read `convex/_generated/ai/guidelines.md` fully before writing any Convex code — it overrides stale training-data patterns. Follow it exactly. Also read `convex/schema.ts` for the data model and `convex/guards.ts` for the auth model.

**Context — read these for full detail with file:line citations:**
- `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260720T160338Z.md` (authoritative review; findings quoted below)
- `.spec/reviews/red-hat-sprint-04-2026-07-19T23-11-00Z.md`
- `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/SPRINT.md` (REDHAT-FIX rows)

## Scope — implement these FOUR fixes (RED→GREEN TDD, ONE COMMIT PER FIX)

### FIX-07 (HIGH) — canonical geometry gate must enforce in-region anchors for NEW geometry
`determineGateVerdict` in `convex/curatedGeometryGate.ts` only checks `anchorCount`; the ≤150mi distance filter exists ONLY in `reevaluateExistingGeometry` (~:138-152). New geometry from the levers can pass with off-region anchors.
- **Fix:** Make `determineGateVerdict` enforce the in-region anchor rule. Accept measured anchors (or an in-region count) and require ≥2 anchors within 150mi of the centroid — the SAME rule `reevaluateExistingGeometry` uses. Apply this canonical verdict to every lever (Lever 1 promote, Lever 2 reconstruct, Lever 3 reroute) and the persisted-geometry sweep.
- Update ALL callers of `determineGateVerdict` to pass the measured anchors/in-region data so the verdict is real (search the repo for call sites).
- **Test (RED first):** new geometry with `anchorCount>=2` but anchors OUTSIDE 150mi returns `{verdict:'review', failedCondition:'anchors'}`; new geometry with ≥2 in-region anchors + good ratio passes.

### FIX-05 (CRITICAL) — REVIEW approval must re-run the canonical gate, not forge a pass
`approveDisposition` in `convex/reviewQueue.ts` (~:235-315) stamps `verdict:'pass'`, `provenance:'scraped_promoted'`, and sets `riderReady:true` WITHOUT decoding/measuring geometry or calling the canonical gate.
- **Fix:** On approval, server-side re-measure the exact candidate geometry and run the canonical gate (`determineGateVerdict`/`reevaluateExistingGeometry` with FIX-07 applied). If the candidate FAILS the canonical gate, it STAYS in REVIEW — do NOT write `verdict:'pass'`; do NOT set `riderReady:true`. Recompute `riderReady` from the real verdict. Preserve ACTUAL provenance (do not hardcode `'scraped_promoted'`).
- If a founder manual override is still permitted for failing geometry: founder-only (FIX-06), explicitly override-labelled (e.g. `geometryStatus:'override'`, separate audit field + rationale), auditable. It must NOT silently set `riderReady:true` for gate-failing geometry.
- **Test (RED first):** approving a REVIEW candidate whose geometry fails the canonical gate does NOT produce `verdict:'pass'`/`riderReady:true` (stays REVIEW or recorded as labelled override).

### FIX-06 (HIGH) — operational mutations must be AUTHORIZED, not just authenticated
`requireIdentity` in `convex/guards.ts` (~:15-28) is a pure existence check returning `{clerkUserId, tokenIdentifier}` with NO role/capability decision. REVIEW/couch/waterfall/classifier operational entry points rely on it.
- **Fix:** Add a server-owned founder/operator role model based on canonical user/org data. Add `requireFounder(ctx)` / `requireOperator(ctx)` (or `requireRole(ctx, role)`) that resolve the authenticated identity's role from REAL Convex data — look up the users/session table (read `convex/schema.ts`, `shared/models/users.ts`); do NOT invent a role from a client arg. If no canonical role field exists, add the minimal schema + deterministic role source (e.g. an `operator_clerk_user_ids` allowlist table or a `role` field on users). Keep it server-owned and auditable.
- Wire operational mutations that CHANGE TRUST STATE to require the role: `approveDisposition`/`retireDisposition`/`retryDisposition` (reviewQueue.ts), `recordCouchVerdict`/`clearCouchVerdict` (couchVerdict.ts). (Fixture/cleanup seams FIX-08 is a later wave.)
- **Test (RED first):** an authenticated non-operator calling `approveDisposition`/`recordCouchVerdict` is rejected (role denied); an operator/founder succeeds.

### FIX-02 (HIGH) — `classifyCatalog` must actually enumerate the whole catalog
`classifyCatalog` in `convex/actions/rideWorthinessClassifier.ts` (~:226-265) computes `routeIds ?? []` and returns `{classified:0, failed:0, results:[]}` when no IDs supplied — a silent no-op. S4-T4 requires whole-catalog coverage.
- **Fix:** When `routeIds` is omitted, enumerate ALL eligible routes from `curated_routes` via bounded indexed pagination (use an index; cap batch size for Convex action limits). Add durable checkpoint/completion data (a table tracking progress + a completion condition that fails while eligible routes remain unclassified) and coverage totals in the result. Server-controlled full-catalog dispatch. Per-route failures must not abort the batch (log + continue — existing behavior).
- **Test (RED first):** calling `classifyCatalog` with NO routeIds over a seeded catalog actually classifies eligible routes (classified > 0, coverage reflects total eligible), and the completion condition reflects remaining unclassified routes.

## Hard constraints
- **TDD per fix:** write a failing test FIRST (Vitest in `convex/__tests__/`), confirm it fails for the right reason, then implement to GREEN. ONE commit per fix (test + impl together).
- **Commit messages:** `fix(S4-T1): enforce in-region anchors in canonical gate (REDHAT-FIX-07)`, `fix(S4-T5): REVIEW approval re-runs canonical gate (REDHAT-FIX-05)`, `fix(S4-T5): add founder/operator authorization (REDHAT-FIX-06)`, `fix(S4-T4): classifyCatalog enumerates whole catalog (REDHAT-FIX-02)`.
- **Do NOT touch** anything under `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/.gate-evidence/` or regenerate any gate-results/evidence JSON. The gate RUN (founder couch review + live Google/LLM providers) is OUT OF SCOPE — a human action; do NOT attempt or forge it.
- **Do NOT mark the sprint goal `met`/`complete`** in any state file. Code fixes only.
- Keep changes minimal & coherent; no unrelated refactors. Run `pnpm type-check` + relevant Vitest tests before each commit; they must pass.
- You are the SOLE writer of these files this turn — no parallel writers.

## Stop condition & report
Stop when all four fixes are implemented, tested (RED→GREEN shown), type-checked clean, committed — OR when you hit a genuine blocker (e.g. schema change needing human sign-off); in that case commit what's done and report precisely.
Report back:
1. Per fix: commit hash, test file(s) added, RED→GREEN evidence, key files changed.
2. `pnpm type-check` result.
3. Relevant Vitest results.
4. Any fix you could NOT complete and exactly why (file:line), so wave 2 can be dispatched precisely.
5. Confirm you did NOT touch gate-evidence or mark the sprint goal.

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