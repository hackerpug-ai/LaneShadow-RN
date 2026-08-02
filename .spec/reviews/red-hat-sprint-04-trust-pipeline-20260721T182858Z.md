# Red-Hat Review Report — Sprint 04 Trust Pipeline (Cap Cycle)

**Report Date:** 2026-07-21T18:28:58Z  
**Target:** `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline`  
**Reviewed HEAD:** `170009b5892dc45a0dc909a473bc84222b2f2661`  
**Scope:** Verify FIX-23/24, re-confirm FIX-17/19/20/21/22, and distinguish the external S4-T7 human gate from code findings.

## Severity Verdict

**NOT severity-clean. No CRITICAL finding; one HIGH finding remains.**

FIX-23 resolves the `PLAN_STALE` availability regression without restoring working-tree plan authority. FIX-24 rejects the three named attacks (extra argument, `env` prefix, interpreter swap), but it does **not** provide exact full-command equality for shell command text: the normalizer discards shell metacharacter suffixes attached to the script token. This re-opens command-authority bypasses, so the recurring control-plane issue is not closed.

The S4-T7 Founder-Operator review remains correctly **BLOCKED** and is not a code finding.

## Completion Checklist

| Requirement | Evidence | Verdict |
|---|---|---|
| FIX-23: current HEAD reaches gate evaluation, not `PLAN_STALE` | Current plan WT blob hash equals `HEAD:<gate-plan.json>` (`2871cf…`); `loadHeadBoundGatePlan` returned `ok:true`, expected steps `1..8` at HEAD `170009…`. A direct current-HEAD `deriveGoalState` using honest step results returned `error:null`, `met:false`, BLOCKED steps `[3,4,5,7]`, and the unresolved-human-step blocker—not `PLAN_STALE`. | PASS |
| FIX-18 canonical-completeness suite green | `npx vitest run convex/__tests__/REDHAT-FIX-18-canonical-step-completeness.integration.test.ts`: **5/5 passed**. | PASS |
| FIX-24 named attacks reject | Direct current-HEAD calls to `rejectOffPlanScripts`: appended `--unreviewed-flag`, `env FOO=attacker`, and `sh` all returned `OFF_PLAN_SCRIPT`; the exact plan command returned `null`. `REDHAT-FIX-24` suite: **4/4 passed**. | PASS, but incomplete |
| No new working-tree plan authority from FIX-23 | Loader reads `git show HEAD:<plan>` and parses only those bytes; it checks WT-vs-HEAD blob divergence before parsing. Dirty-plan regression suite is green. | PASS |
| Re-confirm FIX-17/19/20/21/22 | Targeted suites all green: FIX-17 **4/4**, FIX-19 **4/4**, FIX-20 **6/6**, FIX-21 **5/5**, FIX-22 **4/4**. | PASS |
| Build/static checks | `npx tsc --noEmit -p convex/tsconfig.json` exit 0; Biome checked 10 targeted files with no findings. | PASS |

## HIGH Findings

- [ ] **HIGH — shell-metacharacter suffix bypass defeats claimed exact full-command equality.**  
  **Location:** `tools/gate/deriveGoalState.ts:433-445, 481-546, 638-658`  
  **Evidence:** `canonicalizeScriptPath` falls back to `/\S+\.sh/`, extracting a valid `.sh` prefix from a larger shell token. `normalizeFullCommand` then treats that token as the script and has no trailing argv to record. On the reviewed HEAD, the following direct control returned `null` (accepted), with the exact same stable key as the plan command:

  ```text
  bash …/.gate-evidence/2026-07-21T152805Z/scripts/step1.sh;:
  bash …/.gate-evidence/2026-07-21T152805Z/scripts/step1.sh$(true)
  ```

  The second form permits command substitution during shell execution; the first demonstrates that an additional shell command can be attached without becoming an argument. Both differ from the plan command yet normalize to `{ prefix: [], interpreter: "bash", scriptKey: "…/step1.sh", args: [] }` and pass `allowedFullCmds.has(...)`.

  **Impact:** The gate accepts command text that is not an exact plan literal and that may execute extra shell behavior. The named flag/env/interpreter cases are covered, but the actual command-text authority requirement is still bypassable.

  **Required remediation:** Do not parse shell command strings by whitespace and partial `.sh` substring. For this control surface, either (a) reject any command containing shell grammar/metacharacters/quotes/substitutions and require a strict argv representation, or (b) use a real shell parser and reject anything except precisely one allowed simple-command AST (`bash`, exact script argument, no redirects/operators/expansions/assignments/arguments). Add negatives for at least `script.sh;:`, `script.sh$(true)`, `script.sh&&:`, redirects, and quoted/escaped variants.

## MEDIUM Findings

None found in the reviewed scope.

## LOW Findings

None found in the reviewed scope.

## Re-confirmed Controls

1. **FIX-23 freshness / immutable authority:** `loadHeadBoundGatePlan` obtains `headContent` from `gitShowHead`, compares WT and HEAD blobs, and parses `headContent` only (`tools/gate/verifyEvidenceManifest.ts:155-199`). Last-touch is diagnostic only. The current HEAD plan loads as canonical `[1..8]` despite the plan’s last-touch commit being `1082ca…`, behind HEAD.
2. **FIX-21 dirty-plan resistance:** a mutable one-step plan cannot shrink expected steps or provide binding authority; FIX-21’s dirty plan test passes.
3. **FIX-22 path substitution resistance:** a substitute script under the allowed timestamp run rejects; FIX-22’s regression suite passes.
4. **FIX-20 withdrawn-run resistance:** honest control-surface rebinding suite passes and human steps remain honestly blocked.
5. **FIX-17 latest verdict revocation:** the gate selects the latest exact-bound verdict, pass or fail (`convex/couchVerdict.ts:284-305`); a later fail blocks `--all` in the integration test.
6. **FIX-19 strict binding:** both manifest hash and catalog version are non-empty exact bindings (`convex/couchVerdict.ts:288-305`); missing values block in integration tests.

## Human Gate Status (Non-Finding)

Current-head derivation reports `met:false`, `overall:"BLOCKED"`, and blocked steps **3, 4, 5, 7** because S4-T7’s Founder-Operator review has not occurred. This is the intended external, human-owned blocker. It neither creates nor mitigates the HIGH finding above.

## Commands Run

```bash
npx vitest run \
  convex/__tests__/REDHAT-FIX-17-latest-verdict-revokes-pass.integration.test.ts \
  convex/__tests__/REDHAT-FIX-18-canonical-step-completeness.integration.test.ts \
  convex/__tests__/REDHAT-FIX-19-strict-manifest-binding.integration.test.ts \
  convex/__tests__/REDHAT-FIX-20-gate-plan-honest-rebinding.integration.test.ts \
  convex/__tests__/REDHAT-FIX-21-head-bound-gate-plan.integration.test.ts \
  convex/__tests__/REDHAT-FIX-22-exact-plan-script-match.integration.test.ts \
  convex/__tests__/REDHAT-FIX-23-plan-freshness-head-blob.integration.test.ts \
  convex/__tests__/REDHAT-FIX-24-full-command-equality.integration.test.ts
# 8 files, 38 tests passed

npx tsc --noEmit -p convex/tsconfig.json
pnpm exec biome check tools/gate/verifyEvidenceManifest.ts tools/gate/deriveGoalState.ts \
  convex/__tests__/REDHAT-FIX-{17-latest-verdict-revokes-pass,18-canonical-step-completeness,19-strict-manifest-binding,20-gate-plan-honest-rebinding,21-head-bound-gate-plan,22-exact-plan-script-match,23-plan-freshness-head-blob,24-full-command-equality}.integration.test.ts
```

## Review Coverage Note

Two independent read-only reviewer dispatches were attempted (`convex-reviewer`, `code-reviewer`) but could not start because the local task runtime has no configured Amazon Bedrock API credential. This report therefore records direct source inspection, reproducible targeted controls, and the targeted test evidence above.

## Next Step

Create a targeted remediation for the HIGH shell-metacharacter command-authority bypass, then re-run this cap-cycle review. Do not mark the trust/couch control plane severity-clean until exact shell-command semantics are enforced.
