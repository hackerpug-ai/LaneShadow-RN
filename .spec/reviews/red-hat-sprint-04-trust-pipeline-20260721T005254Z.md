# Red-Hat Review Report — Sprint 04 Trust Pipeline

**Report date:** 2026-07-21T00:59:15Z  
**Target:** `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline`  
**Reviewed commit:** `1bacaef070b40247c65519856cff5a0be1d259d3`  
**Disposition:** `needs-revision` — do not use the sentinel, the FIX-12 suite, or a generated manifest as proof that the Founder-Operator/live-provider gate has passed.

## Executive Summary

The prior direct caller booleans and `--head-commit` override are gone, and FIX-16's specific missing/empty/incomplete/duplicate `routeHashes` condition now blocks correctly. Both focused live Convex-dev suites pass.

However, FIX-12 still permits completion authority to be manufactured from a caller-controlled evidence tree: it reads working-tree manifest bytes, only checks that *some* path in the bundle is tracked and that *some* bundle path was touched at `HEAD`, and accepts artifact paths that escape the bundle. It also treats any latest `getCouchVerdict({})` pass as the founder attestation without requiring the current active manifest or `couchGateStatus.allowed`. The active sentinel is honestly BLOCKED, but its provenance is one commit behind current `HEAD`, which is an unavoidable consequence of generating then committing a self-describing file and must be specified honestly rather than represented as self-attesting current HEAD.

## Completion Audit / Evidence Checklist

| Required review deliverable | Evidence inspected | Result |
|---|---|---|
| Review current requested HEAD | `git rev-parse HEAD` → `1bacaef070b40247c65519856cff5a0be1d259d3`; commits `a39c5850..HEAD` and the committed diff inspected | PASS |
| Write the requested fresh report | This file | PASS |
| Recheck caller-controlled completion authority | `tools/gate/deriveGoalState.ts:231-357,396-528`; isolated black-box manifests | **FAIL — CRITICAL** |
| Recheck mandatory tracked evidence and freshness | `validateBundle` plus isolated committed/stale/working-tree repros | **FAIL — CRITICAL** |
| Recheck tampered step substantiation | `substantiateSteps` plus isolated traversal/modified-manifest repro | **FAIL — CRITICAL** |
| Recheck durable founder attestation | `resolveFounderVerdict` compared with `getCouchVerdict` and `couchGateStatus` semantics | **FAIL — HIGH** |
| Recheck FIX-16 legacy-manifest fail-closed behavior | `convex/couchVerdict.ts:227-272`, `couchSampleAssembler.ts:761-850`, and focused Convex-dev suite | PASS for the specified missing/empty/incomplete/duplicate `routeHashes` cases |
| Inspect actual implementation, committed diff, sentinel provenance, and tests | Source/diff, current sentinel, both focused suites, `tsc`, `git diff --check` | PASS |
| Do not treat sentinel, self-report, passing tests, or generated bundle as founder/live-provider proof | No such proxy was accepted; sentinel is BLOCKED and S4-T7 is not independently evidenced | PASS |
| Explicitly assess one-step commit provenance | `generator.head_commit=7129d20…`, sentinel’s own commit/current HEAD=`1bacaef…` | **FAIL — MEDIUM** |
| Record severity findings or a severity-clean result | Findings below | PASS |

## Commands and Direct Evidence

```text
npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts
# PASS: 1 file, 10 tests (114.08s)

npx vitest run convex/__tests__/REDHAT-FIX-16-legacy-manifest-fail-closed.integration.test.ts
# PASS: 1 file, 4 tests (46.68s)

npx tsc --noEmit -p convex/tsconfig.json
# exit 0 (only npm node-linker warning)

git show --check a39c5850..HEAD && git diff --check a39c5850..HEAD
# exit 0
```

Two isolated temporary-git-repository probes exercised the actual `validateBundle` and `substantiateSteps` from `tools/gate/deriveGoalState.ts`:

1. A committed bundle was modified only in the working tree. The replacement manifest pointed both PASS steps at `../../package.json`. The validator returned `ok:true` and `substantiateSteps` returned `null`.
2. A manifest and evidence artifact were committed at an older commit; an unrelated `README.md` added under the same bundle in the next commit made `git log -1 -- <bundle>` equal HEAD. The validator again returned `ok:true` and substantiation returned `null`, despite `manifestLastTouch != HEAD`.

These are not test doubles; they invoke the shipped validator against real git repositories.

## Human Testing Gate / Current Sentinel

| Gate condition | Result | Evidence |
|---|---|---|
| Current state claims completion | PASS (it does not) | `sprint-goal-state.json:2-4,12-13` is `GATE-GOAL: BLOCKED` / `met:false`. |
| Real founder/live-provider gate complete | FAIL / external blocker | Steps 3–5 and 7 are `BLOCKED`; `human_test.verdict` is `pending` (`sprint-goal-state.json:25-57,69-72`). |
| There is a current committed evidence manifest for the honest sentinel | FAIL | `honest-step-results.json` is tracked, but `find .../.gate-evidence -name manifest.json` found no current manifest. The blocked write therefore did not validate one. This does not itself make the blocked result a false pass. |
| Sentinel provenance describes current HEAD | FAIL | `HEAD=1bacaef…`, while `generator.head_commit=7129d20…`; the sentinel was itself changed in `1bacaef` whose parent is `7129d20`. |

## Findings

### CRITICAL

- [ ] **CRITICAL — Evidence manifest/artifacts remain caller-controlled; tracking and directory-last-touch are not immutable proof.**
  - **Evidence:** `validateBundle` accepts a bundle when any path under it is tracked (`tools/gate/deriveGoalState.ts:240-247`) and compares only `git log -1 -- <bundle>` with HEAD (`:279-287`). It reads `manifest.json` from the live working tree (`:212-223`) and never verifies that manifest or artifact content equals `HEAD`, that each required artifact’s own last-touch commit equals HEAD, or that the working tree is clean. `substantiateSteps` only asks whether each resolved path is tracked (`:340-355`).
  - **Reproduction:** The first isolated probe altered a tracked bundle’s uncommitted manifest after the bundle commit, listed `../../package.json` for two steps, then received `validate:{ok:true}` and `substantiation:null`. The second probe kept the actual manifest/artifact at a parent commit and changed only an unrelated bundle README at HEAD; it also received `ok:true` / `null`.
  - **Impact:** A caller can turn stale, absent, or unrelated material into all-PASS “substantiation,” then combine it with any accepted durable pass row to obtain `met:true`. This is the same completion-authority class as the prior CRITICAL finding, moved from a JSON boolean to a malleable manifest tree. A generated evidence bundle is not proof of a real provider run or founder review.
  - **Required remediation:** Resolve every manifest/artifact from `HEAD:<path>` (or compare working-tree blob IDs with `HEAD`), require the manifest and every enumerated artifact to be within the bundle, require each required file’s exact commit/content binding rather than directory-level `git log`, and reject dirty/staged evidence paths. Bind records to immutable hashes in the manifest and validate those hashes before derivation. Add negative tests for modified-but-tracked manifest/artifact, old evidence plus a new unrelated bundle file, and `../` artifact traversal.

- [ ] **CRITICAL — Artifact path traversal lets arbitrary tracked repository files substantiate a PASS step.**
  - **Evidence:** `posix.join(bundleRel, art)` (`tools/gate/deriveGoalState.ts:340-342`) normalizes `..`; no containment check follows before `gitTracked`. No hash, file type, JSON shape, command output, or provider receipt is verified (`:322-355`).
  - **Reproduction:** With bundle `.gate-evidence/b`, a manifest declaring `"artifacts":["../../package.json"]` for both steps was accepted by the actual shipped functions. `package.json` is unrelated tracked source, not gate evidence.
  - **Impact:** The required “manifest enumerated per-step artifacts” is only a caller-selected list of arbitrary tracked files. It cannot substantiate a gate step and does not stop a tampered step-results claim.
  - **Required remediation:** Canonicalize `realpath(bundle/artifact)`, require it to start with `realpath(bundle)+separator`, reject symlinks/path escapes, require a fixed schema and expected artifact class per step, and verify content digests recorded in a manifest committed before/with a separately verifiable run receipt.

### HIGH

- [ ] **HIGH — `resolveFounderVerdict` accepts an arbitrary latest pass row, not the current live gate’s founder attestation.**
  - **Evidence:** The writer calls `getCouchVerdict({})` (`tools/gate/deriveGoalState.ts:406-409`). That query returns the latest of up to 50 verdicts across **all** samples (`convex/couchVerdict.ts:167-170`). The writer only checks `overallVerdict === 'pass'`, a nonempty `recordedBy`, and that the value is not the literal bare test identity (`tools/gate/deriveGoalState.ts:424-437`). It neither calls `couchGateStatus` nor requires `allowed:true`, an active manifest, current manifest hash/catalog version, a matching sample ID, or an actual Founder role.
  - **Contrast:** `couchGateStatus` is the source that verifies explicit activation, complete route-hash baseline, current geometry drift, and a pass bound to the active manifest (`convex/couchVerdict.ts:192-306`). `recordCouchVerdict` itself allows an `operator` as well as a founder (`:52-59`; `convex/guards.ts:139-155`).
  - **Impact:** A historic/inactive pass (including one generated by a test/development operator) can satisfy the writer’s `founder.present` predicate even though the authoritative `--all` gate is blocked. Thus the writer’s claimed “genuine durable S4-T7” condition is not tied to the live founder-reviewed sample.
  - **Required remediation:** Derive attestation from a query that returns the current active manifest status and exact bound pass, require `couchGateStatus.allowed === true`, bind its `sampleId`, `manifestHash`, `catalogVersion`, recorded verdict ID/time, and a founder-authorized identity to the evidence manifest. Do not accept a test-prefixed identity for a production closeout. Add a negative test with a historic pass plus an inactive/drifted/legacy active manifest and assert `met:false`.

### MEDIUM

- [ ] **MEDIUM — Current sentinel is stale under the specified self-provenance rule; a one-step generation/commit cannot make its own commit hash the pre-commit writer’s HEAD.**
  - **Evidence:** Current `HEAD` is `1bacaef070b40247c65519856cff5a0be1d259d3`; `sprint-goal-state.json` says `generator.head_commit: 7129d20…`. `git log -1 -- sprint-goal-state.json` is `1bacaef…`, whose parent is `7129d20…`. The commit message itself says the writer ran while HEAD was `7129d20` and then committed the output as `1bacaef`.
  - **Assessment of one-step semantics:** A file cannot know the hash of the ordinary commit that will later contain it, because that hash includes the file. Generating at parent P and committing output as C necessarily records P, not C. Regenerating produces another C2 that records C, so the rule never converges without amend/rewriting history (which again changes the hash).
  - **Impact:** This BLOCKED sentinel does not falsely grant completion, but it must not be represented as an artifact that binds itself to “current HEAD.” The current AC-10 claim is semantically impossible as written for an ordinary follow-up commit.
  - **Required remediation:** Define and enforce a two-object provenance contract: `attested_source_commit` = the immutable code/evidence commit reviewed, and `attestation_commit` = the later commit carrying the generated state; or use a signed external attestation/provenance record referencing the source commit. Verify exactly that relation rather than equality between a file’s recorded pre-write HEAD and the later commit containing the file.

### LOW

- [ ] **LOW — The 10-test FIX-12 suite does not cover the remaining authority paths.**
  - **Evidence:** AC-8/AC-9 create clean temporary repos but only test entirely untracked directories, a wholly stale bundle, and a missing manifest entry (`convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts:392-523`). They do not test a tracked-but-dirty manifest, a stale required artifact masked by a current directory touch, traversal outside the bundle, or an old pass while `couchGateStatus.allowed` is false.
  - **Impact:** The green suite proves the narrow vectors it names, not the integrity of founder/live-provider completion.
  - **Required remediation:** Add the negative controls named in the CRITICAL/HIGH findings and require them to fail end-to-end before accepting FIX-12.

## Recheck of Prior CRITICAL / HIGH Findings

| Prior finding | Status at `1bacaef` | Current evidence |
|---|---|---|
| Caller-supplied `founderVerdict`, `--head-commit`, optional bundle, and raw steps could manufacture completion | **PARTIALLY FIXED, but CRITICAL remains** | Direct boolean and authoritative CLI SHA are removed; missing/untracked/stale directories now fail. But a modified/traversing/current-directory-touched manifest is still caller-controlled completion authority. |
| Required tracked evidence/freshness was optional or not actually compared with HEAD | **NOT FIXED at artifact granularity — CRITICAL** | Directory-level last-touch is checked, not each manifest/artifact blob or commit; working tree modifications are accepted. |
| Tampered step result could be represented as PASS without real substantiation | **NOT FIXED — CRITICAL** | Manifest entry + any tracked path, including `../../package.json`, is sufficient. No artifact semantics or immutable digest is verified. |
| Founder/live-provider attestation must be durable and not a JSON flag | **PARTIALLY FIXED, but HIGH remains** | It is no longer a JSON flag, but any latest pass row is accepted without current active-manifest/live-drift binding or founder identity verification. |
| FIX-16 legacy manifest with absent/empty/incomplete/duplicate `routeHashes` could unlock without revalidation | **FIXED for the specified condition** | `couchGateStatus` rejects incomplete baselines before drift/pass evaluation (`convex/couchVerdict.ts:227-251`). Focused Convex-dev suite passed missing/empty, duplicate, re-freeze/no inherited PASS, and healthy complete baseline cases. |

## Test-Quality and Gate Limits

The focused passing tests are meaningful evidence for narrow implementation behavior: direct caller flag removal, stale/untracked bundle rejection, FIX-16 baseline blocking, and its re-freeze transition. They are not evidence that S4-T7 occurred, that a real ~25-route rendered sample was visually reviewed, that three real REVIEW dispositions happened, or that a real provider run produced any claimed result.

The current sentinel appropriately remains BLOCKED. Its blocked state should not be “fixed” by manufacturing evidence; the genuine external Founder-Operator S4-T7 work remains required after the implementation integrity issues are remediated.

## Recommendations

1. Keep Sprint 04 **blocked**; do not close it or unlock `--all` from `deriveGoalState`.
2. Redesign FIX-12 evidence validation around immutable content hashes, per-file HEAD/tree binding, path containment, and a clean-tree rule.
3. Make the writer derive the human gate from the same active-manifest, drift-checked authority used by `couchGateStatus`, with an explicit founder identity and manifest binding.
4. Replace the impossible self-HEAD sentinel rule with source-commit versus attestation-commit provenance semantics.
5. Add adversarial tests for each reported bypass, rerun the focused suites, and request another red-hat review. Separately complete S4-T7 only through a real Founder-Operator review of real rendered catalog routes and real REVIEW dispositions.

## Metadata

- **Severity result:** 2 CRITICAL, 1 HIGH, 1 MEDIUM, 1 LOW.
- **Confidence:** High for all findings: direct source inspection and executable isolated-git reproductions; FIX-16 closure is independently supported by source inspection and its live Convex-dev suite.
- **Review mode:** Read-only implementation, commit, sentinel, test, and provenance audit. No application source was changed.
- **Specialist dispatch:** Attempted for `convex-reviewer` and `code-reviewer`; both were unavailable because the configured task runtime lacked an Amazon Bedrock API key. This report does not claim multi-agent consensus.
