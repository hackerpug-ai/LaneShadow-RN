# REDHAT-FIX-12 — Rebuild founder/live-provider gate evidence harness so goal-state cannot claim completion from stale/forged bundles OR forged completion inputs (UC-VER-05)
> Status: ⬜ Pending
> **SECOND REFRESH (2026-07-20):** Precision-gap correction (same TASK_ID, in-place) driven by the fresh independent red-hat review `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260720T233411Z.md` (reviewed commit `a39c5850`, disposition `needs-revision`). The first refresh added AC-5/TC-8/TC-9 (step3/step5 script coverage). This refresh closes the newly-found forgeability of the writer's *completion authority itself*: `founderVerdict`, `--head-commit`, the optional/skippable bundle, and the caller-supplied `steps` JSON were all trusted from caller input and produced `met:true` / `GATE-GOAL: ACHIEVED` with no authenticated durable evidence. AC-1..AC-5 / TC-1..TC-9 are PRESERVED unchanged; AC-6..AC-10 / TC-10..TC-17 are added on top.
> **THIRD REFRESH (2026-07-21):** Completion-authority hardening continues (same TASK_ID, in-place) driven by the fresh independent red-hat review `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T005254Z.md` (reviewed commit `1bacaef0`, disposition `needs-revision`). AC-1..AC-9 are CONFIRMED FIXED by that review's passing live suite and are preserved byte-for-byte. This refresh closes two remaining CRITICAL findings — the manifest/artifacts were still resolved from the live working tree with only bundle-directory-level freshness (AC-11), and an artifact path could traverse outside the bundle to substantiate a PASS step (AC-12) — a HIGH finding that founder attestation accepted any latest `couch_verdicts` pass row instead of the `couchGateStatus.allowed`-bound current active manifest (AC-13), and a MEDIUM finding that AC-10's prior self-HEAD-equality claim was semantically impossible for an ordinary follow-up commit — AC-10 is revised in place to a two-object `attested_source_commit` / `attestation_commit` provenance contract verified by strict-descendant relation, not equality.

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-12 |
| SPRINT | [Sprint 04 — Trust pipeline](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 360 min |
| EFFORT | XL |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-05 |
| DEPENDS_ON | — |
| BLOCKS | — |

RUNTIME_COMMANDS:
- test: `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts`
- test (new adversarial ACs): `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-6|AC-7|AC-8|AC-9|AC-10|AC-11|AC-12|AC-13'`
- typecheck: `npx tsc --noEmit -p convex/tsconfig.json`
- lint: `pnpm exec biome check`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

deriveGoalState.ts recomputes sprint-goal-state.json from *authenticated durable evidence*, not caller input: `founderVerdict` and any route-level/S4-T7 decision data are resolved ONLY from real `couch_verdicts` rows recorded through the operator-gated `recordCouchVerdict` and read back via `getCouchVerdict`/`couchGateStatus` (a CLI/JSON `founderVerdict:true` has ZERO effect); `headCommit` is computed internally via `git rev-parse HEAD` (a caller-supplied `--head-commit` is never authoritative); a committed evidence manifest is MANDATORY for any write that could produce `met:true` (missing → fails closed, untracked → rejected, clean-but-stale commit ≠ internal HEAD → rejected); every step PASS claim is substantiated against the manifest's enumerated per-step artifacts so a tampered step-results JSON cannot flip the outcome; and `generator.head_commit` always equals the actual current HEAD with a repository-relative immutable input-manifest reference. It still refuses `met:true` whenever any step is BLOCKED/FAIL or the bundle is stale/seam/bare-identity, rebuilt step3/4/5/7 exercise the real operator-gated surface, and the human founder review (S4-T7) is never synthesized and stays human-owned. THIRD REFRESH: the manifest and every enumerated artifact are additionally resolved from immutable HEAD-bound content (a git blob comparison, never a working-tree `readFileSync`) with PER-FILE freshness (each required file's own last-touch commit, not the bundle directory's), artifact paths are contained within the bundle via realpath canonicalization (rejecting `../` traversal even to a tracked file), founder attestation is bound to `couchGateStatus.allowed===true` for the CURRENT active manifest (never `getCouchVerdict({})`'s latest-across-all-samples row), and the generator's provenance is expressed as a two-object `attested_source_commit`/`attestation_commit` contract verified by strict-descendant relation rather than the previously impossible self-HEAD-equality claim.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST read convex/_generated/ai/guidelines.md before implementation
- MUST make sprint-goal-state.json a machine-derived artifact produced only by deriveGoalState.ts — the writer recomputes met/goal/gate.overall from the per-step results and NEVER accepts a hand-supplied met:true that contradicts any BLOCKED/FAIL step result
- MUST reject a stale/pre-remediation evidence bundle: require the reproduced step's captured git commit to equal current HEAD, AND fail if any repro script passes the removed lever2FixedGeometry seam arg or authenticates as a bare non-operator s4-human-gate identity
- MUST rebuild ALL FOUR gate-evidence scripts — step3 (couch export), step4 (recordCouchVerdict), step5 (getCouchVerdict), step7 (disposition) — to bootstrap/seed a real operator identity (role founder|operator) and call the current public Convex surface with no seam args, and MUST prove each was rebuilt via a behavioral AC (AC-3 for the operator-gated write scripts step4/step7; AC-5 for the export/read scripts step3/step5)
- MUST resolve `founderVerdict` (and any route-level / S4-T7 decision data) ONLY from an authenticated durable Convex source — the real `couch_verdicts` rows recorded via the operator-gated `recordCouchVerdict`, read back through `getCouchVerdict`/`couchGateStatus` against the Convex dev deployment — and NEVER from a CLI/JSON-supplied `founderVerdict` boolean; a `founderVerdict:true` in the step-results JSON (or any CLI arg) MUST have ZERO effect on the derived outcome (the `DeriveOptions.founderVerdict` boolean input authority is REMOVED)
- MUST compute `headCommit` internally via `git rev-parse HEAD` against the actual repo — the writer MUST NOT accept a caller/CLI-supplied `--head-commit` as authoritative; a forged/bogus `--head-commit` MUST NOT change the STALE_EVIDENCE_BUNDLE / stale-commit outcome computed against the true internal HEAD (the `--head-commit` CLI arg is removed or downgraded to a non-authoritative diagnostic only)
- MUST treat a committed evidence manifest as MANDATORY for any write that could produce met:true — a missing bundle directory MUST fail closed (NEVER `{ok:true}`), an untracked bundle (present on disk but not tracked by git) MUST be rejected, and a clean bundle (no forbidden seam/identity) whose captured commit ≠ the internal HEAD MUST be rejected; the manifest's captured commit MUST be verified against the internally computed `git rev-parse HEAD`, never a CLI-supplied SHA, and the manifest MUST enumerate the required per-step artifacts
- MUST substantiate every step's PASS claim against the mandatory committed manifest's enumerated per-step artifacts — an arbitrary caller-supplied step-results JSON is NOT sole completion authority; a tampered step-results JSON (flipping a BLOCKED step to PASS, or naming a step the manifest does not corroborate) MUST be rejected / MUST NOT change the manifest-derived outcome
- MUST emit `generator.head_commit` equal to the actual current HEAD at generation time (never a stale/parent/ephemeral-source commit, e.g. never a bare `da67b6e9…` when HEAD differs) and MUST record a repository-relative, immutable input-manifest reference (never an ephemeral `/tmp/...` path)
- MUST resolve the evidence manifest AND every enumerated artifact from immutable HEAD-bound content — read `git show HEAD:<repo-rel-path>` (or compare the working-tree blob hash against `git rev-parse HEAD:<path>` for byte-equality) — and MUST NEVER treat a `readFileSync` off the live working tree as completion authority; a manifest or artifact that is tracked but modified/staged in the working tree (dirty) MUST be rejected fail-closed with MANIFEST_NOT_HEAD_BOUND, never read verbatim
- MUST verify evidence freshness PER-FILE — each required manifest and artifact's OWN last-touch commit (`git log -1 --format=%H -- <exact path>`) MUST equal the internal `git rev-parse HEAD` — and MUST NOT accept bundle-DIRECTORY-level `git log -1 -- <bundleDir>` as sufficient; an unrelated file newly committed under the same bundle directory MUST NOT launder a stale manifest/artifact whose own last-touch commit != HEAD into a PASS (EVIDENCE_FILE_STALE)
- MUST enforce artifact containment BEFORE any tracking check — canonicalize `realpath(bundle/artifact)` and require it to start with `realpath(bundle) + separator`, rejecting any `..`/symlink path escape with ARTIFACT_PATH_ESCAPE — so an out-of-bundle tracked file (e.g. `../../package.json`) can NEVER substantiate a PASS step even though it is tracked in git
- MUST derive founder attestation ONLY from `couchGateStatus.allowed===true` for the CURRENT active manifest, bound to that status's exact `sampleId`/`manifestHash`/`catalogVersion` via a matching `getCouchVerdict({sampleId})` row whose `recordedBy` is a real `requireOperator`-authorized (OPERATOR_ROLES = founder OR operator) NON-test-prefixed, NON-bare (`!= s4-human-gate`) identity — MUST NEVER use `getCouchVerdict({})` (the latest of up to 50 rows across ALL samples), a historic/inactive/legacy/drifted pass while `couchGateStatus.allowed` is false, or a TEST_SUBJECT_PREFIXES-matching identity for a production closeout

**NEVER**
- NEVER synthesize, fabricate, or auto-pass the human founder visual review (human_test.verdict) — the Founder-Operator/live-provider gate (S4-T7) is an EXTERNAL, unresolved, human-owned blocker; this harness must leave human_test unresolved/pending unless a genuine operator-recorded `couch_verdicts` S4-T7 verdict record exists, and must NEVER simulate, satisfy, or reduce its scope; a test may only produce a "real" verdict by seeding a genuine call through the real operator-gated `recordCouchVerdict` mutation, never by a raw db insert or a JSON flag
- NEVER allow sprint-goal-state.json to report met:true or gate.overall:PASS while any step result is BLOCKED/FAIL or while the evidence bundle fails the stale/seam/commit/missing/untracked checks
- NEVER trust a CLI/JSON `founderVerdict` boolean, a CLI `--head-commit` SHA, or an unsubstantiated caller step-results JSON as completion authority
- NEVER accept, skip, or short-circuit bundle validation to `{ok:true}` when the bundle directory is missing, untracked, empty, or clean-but-stale
- NEVER re-introduce the lever2FixedGeometry seam path or a bare s4-human-gate identity into any rebuilt gate-evidence script
- NEVER edit the honest top-level GATE-RESULTS.md (read-only source of truth) or perform FIX-01's live-provider closeout scope
- NEVER modify convex/couchVerdict.ts / convex/couchSampleAssembler.ts (FIX-15/FIX-16) — call getCouchVerdict/couchGateStatus/recordCouchVerdict/assembleCouchSample as existing public APIs only; do NOT re-litigate the legacy-manifest routeHashes fix
- NEVER assert a FORBIDDEN negative control on step5 getCouchVerdict (it is requireIdentity, not requireOperator, in current source) — its control is rebuilt-off-bare-identity + no-seam + no-synthesized-pass; only step3 export (requireOperatorAction) and step4/step7 (requireOperator) carry a true FORBIDDEN control
- NEVER let an out-of-bundle (`..`/symlink-escaped) artifact, a dirty/staged evidence file, a bundle-directory-laundered stale manifest/artifact, or a `getCouchVerdict({})` latest-across-all-samples / historic-inactive pass reach `met:true` or `human_test.verdict:'pass'`

**STRICTLY**
- STRICTLY the goal-state writer is the ONLY writer of sprint-goal-state.json; the file is a generated output, never hand-edited in this task
- STRICTLY the stale/commit/seam/operator/missing/untracked checks are load-bearing negative controls and must be exercised by real forged/missing/untracked/stale/tampered inputs
- STRICTLY the six adversarial vectors — (1) missing bundle, (2) untracked bundle, (3) clean-but-stale bundle, (4) forged/bogus CLI `--head-commit`, (5) tampered step-results JSON, (6) arbitrary `founderVerdict:true` flag with no real S4-T7 record — are EACH a load-bearing negative control with its own scenario case, and each case must fail against a stub/mock/empty writer (Fakeability Floor)
- STRICTLY every scenario case seeds through a real entrypoint (public API / real operator mutation / real git commit / real writer invocation) — never a raw db insert or a view-injected value used as the thing under test — and each case must fail against a stub/mock/empty implementation
- STRICTLY the HEAD-content binding, per-file freshness, realpath artifact containment, and `couchGateStatus.allowed`-bound founder attestation are load-bearing negative controls — each MUST be exercised by a REAL dirty-working-tree / directory-laundering / `../` traversal / historic-inactive-pass input against the ACTUAL shipped functions, never a stub/mock/empty writer (Fakeability Floor)

## DONE WHEN

- AC-1 [Goal-state writer fails closed on any BLOCKED/FAIL step] [PRIMARY]: it emits met:false, goal 'GATE-GOAL: BLOCKED', gate.overall 'BLOCKED', exits nonzero, and no hand-supplied met:true survives when any step is BLOCKED/FAIL
- AC-2 [Stale/forged evidence bundle is rejected]: it rejects with STALE_EVIDENCE_BUNDLE, exits nonzero, and writes no met:true goal-state
- AC-3 [Rebuilt operator-gated write scripts (step4/step7) run against the operator surface]: the operator identity passes the operator-gated mutations while the bare s4-human-gate identity is rejected with FORBIDDEN
- AC-4 [Harness never fabricates the human founder review]: human_test is left pending/unresolved and human_test.verdict is never synthesized to 'pass'
- AC-5 [Rebuilt export/read scripts (step3 export + step5 getCouchVerdict) run against the current surface]: under the seeded operator, step3 export succeeds and step5 getCouchVerdict returns the real operator-recorded verdict; the bare s4-human-gate identity is FORBIDDEN by the operator-gated export (step3) and step5 never returns a synthesized pass
- AC-6 [Founder attestation is resolved from the authenticated durable source, never a caller flag]: `founderVerdict` derives from real `couch_verdicts` rows read via getCouchVerdict/couchGateStatus; a JSON/CLI `founderVerdict:true` with no genuine operator-recorded row yields met:false and human_test.verdict 'pending'
- AC-7 [HEAD is computed internally; a forged --head-commit is inert]: the writer compares the bundle's captured commit against the true internal `git rev-parse HEAD`, and a bogus caller `--head-commit` does not change the STALE_EVIDENCE_BUNDLE outcome
- AC-8 [A committed evidence manifest is mandatory; missing/untracked/clean-stale bundles are rejected]: a missing bundle fails closed, an untracked bundle is rejected, and a clean bundle whose captured commit ≠ internal HEAD is rejected — none can produce met:true
- AC-9 [Step PASS claims are substantiated against the committed manifest; tampering is inert]: a tampered step-results JSON that flips a BLOCKED step to PASS (uncorroborated by the manifest) is rejected / does not change the manifest-derived outcome
- AC-10 [Generator provenance is a two-object contract, not impossible self-equality]: `generator.attested_source_commit` equals the internal `git rev-parse HEAD` at generation time; a provenance verifier confirms the sentinel's `attestation_commit` (its own last-touch commit) is a STRICT descendant of `attested_source_commit` (never equal/ancestor/unrelated); `generator.derived_from` stays repository-relative (never `/tmp/...`)
- AC-11 [Manifest/artifacts are resolved from immutable HEAD-bound content with per-file freshness]: a dirty-working-tree manifest modification is rejected with MANIFEST_NOT_HEAD_BOUND, and an old manifest/artifact laundered by an unrelated new bundle file is rejected with EVIDENCE_FILE_STALE (per-file last-touch != HEAD even though bundle-directory-level `git log` == HEAD)
- AC-12 [Artifact path traversal is rejected by containment, not tracking]: an artifact path resolving outside the bundle (`../../package.json`), even though tracked in git, is rejected with ARTIFACT_PATH_ESCAPE via a realpath containment check performed BEFORE any `gitTracked` call
- AC-13 [Founder attestation is bound to the live active-manifest gate, not any latest pass row]: attestation requires `couchGateStatus.allowed===true` for the CURRENT active manifest bound to its exact `sampleId`/`manifestHash`/`catalogVersion` via `getCouchVerdict({sampleId})`, recorded by a real `requireOperator` non-test, non-bare identity; a historic/inactive pass unbound to the active manifest yields `met:false` / `human_test.verdict:'pending'`
- Every behavioral AC scenario passes `validate_scenario` (exit 0, zero CRITICAL/HIGH); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `npx tsc --noEmit -p convex/tsconfig.json` → 0 errors + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- NO-REGRESSION: `pnpm type-check` reports zero new errors vs. a baseline captured at task start
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Make the Sprint-04 gate evidence harness non-forgeable at the *completion-authority* layer, not just the script-coverage layer. sprint-goal-state.json becomes a machine-derived, fail-closed artifact whose `met:true` can only arise from authenticated durable evidence: (a) the founder/S4-T7 attestation resolved from real `couch_verdicts` rows (operator-recorded via `recordCouchVerdict`, read via `getCouchVerdict`/`couchGateStatus`) — never a caller boolean; (b) an internally-computed HEAD (`git rev-parse HEAD`) — never a caller `--head-commit`; (c) a MANDATORY committed evidence manifest whose captured commit is bound to that internal HEAD and which enumerates the per-step artifacts that substantiate each PASS claim — so missing/untracked/clean-stale bundles and tampered step-results JSON are all rejected. ALL FOUR gate-evidence step scripts remain rebuilt to exercise the current public Convex surface under a real operator identity with a bare-identity negative control, and the human founder review stays external/S4-T7-owned.

**Success state:** See OUTCOME. The six adversarial vectors (missing bundle, untracked bundle, clean-but-stale bundle, forged `--head-commit`, tampered step-results, arbitrary `founderVerdict:true`) each fail closed with a concrete error/`met:false`, and the honest `sprint-goal-state.json` sentinel is regenerated ONLY through the hardened writer with `generator.head_commit` == the actual reviewed HEAD and a repository-relative immutable input reference. THIRD REFRESH additionally hardens the CONTENT-BINDING and ATTESTATION-BINDING seams: the manifest and artifacts are resolved from HEAD blobs (not the working tree) with per-file HEAD freshness and realpath containment, and the founder attestation is bound to `couchGateStatus.allowed===true` and its exact `sampleId`/`manifestHash`/`catalogVersion` via a `getCouchVerdict({sampleId})` row recorded by a non-test `requireOperator` identity. The generator's provenance is expressed as a two-object contract — an internally-computed `attested_source_commit` (the reviewed code/evidence commit) and a later `attestation_commit` (the commit that carries the generated sentinel) verified to be a strict descendant — replacing the impossible claim that the sentinel's own carrying commit equals its recorded HEAD.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `blocked-step-results` (seed_method: `public_api`): A computed 8-step gate results set with at least one BLOCKED/FAIL step, fed to deriveGoalState.
    - stepResults=[{n:1,result:'BLOCKED'},{n:2..8,result:'PASS'}] passed to deriveGoalState({stepResults})
- `stale-forged-bundle` (seed_method: `public_api`): The retained withdrawn bundle .gate-evidence/2026-07-19T22:59:46Z whose step1/2/7 scripts pass lever2FixedGeometry under a bare s4-human-gate identity and whose captured commit differs from current HEAD.
    - .gate-evidence/2026-07-19T22:59:46Z/scripts/{step1,step2,step7}.sh with lever2FixedGeometry + a captured commit != current HEAD
- `operator-gate-identity` (seed_method: `public_api`): A bootstrapped operator/founder identity used by the rebuilt step scripts to call the operator-gated public Convex surface.
    - users row upserted for clerkUserId 's4t12-operator' with role 'founder'
- `bare-closeout-identity` (seed_method: `public_api`): A bare 's4-human-gate' authenticated identity with NO operator/founder role, used as the negative control for the rebuilt scripts.
    - users row for clerkUserId 's4-human-gate' with no role (defaults to rider)
- `operator-recorded-couch-state` (seed_method: `public_api`): An operator-recorded couch verdict + frozen manifest present so rebuilt step3 export, step5 getCouchVerdict, and the writer's founder-attestation resolution have real state to read.
    - operator 's4t12-operator' records a couch verdict via the rebuilt step4 (recordCouchVerdict) so getCouchVerdict/couchGateStatus return a real operator-recorded row
- `no-couch-verdict-state` (seed_method: `public_api`): couch_verdicts holds NO genuine S4-T7 verdict (cleared through the operator-gated clearCouchVerdictsPublic), paired with a step-results JSON that FALSELY carries founderVerdict:true — the adversarial "no real record" input.
    - operator 's4t12-operator' clears couch_verdicts via clearCouchVerdictsPublic; step-results.json includes `founderVerdict:true` with no matching row
- `clean-stale-bundle` (seed_method: `cli`): A committed evidence bundle containing only innocuous scripts (NO lever2FixedGeometry seam, NO bare s4-human-gate identity) whose captured commit is a parent commit != current HEAD.
    - a git-committed bundle dir whose scripts are seam-free/identity-clean but `git log -1 --format=%H -- <bundle>` != `git rev-parse HEAD`
- `missing-bundle-path` (seed_method: `cli`): A bundle path that does not exist on disk at all.
    - deriveGoalState pointed at a non-existent .gate-evidence/<absent> directory
- `untracked-bundle` (seed_method: `cli`): A bundle directory present on disk but NOT committed to git (git ls-files returns empty for its scripts).
    - a bundle dir created on disk without `git add`; `git ls-files -- <bundle>` empty
- `committed-manifest-corroborated` (seed_method: `public_api`): A committed evidence manifest enumerating per-step artifacts (all tracked at current HEAD) that corroborate each step's PASS claim, including a real operator-recorded couch verdict.
    - manifest.json listing step artifact paths tracked at HEAD; operator 's4t12-operator' recorded the couch verdict via recordCouchVerdict
- `tampered-step-results` (seed_method: `cli`): A step-results JSON altered to flip a BLOCKED step to PASS (uncorroborated), paired with the committed-manifest-corroborated manifest that does NOT corroborate the flipped step.
    - step-results.json with step 1 hand-edited from 'BLOCKED' to 'PASS'; the committed manifest enumerates no artifact substantiating step 1's PASS
- `dirty-working-tree-manifest` (seed_method: `cli`): A committed evidence bundle whose manifest.json is tracked at HEAD but then modified ONLY in the working tree (dirty, uncommitted) to repoint both PASS steps at a different tracked file — the working-tree content diverges from the HEAD blob.
    - a git-committed bundle dir + manifest.json tracked at HEAD, then manifest.json edited on disk WITHOUT git add/commit so `git show HEAD:<bundle>/manifest.json` != the working-tree bytes; `git status` reports it modified/dirty
- `directory-laundered-evidence` (seed_method: `cli`): A manifest.json and its enumerated artifact committed at an OLDER parent commit, with an unrelated file (README.md) added to the SAME bundle directory at HEAD so bundle-DIRECTORY-level `git log -1 -- <bundle>` == HEAD while each required file's OWN last-touch commit != HEAD.
    - manifest.json + step artifact committed at parent commit P; an unrelated README.md added under the same bundle dir and committed at HEAD; `git log -1 --format=%H -- <bundle>` == HEAD but `git log -1 --format=%H -- <bundle>/manifest.json` == P != HEAD
- `traversal-artifact-manifest` (seed_method: `cli`): A committed bundle whose manifest declares an artifact path that traverses OUTSIDE the bundle directory (`../../package.json`) for a PASS step; the escaped file is itself tracked in git but is unrelated source, not gate evidence.
    - manifest.json committed at HEAD listing artifacts:['../../package.json'] for a PASS step; realpath(bundle/artifact) resolves outside realpath(bundle); package.json is tracked but not gate evidence
- `active-manifest-allowed-pass` (seed_method: `public_api`): A CURRENT active couch manifest activation whose couchGateStatus resolves allowed===true, bound to a real operator-recorded pass verdict for that active manifest's sampleId/manifestHash/catalogVersion.
    - operator 's4t12-operator' activates a couch manifest with a complete routeHashes baseline and no live geometry drift, and records a pass couch_verdict for THAT active sampleId via recordCouchVerdict, so couchGateStatus({}) returns allowed:true with sampleId/manifestHash/catalogVersion matching getCouchVerdict({sampleId})
- `historic-inactive-couch-pass` (seed_method: `public_api`): A real pass couch_verdict row that EXISTS but is NOT bound to the current active manifest — recorded for a superseded sample while the active manifest is inactive/drifted.
    - operator 's4t12-operator' recorded a pass couch_verdict for a superseded sampleId; the current active manifest is inactive/drifted so couchGateStatus({}) returns allowed:false; getCouchVerdict({}) latest-across-all-samples still returns the historic pass row
- `sentinel-descendant-provenance` (seed_method: `cli`): A generated sentinel committed such that its carrying (attestation) commit is a genuine STRICT descendant of the recorded attested_source_commit.
    - deriveGoalState run at source commit S recording generator.attested_source_commit==S; the emitted sentinel committed as a later commit A where `git merge-base --is-ancestor S A` succeeds and S != A
- `sentinel-selfequal-provenance` (seed_method: `cli`): A sentinel whose recorded attested_source_commit equals its own carrying commit (self-equality) OR is unrelated to its carrying commit — the impossible/forged provenance relation.
    - a committed sentinel whose generator.attested_source_commit is hand-set equal to its own last-touch commit (or to an unrelated commit U with no ancestor relation), so the strict-descendant relation does NOT hold


## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Goal-state writer fails closed on any BLOCKED/FAIL step

**Requirement:** GIVEN a computed 8-step gate results set in which at least one step result is BLOCKED/FAIL WHEN deriveGoalState recomputes sprint-goal-state.json from those step results THEN it emits met:false, goal 'GATE-GOAL: BLOCKED', gate.overall 'BLOCKED', exits nonzero, and no hand-supplied met:true survives when any step is BLOCKED/FAIL

- TEST_TIER: `integration` · VERIFICATION_SERVICE: deriveGoalState writer invoked against a real step-results input + the emitted goal-state file
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-1'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: deriveGoalState copies a caller-supplied met:true through without recomputing from step results; the writer treats a BLOCKED step as PASS via a hardcoded/stubbed predicate and still emits gate.overall == 'PASS'
- EVIDENCE: `file_snapshot` (required_capture: true)
- CASE 1 — start_ref `blocked-step-results`
  - ACTION: Provide blocked-step-results (step 1 BLOCKED, rest PASS) to deriveGoalState; Run deriveGoalState and capture the emitted sprint-goal-state.json and its exit code
  - MUST_OBSERVE: emitted met == false; emitted goal == 'GATE-GOAL: BLOCKED' and gate.overall == 'BLOCKED'; writer exit code != 0
  - MUST_NOT_OBSERVE: emitted met == true; gate.overall == 'PASS' while a step result is BLOCKED; gate.overall is silently rewritten away from 'BLOCKED' (it must stay 'BLOCKED', unchanged); the writer's output is not empty — a no-op/stub writer producing an empty file must not satisfy this AC

### AC-2 — Stale/forged evidence bundle is rejected

**Requirement:** GIVEN the retained forged bundle whose reproduced step commit != current HEAD and whose scripts pass the removed lever2FixedGeometry seam arg WHEN deriveGoalState validates the evidence bundle before writing goal-state THEN it rejects with STALE_EVIDENCE_BUNDLE, exits nonzero, and writes no met:true goal-state

- TEST_TIER: `integration` · VERIFICATION_SERVICE: deriveGoalState bundle validator against the retained .gate-evidence/2026-07-19T22:59:46Z bundle
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-2'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the validator ignores the captured commit and accepts a bundle from an older commit; the validator does not scan repro scripts for the removed lever2FixedGeometry seam arg
- EVIDENCE: `file_snapshot` (required_capture: true)
- CASE 1 — start_ref `stale-forged-bundle`
  - ACTION: Point deriveGoalState at the retained .gate-evidence/2026-07-19T22:59:46Z bundle with the internally computed HEAD; Run the bundle validation and capture the thrown error and emitted goal-state (if any)
  - MUST_OBSERVE: validation throws/reports error code == 'STALE_EVIDENCE_BUNDLE'; validation error exposes `error.details.capturedCommit !== error.details.headCommit` (captured commit does not equal the current `HEAD`); no goal-state with met:true is written
  - MUST_NOT_OBSERVE: the forged bundle is accepted as reproducible; a lever2FixedGeometry-bearing script passes the seam scan; no `sprint-goal-state.json` write occurs (file absent/unchanged); the extracted STALE_EVIDENCE_BUNDLE error detail is not empty — a stub validator returning an empty/no-op result must not satisfy this AC

### AC-3 — Rebuilt operator-gated write scripts (step4/step7) run against the operator surface

**Requirement:** GIVEN the rebuilt step4 (recordCouchVerdict) and step7 (disposition) scripts that bootstrap a seeded operator identity, and a bare s4-human-gate control identity with no role WHEN the rebuilt write scripts execute against the current public Convex APIs under each identity THEN the operator identity passes the operator-gated mutations while the bare s4-human-gate identity is rejected with FORBIDDEN

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real requireOperator + recordCouchVerdict + disposition mutations)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-3'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the rebuilt scripts still authenticate as a bare s4-human-gate identity and the operator-gated mutation silently succeeds because the identity check is stubbed/mocked; the scripts pass a seam arg to reach a deterministic result
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `operator-gate-identity`
  - ACTION: Seed operator-gate-identity and bare-closeout-identity; Run the rebuilt step4 (recordCouchVerdict) and step7 (disposition) scripts as 's4t12-operator'; Re-run the same scripts as the bare 's4-human-gate' identity; Query couch_verdicts and the disposition records
  - MUST_OBSERVE: operator run: recordCouchVerdict/disposition succeed and rows are written with recordedBy == 's4t12-operator'; bare s4-human-gate run: the call throws error.code == 'FORBIDDEN'
  - MUST_NOT_OBSERVE: the bare s4-human-gate identity records a couch verdict or disposition; any script passes a lever2FixedGeometry or other seam arg; couch_verdicts row count for the bare s4-human-gate identity stays 0 (no row written)

### AC-4 — Harness never fabricates the human founder review

**Requirement:** GIVEN deriveGoalState runs with no genuine S4-T7 founder verdict record present WHEN the goal-state is recomputed THEN human_test is left pending/unresolved and human_test.verdict is never synthesized to 'pass'

- TEST_TIER: `integration` · VERIFICATION_SERVICE: deriveGoalState writer + emitted goal-state file
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-4'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: deriveGoalState hardcodes human_test.verdict = 'pass' with no S4-T7 record; the writer copies a stale human_test block from the forged bundle
- EVIDENCE: `file_snapshot` (required_capture: true)
- CASE 1 — start_ref `blocked-step-results`
  - ACTION: Run deriveGoalState with no S4-T7 founder verdict record present; Capture the emitted human_test block in sprint-goal-state.json
  - MUST_OBSERVE: human_test.verdict is 'pending'/unresolved (not 'pass'); the writer surfaces that a human/S4-T7 review is still required
  - MUST_NOT_OBSERVE: human_test.verdict == 'pass' synthesized without an S4-T7 record; a stale human_test.run_id from the forged bundle is carried forward as passing; `human_test.verdict` is set to anything other than `'pending'` — it must remain `'pending'`/unresolved while the S4-T7 record is absent; the emitted `human_test` block is not empty — a stub writer producing an empty/missing block must not satisfy this AC

### AC-5 — Rebuilt export/read scripts (step3 export + step5 getCouchVerdict) run against the current surface

**Requirement:** GIVEN the rebuilt step3 (operator-gated couch export) and step5 (getCouchVerdict) scripts, a seeded operator identity, a bare s4-human-gate control identity, and an operator-recorded couch verdict present WHEN the rebuilt export/read scripts execute against the current public Convex APIs under each identity THEN under the seeded operator, step3 export succeeds and step5 getCouchVerdict returns the real operator-recorded verdict; the bare s4-human-gate identity is FORBIDDEN by the operator-gated export (step3) and step5 never returns a synthesized/forged pass; no rebuilt script passes a seam arg

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real requireOperatorAction couch export + requireIdentity getCouchVerdict)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-5'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the rebuilt step3 export still authenticates as a bare s4-human-gate identity and the operator-gated export silently succeeds; step5 getCouchVerdict returns a synthesized/forged pass with no operator-recorded verdict, or the rebuilt script reaches a deterministic result via a seam arg; the rebuilt scripts are unchanged and still reuse the bare s4-human-gate identity
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `operator-recorded-couch-state`
  - ACTION: Seed operator-gate-identity, bare-closeout-identity, and operator-recorded-couch-state; Run the rebuilt step3 (couch export) and step5 (getCouchVerdict) scripts as 's4t12-operator'; Re-run the rebuilt step3 export as the bare 's4-human-gate' identity; Capture the export result and the getCouchVerdict result
  - MUST_OBSERVE: operator run: step3 export succeeds and step5 getCouchVerdict returns the operator-recorded verdict (recordedBy == 's4t12-operator'); bare s4-human-gate run: the operator-gated step3 export throws error.code == 'FORBIDDEN'
  - MUST_NOT_OBSERVE: the bare s4-human-gate identity completes the operator-gated couch export; step5 getCouchVerdict returns a synthesized/forged pass with no operator-recorded verdict; any rebuilt step3/step5 script passes a lever2FixedGeometry or other seam arg

### AC-6 — Founder attestation is resolved from the authenticated durable source, never a caller flag

**Requirement:** GIVEN the writer resolves the S4-T7/founder attestation only from real `couch_verdicts` rows read via getCouchVerdict/couchGateStatus WHEN it derives goal-state under (a) a genuine operator-recorded verdict and (b) NO genuine record but a JSON `founderVerdict:true` flag THEN the derived founder attestation tracks the real durable row in (a) and is unaffected by the flag in (b) — a `founderVerdict:true` with no operator-recorded row yields met:false and human_test.verdict 'pending'

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (getCouchVerdict/couchGateStatus over real couch_verdicts) + deriveGoalState writer
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-6'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: deriveGoalState sets founderVerdict from `opts.founderVerdict === true` (the caller JSON/CLI boolean) instead of reading the durable couch_verdicts row; the founder-resolution read is stubbed/mocked to a constant `true`; the writer is disconnected from the Convex source and returns the flag verbatim
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `operator-recorded-couch-state` (durable source PRESENT, JSON flag omitted/false)
  - ACTION: Seed operator-gate-identity and operator-recorded-couch-state (a real recordCouchVerdict row by 's4t12-operator'); Run deriveGoalState with a step-results JSON that omits founderVerdict (or sets it false); Capture the resolved founder attestation and the couch_verdicts query
  - MUST_OBSERVE: the resolved founder attestation is sourced from the real couch_verdicts row (recordedBy == 's4t12-operator'); `human_test.verdict == 'pass'`, matching the couch_verdicts row's recorded `verdict` field value (not derived from the absent/false JSON founderVerdict flag); the row is present in the couch_verdicts query (row count >= 1)
  - MUST_NOT_OBSERVE: the founder attestation is read from the JSON flag; the resolved recordedBy is empty/undefined — a disconnected/stub read producing no attribution must not satisfy this case; couch_verdicts query returns 0 rows
- CASE 2 — start_ref `no-couch-verdict-state` (durable source ABSENT, JSON flag true)
  - ACTION: Seed operator-gate-identity and no-couch-verdict-state (couch_verdicts cleared via operator-gated clearCouchVerdictsPublic); Run deriveGoalState with a step-results JSON that falsely sets `founderVerdict:true`; Capture the emitted goal-state and human_test block
  - MUST_OBSERVE: emitted met == false; human_test.verdict == 'pending'; gate.blocker names the unresolved S4-T7 human-owned gate
  - MUST_NOT_OBSERVE: met == true; human_test.verdict == 'pass' produced from the JSON `founderVerdict:true`; gate.overall == 'PASS' while couch_verdicts holds no genuine S4-T7 row (0 rows); the JSON `founderVerdict:true` flag has any effect on the derived outcome

### AC-7 — HEAD is computed internally; a forged --head-commit is inert

**Requirement:** GIVEN a clean (seam-free, identity-clean) committed bundle whose captured commit != the true current HEAD WHEN deriveGoalState is invoked with a bogus `--head-commit` SHA crafted to equal the bundle's captured commit THEN the writer still compares the bundle against the internally computed `git rev-parse HEAD`, rejects with STALE_EVIDENCE_BUNDLE, and the bogus arg has no effect

- TEST_TIER: `integration` · VERIFICATION_SERVICE: deriveGoalState bundle validator + internal `git rev-parse HEAD`
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-7'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the validator uses `opts.headCommit || headCommit()` and trusts the caller `--head-commit`, so a bogus SHA equal to the captured commit makes the stale bundle "pass"; the HEAD read is stubbed/mocked to the caller-supplied value; the writer is disconnected from `git rev-parse HEAD`
- EVIDENCE: `file_snapshot` (required_capture: true)
- CASE 1 — start_ref `clean-stale-bundle`
  - ACTION: Seed clean-stale-bundle (committed, seam-free, captured commit == a parent commit); Compute the parent commit SHA and pass it as a bogus `--head-commit` to deriveGoalState; Capture the thrown error, the internal HEAD, and any goal-state write
  - MUST_OBSERVE: validation throws error code == 'STALE_EVIDENCE_BUNDLE'; validation error exposes `error.details.capturedCommit !== error.details.headCommit` (captured commit does not equal the current `HEAD`); `error.details.headCommit` equals the actual `git rev-parse HEAD` value (the true current commit) and NOT the bogus supplied `--head-commit` SHA
  - MUST_NOT_OBSERVE: the bundle is accepted because the bogus `--head-commit` matched the captured commit; `error.details.headCommit` equals the caller-supplied bogus SHA; met == true; no error is produced (an empty/no-op validator that ignores HEAD must not satisfy this AC)

### AC-8 — A committed evidence manifest is mandatory; missing/untracked/clean-stale bundles are rejected

**Requirement:** GIVEN a committed evidence manifest is mandatory for any write that could produce met:true WHEN deriveGoalState validates (a) a missing bundle path, (b) an untracked-on-disk bundle, and (c) a clean-but-stale committed bundle THEN each is rejected fail-closed with a concrete error and no case produces met:true

- TEST_TIER: `integration` · VERIFICATION_SERVICE: deriveGoalState mandatory-manifest validator (git-tracking + HEAD binding)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-8'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: a missing bundle directory short-circuits to `{ok:true}` (the current behavior); the validator never runs `git ls-files` so an untracked bundle is accepted; the validator computes `gitLastCommit` only for the error payload and never gates on captured commit != HEAD, so a clean-stale bundle passes; the validator is a stub returning `{ok:true}`
- EVIDENCE: `file_snapshot` (required_capture: true)
- CASE 1 — start_ref `missing-bundle-path` (missing bundle)
  - ACTION: Point deriveGoalState at a non-existent bundle directory; Run validation and capture the error and any goal-state write
  - MUST_OBSERVE: validation throws error code == 'MISSING_EVIDENCE_BUNDLE' (fail-closed); no sprint-goal-state.json with met:true is written
  - MUST_NOT_OBSERVE: validation returns `{ok:true}` for the absent directory; met == true; gate.overall == 'PASS'; an empty/no-op validator that skips the missing bundle satisfies this case
- CASE 2 — start_ref `untracked-bundle` (present on disk, not committed)
  - ACTION: Create a bundle dir on disk WITHOUT `git add`; Point deriveGoalState at it; Run validation and capture the error and `git ls-files` output
  - MUST_OBSERVE: validation throws error code == 'UNTRACKED_EVIDENCE_BUNDLE'; `git ls-files -- <bundle>` returns 0 tracked paths for the bundle scripts; no met:true goal-state is written
  - MUST_NOT_OBSERVE: the untracked bundle is accepted as valid evidence; met == true; the validator never consults git tracking (an empty/stub validator that ignores tracking must not satisfy this case)
- CASE 3 — start_ref `clean-stale-bundle` (committed, seam-free, captured commit != HEAD)
  - ACTION: Point deriveGoalState at the clean-stale committed bundle with the internally computed HEAD; Run validation and capture the error
  - MUST_OBSERVE: validation throws error code == 'STALE_EVIDENCE_BUNDLE' with `error.details.reason == 'stale_commit'`; validation error exposes `error.details.capturedCommit !== error.details.headCommit` (captured commit does not equal the current `HEAD`); no met:true goal-state is written
  - MUST_NOT_OBSERVE: the clean bundle passes purely because it has no forbidden seam/identity string; met == true; the captured-commit-vs-HEAD comparison is never performed as a pass/fail gate

### AC-9 — Step PASS claims are substantiated against the committed manifest; tampering is inert

**Requirement:** GIVEN each step's PASS claim must be corroborated by an artifact enumerated in the mandatory committed manifest WHEN deriveGoalState derives goal-state from (a) step-results corroborated by the manifest and (b) a tampered step-results JSON that flips a BLOCKED step to PASS with no corroborating artifact THEN the corroborated claims substantiate in (a) and the uncorroborated tampered claim is rejected / does not change the manifest-derived outcome in (b)

- TEST_TIER: `integration` · VERIFICATION_SERVICE: deriveGoalState manifest-substantiation check over a committed evidence manifest
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-9'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: `allStepsPass` is computed from `opts.steps` verbatim (the caller JSON) with no manifest corroboration, so flipping BLOCKED→PASS in the JSON flips the outcome; the substantiation check is stubbed to always corroborate; the writer is disconnected from the committed manifest
- EVIDENCE: `file_snapshot` (required_capture: true)
- CASE 1 — start_ref `committed-manifest-corroborated` (honest, corroborated)
  - ACTION: Seed committed-manifest-corroborated (per-step artifacts tracked at HEAD); Run deriveGoalState with step-results that match the manifest; Capture the per-step substantiation result
  - MUST_OBSERVE: each PASS step is confirmed backed by a committed artifact path enumerated in the manifest (e.g. `.gate-evidence/<ts>/step4.artifact` tracked at HEAD); the substantiation result lists the corroborating artifact path per step (>= 1 artifact path per PASS step)
  - MUST_NOT_OBSERVE: substantiation passes with an empty artifact list; the substantiation set is empty — a stub returning "corroborated" with no artifact paths must not satisfy this case
- CASE 2 — start_ref `tampered-step-results` (flipped BLOCKED→PASS, uncorroborated)
  - ACTION: Take the committed manifest and a step-results JSON hand-edited to flip step 1 from 'BLOCKED' to 'PASS' (no corroborating artifact); Run deriveGoalState; Capture the emitted goal-state and error
  - MUST_OBSERVE: the writer rejects / reports error code == 'STEP_RESULT_UNSUBSTANTIATED' naming step 1; emitted met == false; gate.overall == 'BLOCKED'
  - MUST_NOT_OBSERVE: the flipped PASS is accepted; met == true; gate.overall == 'PASS'; the tampered step-results JSON changes the manifest-derived outcome (the empty/verbatim-trusting writer that copies `opts.steps` must not satisfy this case)

### AC-10 — Generator provenance is a two-object contract: `attested_source_commit` vs `attestation_commit`, verified by strict-descendant relation, never impossible self-equality

**Requirement:** GIVEN the writer emits generator provenance metadata and a provenance verifier checks the committed sentinel WHEN it regenerates sprint-goal-state.json through the hardened path AND the sentinel is later committed THEN `generator.attested_source_commit` equals the actual internal `git rev-parse HEAD` at generation time (computed internally, never caller-supplied), `generator.derived_from` is a repository-relative immutable path (never `/tmp/...`), and the provenance verifier confirms the sentinel's `attestation_commit` (its own last-touch commit) is a STRICT descendant of `attested_source_commit` (`git merge-base --is-ancestor <attested_source_commit> <attestation_commit>` succeeds AND `attested_source_commit != attestation_commit`) — it MUST NOT assert the semantically impossible self-equality (a file cannot record the hash of the ordinary commit that will contain its own bytes), and an equal / ancestor-inverted / unrelated `attestation_commit` is rejected with PROVENANCE_RELATION_INVALID

- TEST_TIER: `integration` · VERIFICATION_SERVICE: deriveGoalState generator metadata + tools/gate/verifyProvenance.ts two-object relation vs internal `git rev-parse HEAD` and `git merge-base --is-ancestor`
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-10'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the contract asserts `generator.head_commit` equals the sentinel's OWN carrying commit (self-equality) — semantically impossible for an ordinary follow-up commit; the provenance verifier accepts an `attestation_commit` equal to, an ancestor of, or unrelated to `attested_source_commit` instead of requiring a STRICT descendant; `attested_source_commit` is read from a caller `--head-commit` rather than the internal `git rev-parse HEAD`, or the verifier is a stub that returns valid without running `git merge-base --is-ancestor`
- EVIDENCE: `file_snapshot` (required_capture: true)
- CASE 1 — start_ref `sentinel-descendant-provenance`
  - ACTION: Run deriveGoalState through the hardened writer at source commit S with the committed manifest as input, capturing `generator.attested_source_commit`; Commit the emitted sentinel as a later commit A (strict descendant of S); Run tools/gate/verifyProvenance.ts over the committed sentinel and capture the relation result
  - MUST_OBSERVE: `generator.attested_source_commit` equals the internal `git rev-parse HEAD` at generation time (full 40-char SHA, byte-equal, computed internally — never caller-supplied); the provenance verifier confirms `attestation_commit` (the sentinel's own last-touch commit) is a STRICT descendant of `attested_source_commit`: `git merge-base --is-ancestor <attested_source_commit> <attestation_commit>` succeeds AND `attested_source_commit != attestation_commit`; `generator.derived_from` is a repository-relative path beginning with `.spec/` or `.gate-evidence/`
  - MUST_NOT_OBSERVE: the contract asserts `attestation_commit == attested_source_commit` (impossible self-equality); `attested_source_commit` equals a caller-supplied `--head-commit` SHA; `generator.derived_from` begins with `/tmp/` or another absolute ephemeral path; the `generator` block is empty/missing — a stub writer producing no provenance must not satisfy this AC
- CASE 2 — start_ref `sentinel-selfequal-provenance`
  - ACTION: Take a committed sentinel whose `generator.attested_source_commit` is hand-set equal to its own carrying commit (or to an unrelated commit U); Run tools/gate/verifyProvenance.ts over it; Capture the relation result and any met:true acceptance
  - MUST_OBSERVE: the provenance verifier rejects with code == 'PROVENANCE_RELATION_INVALID' when `attestation_commit` is equal to (or an ancestor of / unrelated to) `attested_source_commit`; no met:true / GATE-GOAL: ACHIEVED is accepted for a sentinel whose provenance relation is not a strict descendant
  - MUST_NOT_OBSERVE: a self-equal (`attestation_commit == attested_source_commit`) provenance is accepted as valid; an unrelated or ancestor-inverted `attestation_commit` passes the relation check; the verifier is a stub that returns valid without running `git merge-base --is-ancestor` — an empty/no-op verifier must not satisfy this case

### AC-11 — Manifest/artifacts are resolved from immutable HEAD-bound content with PER-FILE freshness; dirty and directory-laundered evidence are rejected fail-closed

**Requirement:** GIVEN the evidence manifest and its enumerated artifacts must be resolved from immutable HEAD-bound content (git blob byte-equality with HEAD, not a working-tree `readFileSync`) and each required file's OWN last-touch commit must equal the internal HEAD WHEN deriveGoalState validates (a) a committed bundle whose manifest.json is modified ONLY in the working tree and (b) a manifest/artifact committed at an older parent with an unrelated new file added to the same bundle directory at HEAD THEN (a) is rejected with MANIFEST_NOT_HEAD_BOUND (working-tree content != HEAD blob) and (b) is rejected with EVIDENCE_FILE_STALE (per-file last-touch != HEAD despite directory-level git log == HEAD), and neither produces met:true

- TEST_TIER: `integration` · VERIFICATION_SERVICE: deriveGoalState HEAD-blob manifest/artifact resolver + per-file freshness check (`git show HEAD:<path>`, `git log -1 -- <exact path>`) over real committed/dirty bundles
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-11'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the manifest/artifacts are read via `readFileSync` off the working tree instead of `git show HEAD:<path>` (or a working-tree-blob-hash vs HEAD comparison), so a dirty working-tree modification of manifest.json is accepted (the current `loadManifest` behavior); freshness is gated only on bundle-DIRECTORY-level `git log -1 -- <bundle>`, so an unrelated file newly committed under the bundle directory launders a stale manifest/artifact to PASS (the current `gitLastCommit(bundlePath)` behavior); the substantiation check is stubbed to always corroborate or is disconnected from git tracking/content binding
- EVIDENCE: `file_snapshot` (required_capture: true)
- CASE 1 — start_ref `dirty-working-tree-manifest`
  - ACTION: Seed dirty-working-tree-manifest — commit a bundle + manifest.json at HEAD, then edit manifest.json on disk (repoint both PASS steps) WITHOUT git add/commit; Run deriveGoalState pointed at the bundle with the internally computed HEAD; Capture the thrown error, the HEAD-blob manifest bytes, and any goal-state write
  - MUST_OBSERVE: validation throws error code == 'MANIFEST_NOT_HEAD_BOUND'; the HEAD-blob manifest content (read via `git show HEAD:<bundle>/manifest.json`) still declares the ORIGINAL 2 committed artifact paths — a SHA-256 digest of that HEAD-blob content does NOT equal a SHA-256 digest of the dirty working-tree manifest.json bytes; no sprint-goal-state.json with met:true is written
  - MUST_NOT_OBSERVE: the working-tree-modified manifest is read via readFileSync and accepted; validateBundle returns ok:true and substantiateSteps returns null for the dirty manifest; met == true; the dirty manifest's repointed artifacts substantiate any PASS step — an empty/no-op validator that ignores the HEAD-vs-working-tree divergence must not satisfy this case
- CASE 2 — start_ref `directory-laundered-evidence`
  - ACTION: Seed directory-laundered-evidence — commit manifest.json + artifact at parent P, then add an unrelated README.md under the same bundle dir and commit it at HEAD; Run deriveGoalState pointed at the bundle with the internally computed HEAD; Capture the thrown error, the per-file last-touch commits, and any goal-state write
  - MUST_OBSERVE: validation throws error code == 'EVIDENCE_FILE_STALE'; each required file's OWN last-touch commit (`git log -1 --format=%H -- <bundle>/manifest.json` and `-- <artifact>`) equals P and != HEAD, even though `git log -1 --format=%H -- <bundle>` (directory-level) == HEAD; no sprint-goal-state.json with met:true is written
  - MUST_NOT_OBSERVE: directory-level `git log -1 -- <bundle>` == HEAD launders the stale manifest/artifact to PASS; the unrelated README.md's HEAD-level touch satisfies per-file freshness for manifest.json/artifact; met == true; the validator only checks bundle-directory freshness — an empty/stub validator that skips per-file freshness must not satisfy this case

### AC-12 — Artifact path traversal is rejected by containment, not tracking

**Requirement:** GIVEN artifact containment must be enforced before any tracking check WHEN deriveGoalState substantiates a manifest declaring an artifact path that traverses outside the bundle directory (`../../package.json`) THEN it rejects with ARTIFACT_PATH_ESCAPE because `realpath(bundle/artifact)` does not start with `realpath(bundle) + separator`, no out-of-bundle file reaches PASS via any hidden hop, and no met:true is produced — even though `../../package.json` is itself tracked in git

- TEST_TIER: `integration` · VERIFICATION_SERVICE: deriveGoalState substantiateSteps realpath containment check (`realpath(bundle/artifact)` startsWith `realpath(bundle)+sep`) over a real committed traversal manifest
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-12'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: `posix.join(bundleRel, art)` normalizes `..` and `gitTracked` accepts an out-of-bundle tracked file with no containment check (the current `substantiateSteps` behavior); no realpath/canonicalization containment check follows before `gitTracked`, so `../../package.json` (tracked) substantiates a PASS step; the containment check is stubbed to always pass or symlink escapes are not rejected
- EVIDENCE: `file_snapshot` (required_capture: true)
- CASE 1 — start_ref `traversal-artifact-manifest`
  - ACTION: Seed traversal-artifact-manifest — commit a bundle whose manifest declares artifacts:['../../package.json'] for a PASS step; Run deriveGoalState pointed at the bundle with the internally computed HEAD; Capture the thrown error, the realpath containment comparison, and any goal-state write
  - MUST_OBSERVE: substantiation throws error code == 'ARTIFACT_PATH_ESCAPE' naming the escaped artifact; `realpath('.gate-evidence/<bundle>/../../package.json')` resolves to the repo-root `package.json` absolute path, which does NOT start with `realpath('.gate-evidence/<bundle>') + '/'` — this string-prefix comparison fails BEFORE `gitTracked()` is ever invoked (0 calls to gitTracked for this artifact); no sprint-goal-state.json with met:true is written
  - MUST_NOT_OBSERVE: an out-of-bundle tracked file (`../../package.json`) substantiates a PASS step; `posix.join(bundleRel, art)` normalizes `..` and gitTracked accepts the escaped path; met == true; substantiateSteps returns null with the traversal artifact accepted — an empty/no-op check that skips containment must not satisfy this case

### AC-13 — Founder attestation is bound to the live active-manifest gate, not any latest pass row

**Requirement:** GIVEN founder attestation must be bound to the current active manifest's live gate status WHEN deriveGoalState resolves attestation under (a) `couchGateStatus.allowed===true` for the current active manifest with a matching `getCouchVerdict({sampleId})` pass recorded by a real operator and (b) a historic/inactive/legacy pass that exists but is NOT bound to the current active manifest (`couchGateStatus.allowed` false due to an inactive/drifted/legacy manifest) THEN (a) yields `founder.present` with the recording identity/sampleId/manifestHash/catalogVersion bound to the status, `human_test.verdict` 'pass', and (b) yields `founder.present` false, `met:false`, `human_test.verdict` 'pending' even though a `couch_verdicts` PASS row technically exists somewhere; the recording identity must be a `requireOperator`-authorized (founder OR operator) non-test-prefixed, non-bare identity

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (`couchGateStatus.allowed` + `getCouchVerdict({sampleId})` over real `couch_verdicts`/`couch_manifest_activations`) + deriveGoalState founder resolver
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-13'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: founder attestation reads `getCouchVerdict({})` — the latest of up to 50 rows across ALL samples — and never calls `couchGateStatus`, so a historic/inactive pass satisfies present (the current `resolveFounderVerdict` behavior); present is set from `overallVerdict === 'pass'` alone with no active-manifest binding to sampleId/manifestHash/catalogVersion, or a test-prefixed / bare `s4-human-gate` identity is accepted as founder; the `couchGateStatus` read is stubbed/mocked to `allowed:true` and disconnected from the durable Convex source
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `active-manifest-allowed-pass`
  - ACTION: Seed operator-gate-identity and active-manifest-allowed-pass (an active couch manifest with couchGateStatus.allowed===true bound to an operator-recorded pass for that sampleId); Run deriveGoalState with a step-results JSON that omits founderVerdict; Capture the resolved founder attestation, the couchGateStatus result, and the getCouchVerdict({sampleId}) row
  - MUST_OBSERVE: founder attestation is derived from `couchGateStatus.allowed === true` for the CURRENT active manifest (couchGateStatus was actually called, not `getCouchVerdict({})`); the attestation is bound to that status's exact sampleId/manifestHash/catalogVersion via a matching `getCouchVerdict({sampleId})` row (`recordedBy == 's4t12-operator'`, a requireOperator-authorized non-test, non-bare identity); `human_test.verdict == 'pass'` and met can be true only with this bound attestation present
  - MUST_NOT_OBSERVE: attestation is derived from `getCouchVerdict({})` latest-across-all-samples; sampleId/manifestHash/catalogVersion mismatch between couchGateStatus and the getCouchVerdict({sampleId}) row is accepted; a test-prefixed (TEST_SUBJECT_PREFIXES) or bare s4-human-gate identity is accepted as founder; the couchGateStatus query returns 0 active-manifest binding — a stub/disconnected read producing no binding must not satisfy this case
- CASE 2 — start_ref `historic-inactive-couch-pass`
  - ACTION: Seed operator-gate-identity and historic-inactive-couch-pass (a real operator pass for a superseded sampleId while the current active manifest is inactive/drifted so couchGateStatus.allowed === false); Run deriveGoalState (a step-results JSON that may falsely set founderVerdict:true); Capture the emitted goal-state, the couchGateStatus result, and the getCouchVerdict query
  - MUST_OBSERVE: `couchGateStatus.allowed === false` for the current active manifest; founder attestation present == false, emitted met == false, `human_test.verdict == 'pending'`; gate.blocker names the unresolved/blocked S4-T7 human-owned gate
  - MUST_NOT_OBSERVE: the historic/inactive pass (a real couch_verdicts PASS row that exists but is unbound to the current active manifest) satisfies founder.present; `getCouchVerdict({})` latest-across-all-samples returns the historic pass and it is accepted as attestation while couchGateStatus.allowed is false; met == true or human_test.verdict == 'pass'; gate.overall == 'PASS' while couchGateStatus.allowed is false — an empty/stub resolver that ignores couchGateStatus.allowed must not satisfy this case

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | deriveGoalState emits met:false and exits nonzero when any step result is BLOCKED/FAIL | AC-1 | `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-1'` |
| TC-2 | a hand-supplied met:true cannot survive a BLOCKED step through deriveGoalState | AC-1 | `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-1'` |
| TC-3 | a bundle whose captured commit != HEAD is rejected with STALE_EVIDENCE_BUNDLE | AC-2 | `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-2'` |
| TC-4 | a repro script passing lever2FixedGeometry fails the seam scan and blocks met:true | AC-2 | `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-2'` |
| TC-5 | rebuilt step4/step7 write scripts succeed under a seeded operator identity | AC-3 | `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-3'` |
| TC-6 | rebuilt step4/step7 write scripts fail with FORBIDDEN under a bare s4-human-gate identity | AC-3 | `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-3'` |
| TC-7 | deriveGoalState leaves human_test pending when no S4-T7 founder verdict exists | AC-4 | `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-4'` |
| TC-8 | rebuilt step3 couch export succeeds under a seeded operator and is FORBIDDEN under a bare s4-human-gate identity | AC-5 | `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-5'` |
| TC-9 | rebuilt step5 getCouchVerdict runs under the seeded operator with no seam args and never returns a synthesized/forged pass | AC-5 | `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-5'` |
| TC-10 | founderVerdict derives from the real couch_verdicts row (recordedBy) read via getCouchVerdict, not the JSON flag | AC-6 | `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-6'` |
| TC-11 | a JSON/CLI founderVerdict:true with no operator-recorded row yields met:false and human_test.verdict 'pending' | AC-6 | `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-6'` |
| TC-12 | a bogus --head-commit does not change the STALE_EVIDENCE_BUNDLE outcome computed against the internal HEAD | AC-7 | `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-7'` |
| TC-13 | a missing bundle directory fails closed with MISSING_EVIDENCE_BUNDLE (never {ok:true}) | AC-8 | `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-8'` |
| TC-14 | an untracked-on-disk bundle is rejected with UNTRACKED_EVIDENCE_BUNDLE | AC-8 | `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-8'` |
| TC-15 | a clean-but-stale committed bundle (captured commit != HEAD) is rejected with STALE_EVIDENCE_BUNDLE (stale_commit) | AC-8 | `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-8'` |
| TC-16 | a tampered step-results JSON flipping BLOCKED→PASS (uncorroborated by the manifest) is rejected / does not change the outcome | AC-9 | `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-9'` |
| TC-17 | generator.attested_source_commit equals internal git rev-parse HEAD and the provenance verifier confirms attestation_commit is a STRICT descendant (never equal/ancestor/unrelated, PROVENANCE_RELATION_INVALID otherwise); derived_from stays repository-relative | AC-10 | `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-10'` |
| TC-18 | a manifest tracked at HEAD but modified only in the working tree (dirty) is rejected with MANIFEST_NOT_HEAD_BOUND — resolved from the HEAD blob, not readFileSync — and produces no met:true | AC-11 | `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-11'` |
| TC-19 | an old manifest/artifact laundered by an unrelated new bundle file (directory-level git log == HEAD) is rejected per-file with EVIDENCE_FILE_STALE because each required file's own last-touch commit != HEAD | AC-11 | `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-11'` |
| TC-20 | a manifest artifact path resolving outside the bundle (../../package.json), even though tracked in git, is rejected with ARTIFACT_PATH_ESCAPE via a realpath containment check before gitTracked | AC-12 | `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-12'` |
| TC-21 | founder attestation requires couchGateStatus.allowed===true bound to the active manifest's sampleId/manifestHash/catalogVersion via a matching getCouchVerdict({sampleId}) row recorded by a requireOperator non-test, non-bare identity (never getCouchVerdict({}) latest-across-all-samples) | AC-13 | `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-13'` |
| TC-22 | a historic/inactive couch pass unbound to the current active manifest (couchGateStatus.allowed false) yields met:false and human_test.verdict 'pending' even though a couch_verdicts PASS row exists somewhere | AC-13 | `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-13'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- tools/gate/deriveGoalState.ts (MODIFY) - remove the `founderVerdict` boolean + `--head-commit` completion authority; compute HEAD internally; replace the working-tree `loadManifest` read with HEAD-blob resolution + per-file freshness (via verifyEvidenceManifest); add realpath containment to substantiateSteps; replace resolveFounderVerdict's `getCouchVerdict({})` with the couchGateStatus.allowed-bound resolver; emit `generator.attested_source_commit` and wire verifyProvenance for the two-object relation
- tools/gate/verifyEvidenceManifest.ts (NEW, REQUIRED — promoted from optional) - resolve manifest + every enumerated artifact from immutable HEAD-bound content (`git show HEAD:<repo-rel-path>` or working-tree-blob-hash vs `git rev-parse HEAD:<path>` byte-equality); reject dirty/staged evidence (MANIFEST_NOT_HEAD_BOUND); per-file freshness (each required file's own `git log -1 --format=%H -- <path>` == internal HEAD, EVIDENCE_FILE_STALE); realpath artifact containment (`realpath(bundle/artifact)` startsWith `realpath(bundle)+sep`, reject symlink/`..` escape, ARTIFACT_PATH_ESCAPE)
- tools/gate/verifyProvenance.ts (NEW, REQUIRED) - two-object provenance contract: record `attested_source_commit` = internal `git rev-parse HEAD` at generation time; verify `attestation_commit` (the sentinel's last-touch commit) is a STRICT descendant via `git merge-base --is-ancestor <attested_source_commit> <attestation_commit>` && `attested_source_commit != attestation_commit` (PROVENANCE_RELATION_INVALID otherwise); never assert self-equality
- tools/gate/resolveFounderVerdict.ts (NEW, REQUIRED — promoted from optional) - derive founder attestation from `couchGateStatus.allowed===true` for the current active manifest, bound to its exact sampleId/manifestHash/catalogVersion via a matching `getCouchVerdict({sampleId})` row (READ-ONLY public APIs); reject test-prefixed (TEST_SUBJECT_PREFIXES) / bare (s4-human-gate) identities and any historic/inactive/unbound pass
- .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/sprint-goal-state.json (MODIFY - regenerated ONLY by deriveGoalState through the hardened path, never hand-edited; generator.attested_source_commit must equal the actual current HEAD at generation time)
- .gate-evidence/2026-07-19T22:59:46Z/scripts/step3.sh (MODIFY - rebuild to operator-gated couch export, no seam args)
- .gate-evidence/2026-07-19T22:59:46Z/scripts/step4.sh (MODIFY - rebuild to operator-gated recordCouchVerdict, seed operator identity)
- .gate-evidence/2026-07-19T22:59:46Z/scripts/step5.sh (MODIFY - rebuild to getCouchVerdict under the seeded operator, no seam args)
- .gate-evidence/2026-07-19T22:59:46Z/scripts/step7.sh (MODIFY - rebuild to operator-gated disposition mutations, no seam args)
- convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts (NEW/MODIFY - add AC-6..AC-10 adversarial cases)

**writeProhibited:**
- convex/waterfallOrchestrator.ts, convex/actions/rideWorthinessClassifier.ts - live-provider closeout + guard changes are REDHAT-FIX-01/REDHAT-FIX-13 scope
- convex/couchVerdict.ts, convex/couchSampleAssembler.ts - couchGateStatus/getCouchVerdict/recordCouchVerdict/assembleCouchSample/freeze/re-freeze/routeHashes logic is REDHAT-FIX-15/REDHAT-FIX-16 scope; import/call the existing operator-gated public APIs only (do NOT re-litigate the legacy-manifest routeHashes fix)
- convex/guards.ts - requireOperator/requireOperatorAction/requireIdentity/assertTestSubjectOrThrow already exist; import/call only (do NOT change getCouchVerdict's requireIdentity gating to force a FORBIDDEN control)
- GATE-RESULTS.md - honest re-audit record is read-only source of truth
- The actual human founder visual review (S4-T7) - EXTERNAL human-owned blocker; must not be synthesized, simulated, or scope-reduced by this harness
- Any RN/Expo/app client code

## READING LIST

- `convex/_generated/ai/guidelines.md` (all) — Convex API rules that override training data (mandatory per CLAUDE.md)
- `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260720T233411Z.md` (all) — the fresh review re-opening FIX-12: CRITICAL (forgeable completion authority via `founderVerdict`/`steps`/`--head-commit`), HIGH (optional/skippable bundle + no HEAD comparison), MEDIUM (stale generator.head_commit + ephemeral /tmp input)
- `tools/gate/deriveGoalState.ts` (212-263, 122-182, 295-351) — the current forgeable design: `DeriveOptions.founderVerdict` boolean, `opts.headCommit || headCommit()`, `if (opts.bundlePath)` optional validation, missing-dir → `{ok:true}`, `allStepsPass` from `opts.steps` verbatim, `generator.head_commit = args['head-commit'] || headCommit()`
- `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/sprint-goal-state.json` (1-195) — the machine-derived sentinel; its generator.head_commit must equal the actual current HEAD
- `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-results.json` (all) — the honest BLOCKED re-audit that goal-state must reconcile against (read-only)
- `convex/guards.ts` (143-193) — requireOperator/requireOperatorAction (step3 export + step4/step7) + requireIdentity (step5 getCouchVerdict + couch reads) + assertTestSubjectOrThrow/TEST_SUBJECT_PREFIXES
- `convex/couchSampleAssembler.ts` (743-760) — assembleCouchSample/export = requireOperatorAction (step3 export operator-gated → bare identity FORBIDDEN)
- `convex/couchVerdict.ts` (52-59,152-157,181-184,359) — recordCouchVerdict (requireOperator, step4), getCouchVerdict/couchGateStatus (requireIdentity — the authenticated durable source for founderVerdict), clearCouchVerdictsPublic (operator-gated clear used to seed the empty adversarial state)
- `convex/schema.ts` — `couch_verdicts` (VER-05, append-only, operator-recorded) and `couch_manifest_activations` (FIX-14) — the durable tables the writer must resolve founder attestation from (reference only; must not modify)
- `convex/waterfallOrchestrator.ts` (801-841) — runSampleWaterfall (no seam args) vs the seam variant with lever2FixedGeometry — the validator must reject seam args
- `brain/docs/kanban/SCENARIO-CONTRACT-V1.md` + `brain/docs/REQUIREMENT-TRACKING.md` — scenario schema / requirement-contract format the new ACs must satisfy (zero CRITICAL/HIGH)
- `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T005254Z.md` (all) — the fresh review re-opening FIX-12: CRITICAL (caller-controlled manifest/artifacts — working-tree readFileSync, directory-level git log laundering, `../` artifact traversal) and HIGH (resolveFounderVerdict accepts any latest pass row, never calls couchGateStatus.allowed) and MEDIUM (impossible self-provenance claim → two-object attested_source_commit/attestation_commit contract)
- `tools/gate/deriveGoalState.ts` (212-224) — `loadManifest` reads manifest.json via `readFileSync` off the LIVE WORKING TREE with no HEAD-blob binding — must be replaced with `git show HEAD:<path>` / blob byte-equality (AC-11)
- `tools/gate/deriveGoalState.ts` (231-298) — `validateBundle`: bundle-level `gitTracked(bundlePath).length===0` (ANY tracked path counts) and directory-level `gitLastCommit(bundlePath)` freshness — must become per-file HEAD-content + per-file last-touch checks (AC-11)
- `tools/gate/deriveGoalState.ts` (340-355) — `substantiateSteps` `posix.join(bundleRel, art)` normalizes `..` then `gitTracked` with NO containment check — must add realpath containment before tracking (AC-12)
- `tools/gate/deriveGoalState.ts` (396-439) — `resolveFounderVerdict` runs `getCouchVerdict({})` (latest of up to 50 across ALL samples) and checks only overallVerdict/recordedBy — must be rebound to `couchGateStatus.allowed===true` + `getCouchVerdict({sampleId})` + non-test operator identity (AC-13)
- `tools/gate/deriveGoalState.ts` (486-567) — `deriveGoalState` computes `head=gitHeadInternal()` once and writes `generator.head_commit` — extend to emit `generator.attested_source_commit` and the two-object provenance relation (AC-10)
- `convex/couchVerdict.ts` (167-170) — `getCouchVerdict({})` returns the latest of up to 50 verdicts across ALL samples (the unbound row the writer currently trusts); `getCouchVerdict({sampleId})` returns the row bound to a specific sample (recordedBy/manifestHash/catalogVersion)
- `convex/couchVerdict.ts` (192-306) — `couchGateStatus`: the authoritative allowed:true source — active `couch_manifest_activations` + complete `routeHashes` baseline (FIX-16) + live geometry drift (FIX-15) + pass verdict bound to the active sampleId/manifestHash/catalogVersion; return shape omits `recordedBy` (pair with `getCouchVerdict({sampleId})` for identity)
- `convex/guards.ts` (143-193, re-read for this refresh) — `OPERATOR_ROLES = {founder, operator}` (both legitimate Founder-Operator reviewers per this sprint's own human-gate framing) and `TEST_SUBJECT_PREFIXES` — the definition of a real requireOperator non-test, non-bare identity for AC-13 (do NOT require role literally `founder`)

## CODE PATTERN

- Pattern: Authenticated-source derivation (no caller trust): `deriveGoalState` computes `head = gitRevParseHEAD()` internally (no `--head-commit` override); resolves `founderAttestation = resolveFounderVerdict()` by reading real `couch_verdicts` via `getCouchVerdict`/`couchGateStatus` on the Convex dev deployment (the `founderVerdict` boolean input is removed); requires a MANDATORY committed manifest — `validateBundle` returns an error (not `{ok:true}`) when the dir is missing (`MISSING_EVIDENCE_BUNDLE`), when `git ls-files` shows the scripts untracked (`UNTRACKED_EVIDENCE_BUNDLE`), or when `gitLastCommit(bundle) !== head` (`STALE_EVIDENCE_BUNDLE`/`stale_commit`), in addition to the existing seam/bare-identity scans; each step's PASS is substantiated against the manifest's enumerated artifacts (`STEP_RESULT_UNSUBSTANTIATED` for an uncorroborated/tampered claim); `met = allStepsSubstantiatedPass && bundleValid && durableFounderAttestation`; `generator.head_commit = head` (the internal SHA) and `generator.derived_from` is a repository-relative immutable manifest path. Rebuilt step3/4/5/7 scripts bootstrap an operator identity then call the current public APIs with no seam args. THIRD REFRESH: `verifyEvidenceManifest` resolves the manifest and every enumerated artifact from the HEAD blob (`git show HEAD:<path>`, never `readFileSync`) and checks EACH file's own `git log -1` against HEAD (not the bundle directory's); `substantiateSteps` canonicalizes `realpath(bundle/artifact)` and requires containment under `realpath(bundle)` before any `gitTracked` call; `resolveFounderVerdict` calls `couchGateStatus({})` first and only trusts a `getCouchVerdict({sampleId})` row bound to that status's active `sampleId`/`manifestHash`/`catalogVersion`, recorded by a non-test `requireOperator` identity; `verifyProvenance` records `generator.attested_source_commit = head` and, given a later `attestation_commit`, asserts `git merge-base --is-ancestor attested_source_commit attestation_commit` strictly (never equality).
- Pattern source: `tools/gate/deriveGoalState.ts:122-263 (validator + derivation to harden) + convex/couchVerdict.ts:52-157 (recordCouchVerdict operator write / getCouchVerdict identity read as the durable founder source) + convex/couchSampleAssembler.ts:743-751 (operator-gated export) + git plumbing (rev-parse HEAD, ls-files, log -1)`
- Anti-pattern: `founderVerdict = opts.founderVerdict === true`; `head = opts.headCommit || headCommit()`; `if (opts.bundlePath)` (optional validation); missing dir → `{ok:true}`; `allStepsPass` from `opts.steps` verbatim; `generator.head_commit = args['head-commit'] || headCommit()`; synthesizing human_test.verdict='pass' with no real couch_verdicts row; asserting a FORBIDDEN control on step5 getCouchVerdict (identity-gated) which would force an out-of-scope guard change; reading manifest/artifacts via `readFileSync` off the working tree; gating freshness on bundle-directory `git log -1` instead of each file's own; `posix.join(bundleRel, art)` with no realpath containment check; `resolveFounderVerdict` calling `getCouchVerdict({})` (latest-across-all-samples) instead of `couchGateStatus({}).allowed`-bound; asserting `attestation_commit === attested_source_commit` (impossible self-equality)

## VERIFICATION GATES

- test: `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts` → Exit 0
- test (new adversarial ACs): `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-6|AC-7|AC-8|AC-9|AC-10|AC-11|AC-12|AC-13'` → Exit 0
- typecheck (in-scope): `npx tsc --noEmit -p convex/tsconfig.json` → Exit 0
- typecheck (no-regression): `pnpm type-check 2>&1 | grep -c 'error TS'` → no greater than baseline
- lint: `pnpm exec biome check` → Exit 0
- convex build: `pnpm convex:dev --once` → Exit 0
- scenario validator: `python3 -c "import re,sys;print(re.search(r'<!-- REQUIREMENT-CONTRACT v1 -->\n<!--\n(.*?)\n-->',open(sys.argv[1]).read(),re.S).group(1))" .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/REDHAT-FIX-12-*.md | python3 ~/Projects/brain/tools/validate-scenario/validate_scenario.py; echo "EXIT:$?"` → Exit 0, zero CRITICAL/HIGH

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Convex backend task: harden the machine-derived fail-closed goal-state writer so its completion authority (founder attestation, HEAD, mandatory committed manifest, step substantiation) derives only from authenticated durable sources, plus rebuild the gate-evidence step scripts against the real operator-gated Convex surface (requireOperator/requireOperatorAction/requireIdentity) on a Convex dev deployment. convex-implementer owns this domain; convex-reviewer verifies the anti-forgery/completion-authority contract.
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green (the six AC-6..AC-10 adversarial vectors plus the THIRD REFRESH's dirty-working-tree, directory-laundering, path-traversal, historic-inactive-pass, and self-equal-provenance vectors each RED against the current caller-trusting / working-tree-reading / unbound-attestation writer)
- Integration coverage: PRIMARY AC is integration against the writer + real Convex dev deployment; AC-6/AC-8/AC-9 exercise the durable Convex source + git tracking, not stubs
- Scenario un-fakeable: validate_scenario exit 0 (zero CRITICAL/HIGH) on every behavioral AC; captured EVIDENCE shows the fail-closed outcome and the durable-source attribution (recordedBy, real HEAD SHA, tracked artifact paths)

## DEPENDENCIES

- Depends on: —
- Blocks: —
- Coordinate with S4-T7: the Founder-Operator/live-provider gate is an external, unresolved, human-owned blocker — this harness must never synthesize or satisfy it; human_test.verdict may only become 'pass' when a genuine operator-recorded couch_verdicts row exists (a real seeded call through recordCouchVerdict), never a JSON flag or raw insert.
- Consume REDHAT-FIX-01 (removed the lever2FixedGeometry seam from public entries) by scanning for and rejecting seam args.
- Consume REDHAT-FIX-06/13 (requireOperator/requireOperatorAction/requireIdentity already exist) — rebuilt scripts authenticate as a seeded operator; do not change guard gating.
- Preserve REDHAT-FIX-15/16 as fixed and out of scope — call couchVerdict/couchSampleAssembler public read APIs only; do not touch the legacy-manifest routeHashes fix.

## CODING STANDARDS

- convex/_generated/ai/guidelines.md
- brain/docs/TESTING-HIERARCHY.md
- brain/docs/CODING-STANDARDS.md
- brain/docs/CONVEX-RULES.md

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-12",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "blocked-step-results": {
      "description": "A computed 8-step gate results set with at least one BLOCKED/FAIL step, fed to deriveGoalState.",
      "seed_method": "public_api",
      "records": [
        "stepResults=[{n:1,result:'BLOCKED'},{n:2..8,result:'PASS'}] passed to deriveGoalState({stepResults})"
      ]
    },
    "stale-forged-bundle": {
      "description": "The retained withdrawn bundle .gate-evidence/2026-07-19T22:59:46Z whose step1/2/7 scripts pass lever2FixedGeometry under a bare s4-human-gate identity and whose captured commit differs from current HEAD.",
      "seed_method": "public_api",
      "records": [
        ".gate-evidence/2026-07-19T22:59:46Z/scripts/{step1,step2,step7}.sh with lever2FixedGeometry + a captured commit != current HEAD"
      ]
    },
    "operator-gate-identity": {
      "description": "A bootstrapped operator/founder identity used by the rebuilt step scripts to call the operator-gated public Convex surface.",
      "seed_method": "public_api",
      "records": [
        "users row upserted for clerkUserId 's4t12-operator' with role 'founder'"
      ]
    },
    "bare-closeout-identity": {
      "description": "A bare 's4-human-gate' authenticated identity with NO operator/founder role, used as the negative control for the rebuilt scripts.",
      "seed_method": "public_api",
      "records": [
        "users row for clerkUserId 's4-human-gate' with no role (defaults to rider)"
      ]
    },
    "operator-recorded-couch-state": {
      "description": "An operator-recorded couch verdict + frozen manifest present so rebuilt step3 export, step5 getCouchVerdict, and the writer's founder-attestation resolution have real state to read.",
      "seed_method": "public_api",
      "records": [
        "operator 's4t12-operator' records a couch verdict via the rebuilt step4 (recordCouchVerdict) so getCouchVerdict/couchGateStatus return a real operator-recorded row"
      ]
    },
    "no-couch-verdict-state": {
      "description": "couch_verdicts holds NO genuine S4-T7 verdict (cleared through the operator-gated clearCouchVerdictsPublic), paired with a step-results JSON that FALSELY carries founderVerdict:true.",
      "seed_method": "public_api",
      "records": [
        "operator 's4t12-operator' clears couch_verdicts via clearCouchVerdictsPublic; step-results.json includes founderVerdict:true with no matching couch_verdicts row"
      ]
    },
    "clean-stale-bundle": {
      "description": "A committed evidence bundle containing only innocuous scripts (no lever2FixedGeometry seam, no bare s4-human-gate identity) whose captured commit is a parent commit != current HEAD.",
      "seed_method": "cli",
      "records": [
        "a git-committed bundle dir whose scripts are seam-free/identity-clean but git log -1 --format=%H -- <bundle> != git rev-parse HEAD"
      ]
    },
    "missing-bundle-path": {
      "description": "A bundle path that does not exist on disk at all.",
      "seed_method": "cli",
      "records": [
        "deriveGoalState pointed at a non-existent .gate-evidence/<absent> directory"
      ]
    },
    "untracked-bundle": {
      "description": "A bundle directory present on disk but NOT committed to git (git ls-files returns empty for its scripts).",
      "seed_method": "cli",
      "records": [
        "a bundle dir created on disk without git add; git ls-files -- <bundle> returns 0 tracked paths"
      ]
    },
    "committed-manifest-corroborated": {
      "description": "A committed evidence manifest enumerating per-step artifacts (all tracked at current HEAD) that corroborate each step's PASS claim, including a real operator-recorded couch verdict.",
      "seed_method": "public_api",
      "records": [
        "manifest.json listing step artifact paths tracked at HEAD; operator 's4t12-operator' recorded the couch verdict via recordCouchVerdict"
      ]
    },
    "tampered-step-results": {
      "description": "A step-results JSON altered to flip a BLOCKED step to PASS (uncorroborated), paired with the committed-manifest-corroborated manifest that does NOT corroborate the flipped step.",
      "seed_method": "cli",
      "records": [
        "step-results.json with step 1 hand-edited from 'BLOCKED' to 'PASS'; the committed manifest enumerates no artifact substantiating step 1's PASS"
      ]
    },
    "dirty-working-tree-manifest": {
      "description": "A committed evidence bundle whose manifest.json is tracked at HEAD but then modified ONLY in the working tree (dirty, uncommitted) to repoint both PASS steps at a different tracked file \u2014 the working-tree content diverges from the HEAD blob.",
      "seed_method": "cli",
      "records": [
        "a git-committed bundle dir + manifest.json tracked at HEAD, then manifest.json edited on disk WITHOUT git add/commit so `git show HEAD:<bundle>/manifest.json` != the working-tree bytes; `git status` reports it modified/dirty"
      ]
    },
    "directory-laundered-evidence": {
      "description": "A manifest.json and its enumerated artifact committed at an OLDER parent commit, with an unrelated file (README.md) added to the SAME bundle directory at HEAD so bundle-DIRECTORY-level `git log -1 -- <bundle>` == HEAD while each required file's OWN last-touch commit != HEAD.",
      "seed_method": "cli",
      "records": [
        "manifest.json + step artifact committed at parent commit P; an unrelated README.md added under the same bundle dir and committed at HEAD; `git log -1 --format=%H -- <bundle>` == HEAD but `git log -1 --format=%H -- <bundle>/manifest.json` == P != HEAD"
      ]
    },
    "traversal-artifact-manifest": {
      "description": "A committed bundle whose manifest declares an artifact path that traverses OUTSIDE the bundle directory (`../../package.json`) for a PASS step; the escaped file is itself tracked in git but is unrelated source, not gate evidence.",
      "seed_method": "cli",
      "records": [
        "manifest.json committed at HEAD listing artifacts:['../../package.json'] for a PASS step; realpath(bundle/artifact) resolves outside realpath(bundle); package.json is tracked but not gate evidence"
      ]
    },
    "active-manifest-allowed-pass": {
      "description": "A CURRENT active couch manifest activation whose couchGateStatus resolves allowed===true, bound to a real operator-recorded pass verdict for that active manifest's sampleId/manifestHash/catalogVersion.",
      "seed_method": "public_api",
      "records": [
        "operator 's4t12-operator' activates a couch manifest with a complete routeHashes baseline and no live geometry drift, and records a pass couch_verdict for THAT active sampleId via recordCouchVerdict, so couchGateStatus({}) returns allowed:true with sampleId/manifestHash/catalogVersion matching getCouchVerdict({sampleId})"
      ]
    },
    "historic-inactive-couch-pass": {
      "description": "A real pass couch_verdict row that EXISTS but is NOT bound to the current active manifest.",
      "seed_method": "public_api",
      "records": [
        "operator 's4t12-operator' recorded a pass couch_verdict for a superseded sampleId; the current active manifest is inactive/drifted so couchGateStatus({}) returns allowed:false; getCouchVerdict({}) latest-across-all-samples still returns the historic pass row"
      ]
    },
    "sentinel-descendant-provenance": {
      "description": "A generated sentinel committed such that its carrying (attestation) commit is a genuine STRICT descendant of the recorded attested_source_commit.",
      "seed_method": "cli",
      "records": [
        "deriveGoalState run at source commit S recording generator.attested_source_commit==S; the emitted sentinel committed as a later commit A where `git merge-base --is-ancestor S A` succeeds and S != A"
      ]
    },
    "sentinel-selfequal-provenance": {
      "description": "A sentinel whose recorded attested_source_commit equals its own carrying commit (self-equality) OR is unrelated to its carrying commit.",
      "seed_method": "cli",
      "records": [
        "a committed sentinel whose generator.attested_source_commit is hand-set equal to its own last-touch commit (or to an unrelated commit U with no ancestor relation), so the strict-descendant relation does NOT hold"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "Goal-state writer fails closed on any BLOCKED/FAIL step",
      "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-1'",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "flow_ref": "UC-VER-05",
        "verification_service": "deriveGoalState writer invoked against a real step-results input + the emitted goal-state file",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "deriveGoalState copies a caller-supplied met:true through without recomputing from step results",
            "the writer treats a BLOCKED step as PASS via a hardcoded/stubbed predicate and still emits gate.overall == 'PASS'"
          ]
        },
        "evidence": {
          "artifact_type": "file_snapshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "blocked-step-results",
            "action": {
              "actor": "api_client",
              "steps": [
                "Provide blocked-step-results (step 1 BLOCKED, rest PASS) to deriveGoalState",
                "Run deriveGoalState and capture the emitted sprint-goal-state.json and its exit code"
              ]
            },
            "end_state": {
              "must_observe": [
                "emitted met == false",
                "emitted goal == 'GATE-GOAL: BLOCKED' and gate.overall == 'BLOCKED'",
                "writer exit code != 0"
              ],
              "must_not_observe": [
                "emitted met == true",
                "gate.overall == 'PASS' while a step result is BLOCKED",
                "gate.overall is silently rewritten away from 'BLOCKED' (it must stay 'BLOCKED', unchanged)",
                "the writer's output is not empty \u2014 a no-op/stub writer producing an empty file must not satisfy this AC"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "Stale/forged evidence bundle is rejected with STALE_EVIDENCE_BUNDLE",
      "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-2'",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "flow_ref": "UC-VER-05",
        "verification_service": "deriveGoalState bundle validator against the retained .gate-evidence/2026-07-19T22:59:46Z bundle",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "the validator ignores the captured commit and accepts a bundle from an older commit",
            "the validator does not scan repro scripts for the removed lever2FixedGeometry seam arg"
          ]
        },
        "evidence": {
          "artifact_type": "file_snapshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "stale-forged-bundle",
            "action": {
              "actor": "api_client",
              "steps": [
                "Point deriveGoalState at the retained .gate-evidence/2026-07-19T22:59:46Z bundle with the internally computed HEAD",
                "Run the bundle validation and capture the thrown error and emitted goal-state (if any)"
              ]
            },
            "end_state": {
              "must_observe": [
                "validation throws/reports error code == 'STALE_EVIDENCE_BUNDLE'",
                "validation error exposes `error.details.capturedCommit !== error.details.headCommit` (captured commit does not equal the current `HEAD`)",
                "no goal-state with met:true is written"
              ],
              "must_not_observe": [
                "the forged bundle is accepted as reproducible",
                "a lever2FixedGeometry-bearing script passes the seam scan",
                "no `sprint-goal-state.json` write occurs (file absent/unchanged)",
                "the extracted STALE_EVIDENCE_BUNDLE error detail is not empty \u2014 a stub validator returning an empty/no-op result must not satisfy this AC"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "Rebuilt operator-gated write scripts (step4 recordCouchVerdict, step7 disposition) pass under a seeded operator and are FORBIDDEN under a bare s4-human-gate identity",
      "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-3'",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "flow_ref": "UC-VER-05",
        "verification_service": "Convex dev deployment (real requireOperator + recordCouchVerdict + disposition mutations)",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "the rebuilt scripts still authenticate as a bare s4-human-gate identity and the operator-gated mutation silently succeeds because the identity check is stubbed/mocked",
            "the scripts pass a seam arg to reach a deterministic result"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "operator-gate-identity",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed operator-gate-identity and bare-closeout-identity",
                "Run the rebuilt step4 (recordCouchVerdict) and step7 (disposition) scripts as 's4t12-operator'",
                "Re-run the same scripts as the bare 's4-human-gate' identity",
                "Query couch_verdicts and the disposition records"
              ]
            },
            "end_state": {
              "must_observe": [
                "operator run: recordCouchVerdict/disposition succeed and rows are written with recordedBy == 's4t12-operator'",
                "bare s4-human-gate run: the call throws error.code == 'FORBIDDEN'"
              ],
              "must_not_observe": [
                "the bare s4-human-gate identity records a couch verdict or disposition",
                "any script passes a lever2FixedGeometry or other seam arg",
                "couch_verdicts row count for the bare s4-human-gate identity stays 0 (no row written)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "Harness never fabricates the human founder review; human_test stays pending absent an S4-T7 record",
      "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-4'",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "flow_ref": "UC-VER-05",
        "verification_service": "deriveGoalState writer + emitted goal-state file",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "deriveGoalState hardcodes human_test.verdict = 'pass' with no S4-T7 record",
            "the writer copies a stale human_test block from the forged bundle"
          ]
        },
        "evidence": {
          "artifact_type": "file_snapshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "blocked-step-results",
            "action": {
              "actor": "api_client",
              "steps": [
                "Run deriveGoalState with no S4-T7 founder verdict record present",
                "Capture the emitted human_test block in sprint-goal-state.json"
              ]
            },
            "end_state": {
              "must_observe": [
                "human_test.verdict is 'pending'/unresolved (not 'pass')",
                "the writer surfaces that a human/S4-T7 review is still required"
              ],
              "must_not_observe": [
                "human_test.verdict == 'pass' synthesized without an S4-T7 record",
                "a stale human_test.run_id from the forged bundle is carried forward as passing",
                "`human_test.verdict` is set to anything other than `'pending'` \u2014 it must remain `'pending'`/unresolved while the S4-T7 record is absent",
                "the emitted `human_test` block is not empty \u2014 a stub writer producing an empty/missing block must not satisfy this AC"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "Rebuilt export/read scripts (step3 operator-gated export, step5 getCouchVerdict) pass under a seeded operator; step3 is FORBIDDEN under a bare identity and step5 never returns a synthesized pass",
      "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-5'",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "flow_ref": "UC-VER-05",
        "verification_service": "Convex dev deployment (real requireOperatorAction couch export + requireIdentity getCouchVerdict)",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "the rebuilt step3 export still authenticates as a bare s4-human-gate identity and the operator-gated export silently succeeds",
            "step5 getCouchVerdict returns a synthesized/forged pass with no operator-recorded verdict, or the rebuilt script reaches a deterministic result via a seam arg",
            "the rebuilt scripts are unchanged and still reuse the bare s4-human-gate identity"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "operator-recorded-couch-state",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed operator-gate-identity, bare-closeout-identity, and operator-recorded-couch-state",
                "Run the rebuilt step3 (couch export) and step5 (getCouchVerdict) scripts as 's4t12-operator'",
                "Re-run the rebuilt step3 export as the bare 's4-human-gate' identity",
                "Capture the export result and the getCouchVerdict result"
              ]
            },
            "end_state": {
              "must_observe": [
                "operator run: step3 export succeeds and step5 getCouchVerdict returns the operator-recorded verdict (recordedBy == 's4t12-operator')",
                "bare s4-human-gate run: the operator-gated step3 export throws error.code == 'FORBIDDEN'"
              ],
              "must_not_observe": [
                "the bare s4-human-gate identity completes the operator-gated couch export",
                "step5 getCouchVerdict returns a synthesized/forged pass with no operator-recorded verdict",
                "any rebuilt step3/step5 script passes a lever2FixedGeometry or other seam arg"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-6",
      "type": "acceptance_criterion",
      "description": "Founder attestation is resolved from the authenticated durable couch_verdicts source, never a caller founderVerdict flag",
      "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-6'",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "flow_ref": "UC-VER-05",
        "verification_service": "Convex dev deployment (getCouchVerdict/couchGateStatus over real couch_verdicts) + deriveGoalState writer",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "deriveGoalState sets founderVerdict from opts.founderVerdict === true (the caller JSON/CLI boolean) instead of reading the durable couch_verdicts row",
            "the founder-resolution read is stubbed/mocked to a constant true",
            "the writer is disconnected from the Convex source and returns the flag verbatim"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "operator-recorded-couch-state",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed operator-gate-identity and operator-recorded-couch-state (a real recordCouchVerdict row by 's4t12-operator')",
                "Run deriveGoalState with a step-results JSON that omits founderVerdict (or sets it false)",
                "Capture the resolved founder attestation and the couch_verdicts query"
              ]
            },
            "end_state": {
              "must_observe": [
                "the resolved founder attestation is sourced from the real couch_verdicts row (recordedBy == 's4t12-operator')",
                "human_test.verdict == 'pass', matching the couch_verdicts row's recorded verdict field value (not derived from the absent/false JSON founderVerdict flag)",
                "the operator-recorded row is present in the couch_verdicts query (row count >= 1)"
              ],
              "must_not_observe": [
                "the founder attestation is read from the JSON founderVerdict flag",
                "the resolved recordedBy is empty/undefined \u2014 a disconnected/stub read producing no attribution must not satisfy this case",
                "couch_verdicts query returns 0 rows"
              ]
            }
          },
          {
            "start_ref": "no-couch-verdict-state",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed operator-gate-identity and no-couch-verdict-state (couch_verdicts cleared via operator-gated clearCouchVerdictsPublic)",
                "Run deriveGoalState with a step-results JSON that falsely sets founderVerdict:true",
                "Capture the emitted goal-state and human_test block"
              ]
            },
            "end_state": {
              "must_observe": [
                "emitted met == false",
                "human_test.verdict == 'pending'",
                "gate.blocker names the unresolved S4-T7 human-owned gate"
              ],
              "must_not_observe": [
                "met == true",
                "human_test.verdict == 'pass' produced from the JSON founderVerdict:true",
                "gate.overall == 'PASS' while couch_verdicts holds 0 genuine S4-T7 rows",
                "the JSON founderVerdict:true flag has any effect on the derived outcome"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-7",
      "type": "acceptance_criterion",
      "description": "HEAD is computed internally via git rev-parse HEAD; a forged/bogus --head-commit does not change the STALE_EVIDENCE_BUNDLE outcome",
      "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-7'",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "flow_ref": "UC-VER-05",
        "verification_service": "deriveGoalState bundle validator + internal git rev-parse HEAD",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "the validator uses opts.headCommit || headCommit() and trusts the caller --head-commit, so a bogus SHA equal to the captured commit makes the stale bundle pass",
            "the HEAD read is stubbed/mocked to the caller-supplied value",
            "the writer is disconnected from git rev-parse HEAD"
          ]
        },
        "evidence": {
          "artifact_type": "file_snapshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "clean-stale-bundle",
            "action": {
              "actor": "cli_user",
              "steps": [
                "Seed clean-stale-bundle (committed, seam-free, captured commit == a parent commit)",
                "Compute the parent commit SHA and pass it as a bogus --head-commit to deriveGoalState",
                "Capture the thrown error, the internal HEAD, and any goal-state write"
              ]
            },
            "end_state": {
              "must_observe": [
                "validation throws error code == 'STALE_EVIDENCE_BUNDLE'",
                "validation error exposes `error.details.capturedCommit !== error.details.headCommit` (captured commit does not equal the current `HEAD`)",
                "`error.details.headCommit` equals the actual `git rev-parse HEAD` value (the true current commit) and NOT the bogus supplied `--head-commit` SHA"
              ],
              "must_not_observe": [
                "the bundle is accepted because the bogus --head-commit matched the captured commit",
                "error.details.headCommit equals the caller-supplied bogus SHA",
                "met == true",
                "no error is produced \u2014 an empty/no-op validator that ignores HEAD must not satisfy this AC"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-8",
      "type": "acceptance_criterion",
      "description": "A committed evidence manifest is mandatory; missing, untracked, and clean-but-stale bundles are each rejected fail-closed",
      "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-8'",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "flow_ref": "UC-VER-05",
        "verification_service": "deriveGoalState mandatory-manifest validator (git-tracking + HEAD binding)",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "a missing bundle directory short-circuits to {ok:true} (the current behavior)",
            "the validator never runs git ls-files so an untracked bundle is accepted",
            "the validator computes gitLastCommit only for the error payload and never gates on captured commit != HEAD, so a clean-stale bundle passes",
            "the validator is a stub returning {ok:true}"
          ]
        },
        "evidence": {
          "artifact_type": "file_snapshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "missing-bundle-path",
            "action": {
              "actor": "cli_user",
              "steps": [
                "Point deriveGoalState at a non-existent bundle directory",
                "Run validation and capture the error and any goal-state write"
              ]
            },
            "end_state": {
              "must_observe": [
                "validation throws error code == 'MISSING_EVIDENCE_BUNDLE' (fail-closed)",
                "no sprint-goal-state.json with met:true is written"
              ],
              "must_not_observe": [
                "validation returns {ok:true} for the absent directory",
                "met == true",
                "gate.overall == 'PASS'",
                "an empty/no-op validator that skips the missing bundle satisfies this case"
              ]
            }
          },
          {
            "start_ref": "untracked-bundle",
            "action": {
              "actor": "cli_user",
              "steps": [
                "Create a bundle dir on disk WITHOUT git add",
                "Point deriveGoalState at it",
                "Run validation and capture the error and git ls-files output"
              ]
            },
            "end_state": {
              "must_observe": [
                "validation throws error code == 'UNTRACKED_EVIDENCE_BUNDLE'",
                "git ls-files -- <bundle> returns 0 tracked paths for the bundle scripts",
                "no met:true goal-state is written"
              ],
              "must_not_observe": [
                "the untracked bundle is accepted as valid evidence",
                "met == true",
                "the validator never consults git tracking \u2014 an empty/stub validator that ignores tracking must not satisfy this case"
              ]
            }
          },
          {
            "start_ref": "clean-stale-bundle",
            "action": {
              "actor": "cli_user",
              "steps": [
                "Point deriveGoalState at the clean-stale committed bundle with the internally computed HEAD",
                "Run validation and capture the error"
              ]
            },
            "end_state": {
              "must_observe": [
                "validation throws error code == 'STALE_EVIDENCE_BUNDLE' with error.details.reason == 'stale_commit'",
                "validation error exposes `error.details.capturedCommit !== error.details.headCommit` (captured commit does not equal the current `HEAD`)",
                "no met:true goal-state is written"
              ],
              "must_not_observe": [
                "the clean bundle passes purely because it has no forbidden seam/identity string",
                "met == true",
                "the captured-commit-vs-HEAD comparison is never performed as a pass/fail gate"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-9",
      "type": "acceptance_criterion",
      "description": "Step PASS claims are substantiated against the committed manifest artifacts; a tampered step-results JSON is inert",
      "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-9'",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "flow_ref": "UC-VER-05",
        "verification_service": "deriveGoalState manifest-substantiation check over a committed evidence manifest",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "allStepsPass is computed from opts.steps verbatim (the caller JSON) with no manifest corroboration, so flipping BLOCKED->PASS in the JSON flips the outcome",
            "the substantiation check is stubbed to always corroborate",
            "the writer is disconnected from the committed manifest"
          ]
        },
        "evidence": {
          "artifact_type": "file_snapshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "committed-manifest-corroborated",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed committed-manifest-corroborated (per-step artifacts tracked at HEAD)",
                "Run deriveGoalState with step-results that match the manifest",
                "Capture the per-step substantiation result"
              ]
            },
            "end_state": {
              "must_observe": [
                "each PASS step is confirmed backed by a committed artifact path enumerated in the manifest (e.g. `.gate-evidence/<ts>/step4.artifact` tracked at HEAD)",
                "the substantiation result lists the corroborating artifact path per step (>= 1 artifact path per PASS step)"
              ],
              "must_not_observe": [
                "substantiation passes with an empty artifact list",
                "the substantiation set is empty \u2014 a stub returning 'corroborated' with no artifact paths must not satisfy this case"
              ]
            }
          },
          {
            "start_ref": "tampered-step-results",
            "action": {
              "actor": "cli_user",
              "steps": [
                "Take the committed manifest and a step-results JSON hand-edited to flip step 1 from 'BLOCKED' to 'PASS' (no corroborating artifact)",
                "Run deriveGoalState",
                "Capture the emitted goal-state and error"
              ]
            },
            "end_state": {
              "must_observe": [
                "the writer rejects / reports error code == 'STEP_RESULT_UNSUBSTANTIATED' naming step 1",
                "emitted met == false",
                "gate.overall == 'BLOCKED'"
              ],
              "must_not_observe": [
                "the flipped PASS is accepted",
                "met == true",
                "gate.overall == 'PASS'",
                "the tampered step-results JSON changes the manifest-derived outcome \u2014 the empty/verbatim-trusting writer that copies opts.steps must not satisfy this case"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-10",
      "type": "acceptance_criterion",
      "description": "Generator provenance is a two-object contract: attested_source_commit is the internally-computed reviewed HEAD; attestation_commit (the sentinel's carrying commit) is verified to be its STRICT descendant \u2014 never the impossible self-equality",
      "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-10'",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "flow_ref": "UC-VER-05",
        "verification_service": "deriveGoalState generator metadata + tools/gate/verifyProvenance.ts two-object relation vs internal git rev-parse HEAD and git merge-base --is-ancestor",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "the contract asserts generator.head_commit equals the sentinel's OWN carrying commit (self-equality) \u2014 semantically impossible for an ordinary follow-up commit \u2014 so the check is perpetually stale/red or forces a false green",
            "the provenance verifier accepts an attestation_commit equal to, an ancestor of, or unrelated to attested_source_commit instead of requiring a STRICT descendant (git merge-base --is-ancestor && not equal)",
            "attested_source_commit is read from a caller --head-commit rather than the internal git rev-parse HEAD at generation time, or the verifier is a stub that returns valid without running git merge-base --is-ancestor"
          ]
        },
        "evidence": {
          "artifact_type": "file_snapshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "sentinel-descendant-provenance",
            "action": {
              "actor": "cli_user",
              "steps": [
                "Run deriveGoalState through the hardened writer at source commit S with the committed manifest as input; capture generator.attested_source_commit",
                "Commit the emitted sentinel as a later commit A (strict descendant of S)",
                "Run tools/gate/verifyProvenance.ts over the committed sentinel; capture the relation result and compare generator.attested_source_commit against the internal git rev-parse HEAD at generation time"
              ]
            },
            "end_state": {
              "must_observe": [
                "generator.attested_source_commit equals the internal git rev-parse HEAD at generation time (full 40-char SHA, byte-equal, computed internally \u2014 never caller-supplied)",
                "the provenance verifier confirms attestation_commit (the sentinel's own last-touch commit) is a STRICT descendant of attested_source_commit: git merge-base --is-ancestor <attested_source_commit> <attestation_commit> succeeds AND attested_source_commit != attestation_commit",
                "generator.derived_from is a repository-relative path beginning with '.spec/' or '.gate-evidence/'"
              ],
              "must_not_observe": [
                "the contract asserts attestation_commit == attested_source_commit (impossible self-equality)",
                "attested_source_commit equals a caller-supplied --head-commit SHA",
                "generator.derived_from begins with '/tmp/' or another absolute ephemeral path",
                "the generator block is empty/missing \u2014 a stub writer producing no provenance must not satisfy this AC"
              ]
            }
          },
          {
            "start_ref": "sentinel-selfequal-provenance",
            "action": {
              "actor": "cli_user",
              "steps": [
                "Take a committed sentinel whose generator.attested_source_commit is hand-set equal to its own carrying commit (or to an unrelated commit U)",
                "Run tools/gate/verifyProvenance.ts over it",
                "Capture the relation result and any met:true acceptance"
              ]
            },
            "end_state": {
              "must_observe": [
                "the provenance verifier rejects with code == 'PROVENANCE_RELATION_INVALID' when attestation_commit is equal to (or an ancestor of / unrelated to) attested_source_commit",
                "no met:true / GATE-GOAL: ACHIEVED is accepted for a sentinel whose provenance relation is not a strict descendant"
              ],
              "must_not_observe": [
                "a self-equal (attestation_commit == attested_source_commit) provenance is accepted as valid",
                "an unrelated or ancestor-inverted attestation_commit passes the relation check",
                "the verifier is a stub that returns valid without running git merge-base --is-ancestor \u2014 an empty/no-op verifier must not satisfy this case"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-11",
      "type": "acceptance_criterion",
      "description": "Manifest and every artifact are resolved from immutable HEAD-bound content and freshness is checked PER-FILE \u2014 both a dirty-working-tree manifest modification and an old-evidence-plus-unrelated-new-bundle-file directory-laundering attempt are rejected fail-closed",
      "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-11'",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "flow_ref": "UC-VER-05",
        "verification_service": "deriveGoalState HEAD-blob manifest/artifact resolver + per-file freshness check (git show HEAD:<path>, git log -1 -- <exact path>) over real committed/dirty bundles",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "the manifest/artifacts are read via readFileSync off the working tree instead of git show HEAD:<path> (or a working-tree-blob-hash vs HEAD comparison), so a dirty working-tree modification of manifest.json is accepted (the current loadManifest behavior)",
            "freshness is gated only on bundle-DIRECTORY-level git log -1 -- <bundle>, so an unrelated file newly committed under the bundle directory launders a stale manifest/artifact to PASS (the current gitLastCommit(bundlePath) behavior)",
            "the substantiation check is stubbed to always corroborate or is disconnected from git tracking/content binding"
          ]
        },
        "evidence": {
          "artifact_type": "file_snapshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "dirty-working-tree-manifest",
            "action": {
              "actor": "cli_user",
              "steps": [
                "Seed dirty-working-tree-manifest: commit a bundle + manifest.json at HEAD, then edit manifest.json on disk (repoint both PASS steps) WITHOUT git add/commit",
                "Run deriveGoalState pointed at the bundle with the internally computed HEAD",
                "Capture the thrown error, the HEAD-blob manifest bytes, and any goal-state write"
              ]
            },
            "end_state": {
              "must_observe": [
                "validation throws error code == 'MANIFEST_NOT_HEAD_BOUND'",
                "the HEAD-blob manifest content (read via `git show HEAD:<bundle>/manifest.json`) still declares the ORIGINAL 2 committed artifact paths \u2014 a SHA-256 digest of that HEAD-blob content does NOT equal a SHA-256 digest of the dirty working-tree manifest.json bytes",
                "no sprint-goal-state.json with met:true is written"
              ],
              "must_not_observe": [
                "the working-tree-modified manifest is read via readFileSync and accepted",
                "validateBundle returns ok:true and substantiateSteps returns null for the dirty manifest",
                "met == true",
                "the dirty manifest's repointed artifacts substantiate any PASS step \u2014 an empty/no-op validator that ignores the HEAD-vs-working-tree divergence must not satisfy this case"
              ]
            }
          },
          {
            "start_ref": "directory-laundered-evidence",
            "action": {
              "actor": "cli_user",
              "steps": [
                "Seed directory-laundered-evidence: commit manifest.json + artifact at parent P, then add an unrelated README.md under the same bundle dir and commit it at HEAD",
                "Run deriveGoalState pointed at the bundle with the internally computed HEAD",
                "Capture the thrown error, the per-file last-touch commits, and any goal-state write"
              ]
            },
            "end_state": {
              "must_observe": [
                "validation throws error code == 'EVIDENCE_FILE_STALE'",
                "each required file's OWN last-touch commit (git log -1 --format=%H -- <bundle>/manifest.json and -- <artifact>) equals P and != HEAD, even though git log -1 --format=%H -- <bundle> (directory-level) == HEAD",
                "no sprint-goal-state.json with met:true is written"
              ],
              "must_not_observe": [
                "directory-level git log -1 -- <bundle> == HEAD launders the stale manifest/artifact to PASS",
                "the unrelated README.md's HEAD-level touch satisfies per-file freshness for manifest.json/artifact",
                "met == true",
                "the validator only checks bundle-directory freshness \u2014 an empty/stub validator that skips per-file freshness must not satisfy this case"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-12",
      "type": "acceptance_criterion",
      "description": "An artifact path that resolves (after realpath/normalization) outside the bundle directory is rejected as a containment violation, even when the escaped file is tracked in git",
      "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-12'",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "flow_ref": "UC-VER-05",
        "verification_service": "deriveGoalState substantiateSteps realpath containment check (realpath(bundle/artifact) startsWith realpath(bundle)+sep) over a real committed traversal manifest",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "posix.join(bundleRel, art) normalizes .. and gitTracked accepts an out-of-bundle tracked file with no containment check (the current substantiateSteps behavior)",
            "no realpath/canonicalization containment check follows before gitTracked, so ../../package.json (tracked) substantiates a PASS step",
            "the containment check is stubbed to always pass or symlink escapes are not rejected"
          ]
        },
        "evidence": {
          "artifact_type": "file_snapshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "traversal-artifact-manifest",
            "action": {
              "actor": "cli_user",
              "steps": [
                "Seed traversal-artifact-manifest: commit a bundle whose manifest declares artifacts:['../../package.json'] for a PASS step",
                "Run deriveGoalState pointed at the bundle with the internally computed HEAD",
                "Capture the thrown error, the realpath containment comparison, and any goal-state write"
              ]
            },
            "end_state": {
              "must_observe": [
                "substantiation throws error code == 'ARTIFACT_PATH_ESCAPE' naming the escaped artifact",
                "`realpath('.gate-evidence/<bundle>/../../package.json')` resolves to the repo-root `package.json` absolute path, which does NOT start with `realpath('.gate-evidence/<bundle>') + '/'` \u2014 this string-prefix comparison fails BEFORE `gitTracked()` is ever invoked (0 calls to gitTracked for this artifact)",
                "no sprint-goal-state.json with met:true is written"
              ],
              "must_not_observe": [
                "an out-of-bundle tracked file (../../package.json) substantiates a PASS step",
                "posix.join(bundleRel, art) normalizes .. and gitTracked accepts the escaped path",
                "met == true",
                "substantiateSteps returns null with the traversal artifact accepted \u2014 an empty/no-op check that skips containment must not satisfy this case"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-13",
      "type": "acceptance_criterion",
      "description": "Founder attestation is derived ONLY from couchGateStatus.allowed===true for the current active manifest, bound to its exact sampleId/manifestHash/catalogVersion via a matching getCouchVerdict({sampleId}) row recorded by a requireOperator non-test identity; a historic/inactive pass yields met:false / human_test.verdict pending",
      "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-13'",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "flow_ref": "UC-VER-05",
        "verification_service": "Convex dev deployment (couchGateStatus.allowed + getCouchVerdict({sampleId}) over real couch_verdicts/couch_manifest_activations) + deriveGoalState founder resolver",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "founder attestation reads getCouchVerdict({}) \u2014 the latest of up to 50 rows across ALL samples \u2014 and never calls couchGateStatus, so a historic/inactive pass satisfies present (the current resolveFounderVerdict behavior)",
            "present is set from overallVerdict === 'pass' alone with no active-manifest binding to sampleId/manifestHash/catalogVersion, or a test-prefixed / bare s4-human-gate identity is accepted as founder",
            "the couchGateStatus read is stubbed/mocked to allowed:true and disconnected from the durable Convex source"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "active-manifest-allowed-pass",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed operator-gate-identity and active-manifest-allowed-pass (an active couch manifest with couchGateStatus.allowed===true bound to an operator-recorded pass for that sampleId)",
                "Run deriveGoalState with a step-results JSON that omits founderVerdict",
                "Capture the resolved founder attestation, the couchGateStatus result, and the getCouchVerdict({sampleId}) row"
              ]
            },
            "end_state": {
              "must_observe": [
                "founder attestation is derived from couchGateStatus.allowed === true for the CURRENT active manifest (couchGateStatus was actually called, not getCouchVerdict({}))",
                "the attestation is bound to that status's exact sampleId/manifestHash/catalogVersion via a matching getCouchVerdict({sampleId}) row (recordedBy == 's4t12-operator', a requireOperator-authorized non-test, non-bare identity)",
                "human_test.verdict == 'pass' and met can be true only with this bound attestation present"
              ],
              "must_not_observe": [
                "attestation is derived from getCouchVerdict({}) latest-across-all-samples",
                "sampleId/manifestHash/catalogVersion mismatch between couchGateStatus and the getCouchVerdict({sampleId}) row is accepted",
                "a test-prefixed (TEST_SUBJECT_PREFIXES) or bare s4-human-gate identity is accepted as founder",
                "the couchGateStatus query returns 0 active-manifest binding \u2014 a stub/disconnected read producing no binding must not satisfy this case"
              ]
            }
          },
          {
            "start_ref": "historic-inactive-couch-pass",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed operator-gate-identity and historic-inactive-couch-pass (a real operator pass for a superseded sampleId while the current active manifest is inactive/drifted so couchGateStatus.allowed === false)",
                "Run deriveGoalState (a step-results JSON that may falsely set founderVerdict:true)",
                "Capture the emitted goal-state, the couchGateStatus result, and the getCouchVerdict query"
              ]
            },
            "end_state": {
              "must_observe": [
                "couchGateStatus.allowed === false for the current active manifest",
                "founder attestation present == false, emitted met == false, human_test.verdict == 'pending'",
                "gate.blocker names the unresolved/blocked S4-T7 human-owned gate"
              ],
              "must_not_observe": [
                "the historic/inactive pass (a real couch_verdicts PASS row that exists but is unbound to the current active manifest) satisfies founder.present",
                "getCouchVerdict({}) latest-across-all-samples returns the historic pass and it is accepted as attestation while couchGateStatus.allowed is false",
                "met == true or human_test.verdict == 'pass'",
                "gate.overall == 'PASS' while couchGateStatus.allowed is false \u2014 an empty/stub resolver that ignores couchGateStatus.allowed must not satisfy this case"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "deriveGoalState emits met:false and exits nonzero when any step result is BLOCKED/FAIL",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-1'"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "a hand-supplied met:true cannot survive a BLOCKED step through deriveGoalState",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-1'"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "a bundle whose captured commit != HEAD is rejected with STALE_EVIDENCE_BUNDLE",
      "maps_to_ac": "AC-2",
      "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-2'"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "a repro script passing lever2FixedGeometry fails the seam scan and blocks met:true",
      "maps_to_ac": "AC-2",
      "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-2'"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "rebuilt step4/step7 write scripts succeed under a seeded operator identity",
      "maps_to_ac": "AC-3",
      "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-3'"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "rebuilt step4/step7 write scripts fail with FORBIDDEN under a bare s4-human-gate identity",
      "maps_to_ac": "AC-3",
      "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-3'"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "deriveGoalState leaves human_test pending when no S4-T7 founder verdict exists",
      "maps_to_ac": "AC-4",
      "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-4'"
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "description": "rebuilt step3 couch export succeeds under a seeded operator and is FORBIDDEN under a bare s4-human-gate identity",
      "maps_to_ac": "AC-5",
      "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-5'"
    },
    {
      "id": "TC-9",
      "type": "test_criterion",
      "description": "rebuilt step5 getCouchVerdict runs under the seeded operator with no seam args and never returns a synthesized/forged pass",
      "maps_to_ac": "AC-5",
      "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-5'"
    },
    {
      "id": "TC-10",
      "type": "test_criterion",
      "description": "founderVerdict derives from the real couch_verdicts row (recordedBy) read via getCouchVerdict, not the JSON flag",
      "maps_to_ac": "AC-6",
      "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-6'"
    },
    {
      "id": "TC-11",
      "type": "test_criterion",
      "description": "a JSON/CLI founderVerdict:true with no operator-recorded row yields met:false and human_test.verdict 'pending'",
      "maps_to_ac": "AC-6",
      "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-6'"
    },
    {
      "id": "TC-12",
      "type": "test_criterion",
      "description": "a bogus --head-commit does not change the STALE_EVIDENCE_BUNDLE outcome computed against the internal HEAD",
      "maps_to_ac": "AC-7",
      "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-7'"
    },
    {
      "id": "TC-13",
      "type": "test_criterion",
      "description": "a missing bundle directory fails closed with MISSING_EVIDENCE_BUNDLE (never {ok:true})",
      "maps_to_ac": "AC-8",
      "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-8'"
    },
    {
      "id": "TC-14",
      "type": "test_criterion",
      "description": "an untracked-on-disk bundle is rejected with UNTRACKED_EVIDENCE_BUNDLE",
      "maps_to_ac": "AC-8",
      "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-8'"
    },
    {
      "id": "TC-15",
      "type": "test_criterion",
      "description": "a clean-but-stale committed bundle (captured commit != HEAD) is rejected with STALE_EVIDENCE_BUNDLE (stale_commit)",
      "maps_to_ac": "AC-8",
      "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-8'"
    },
    {
      "id": "TC-16",
      "type": "test_criterion",
      "description": "a tampered step-results JSON flipping BLOCKED->PASS (uncorroborated by the manifest) is rejected / does not change the outcome",
      "maps_to_ac": "AC-9",
      "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-9'"
    },
    {
      "id": "TC-17",
      "type": "test_criterion",
      "description": "generator.attested_source_commit equals the internal git rev-parse HEAD at generation time and the provenance verifier confirms attestation_commit is a STRICT descendant of attested_source_commit (never equal/ancestor/unrelated, PROVENANCE_RELATION_INVALID otherwise); derived_from is repository-relative (never /tmp/)",
      "maps_to_ac": "AC-10",
      "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-10'"
    },
    {
      "id": "TC-18",
      "type": "test_criterion",
      "description": "a manifest tracked at HEAD but modified only in the working tree (dirty) is rejected with MANIFEST_NOT_HEAD_BOUND \u2014 resolved from the HEAD blob (git show HEAD:<path>), not readFileSync \u2014 and produces no met:true",
      "maps_to_ac": "AC-11",
      "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-11'"
    },
    {
      "id": "TC-19",
      "type": "test_criterion",
      "description": "an old manifest/artifact laundered by an unrelated new bundle file (directory-level git log == HEAD) is rejected per-file with EVIDENCE_FILE_STALE because each required file's own last-touch commit != HEAD",
      "maps_to_ac": "AC-11",
      "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-11'"
    },
    {
      "id": "TC-20",
      "type": "test_criterion",
      "description": "a manifest artifact path resolving outside the bundle (../../package.json), even though tracked in git, is rejected with ARTIFACT_PATH_ESCAPE via a realpath containment check before gitTracked",
      "maps_to_ac": "AC-12",
      "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-12'"
    },
    {
      "id": "TC-21",
      "type": "test_criterion",
      "description": "founder attestation requires couchGateStatus.allowed===true bound to the active manifest's sampleId/manifestHash/catalogVersion via a matching getCouchVerdict({sampleId}) row recorded by a requireOperator non-test, non-bare identity (never getCouchVerdict({}) latest-across-all-samples)",
      "maps_to_ac": "AC-13",
      "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-13'"
    },
    {
      "id": "TC-22",
      "type": "test_criterion",
      "description": "a historic/inactive couch pass unbound to the current active manifest (couchGateStatus.allowed false) yields met:false and human_test.verdict 'pending' even though a couch_verdicts PASS row exists somewhere",
      "maps_to_ac": "AC-13",
      "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-13'"
    }
  ]
}
-->

</details>
