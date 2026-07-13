# DEPENDENCY-FIX-001 — Reduce Convex module footprint to unblock cloud-dev deploy (ModulesTooLarge)

| Field | Value |
|-------|-------|
| TASK_ID | DEPENDENCY-FIX-001 |
| SPRINT | [Sprint 02 — Mastra spike + z.ai proof + enrichment re-ratification](./SPRINT.md) |
| TASK_TYPE | DEPENDENCY / INFRA |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 120 min |
| PRIORITY | P0 |
| STATUS | Done |
| PROPOSED_BY | kb-run-sprint orchestrator (S2-T5 unblock) |
| TDD_MODE | `skipped` |
| RED_GREEN_REQUIRED | no |
| DEPENDS_ON | S2-T1, S2-T4 (landed; introduced additive Mastra footprint) |
| BLOCKS | S2-T5 (measurement re-run), S2-T7 (human gate) |

RUNTIME_COMMANDS:
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check convex.json package.json scripts/spike convex/actions/agent/lib/__tests__/models.orchestratorTier.test.ts convex/actions/agent/spike`
- test: `pnpm test convex/actions/agent/lib/__tests__/models.orchestratorTier.test.ts convex/actions/agent/spike/__tests__/coldStartBundle.integration.test.ts`
- deploy_probe: `npx convex dev --once --typecheck disable` (cloud-dev only; NEVER production)

## OUTCOME

Cloud-dev push (`npx convex dev --once` targeting the configured cloud-dev deployment) succeeds without ModulesTooLarge, OR a first-class architecture decision package is committed that names the exact external decision required (new service / Convex Agent / pi-ai early teardown / ceiling raise) with residual measured size evidence. Genuinely unused vestigial `externalPackages` entries that are not in `package.json` and have zero Convex imports are removed. No fake-green ceilings evidence; no production deploy.

## 🚫 CRITICAL CONSTRAINTS

**MUST**
- Work from THIS integration worktree ground truth (HEAD = S2-T5 blocked evidence landed).
- Assess intended steady-state dependency footprint against PRD `06-external-dependencies.md`:
  - Sprint 02 is **additive**: `@mastra/core` coexists with live pi-ai until Sprint 07 atomic teardown — do NOT remove `@mariozechner/pi-ai` from `package.json` or live importers.
  - Genuinely unused vestigial packages MAY be removed from `convex.json` `externalPackages` when they have **zero** imports under `convex/` AND are **not** listed in root `package.json` dependencies (current: `@workos-inc/node`, `papaparse`, `langchain`, `@langchain/core`, `@langchain/openai`, `@langchain/langgraph`, and `jose` if still zero-import / non-dep).
- Prefer truthful size reduction that preserves spike behavior:
  1. Drop dead externalPackages entries (above).
  2. Re-evaluate whether full-package externalization of `@mastra/core` / `@mastra/observability` / `ai` / `@ai-sdk/*` is required vs tree-shaken bundling (Convex bundles by default; `externalPackages` ships the full package — `@mastra/core` alone ~14 MiB gzipped on disk). If bundling is viable and still imports work, update `convex.json` and any S2-T1 tests that assert exact `externalPackages` membership with honest comments.
  3. Do not invent stubs or strip Mastra imports while claiming the spike still works.
- After any footprint change, run a REAL cloud-dev push probe (`npx convex dev --once --typecheck disable` or the documented `npx convex deploy` to cloud-dev — **not** production). Capture stdout/stderr to `.tmp/DEPENDENCY-FIX-001/deploy-probe.txt`.
- If deploy succeeds: re-run `pnpm tsx scripts/spike/measure-mastra-spike-ceilings.ts` so `evidence/s2-t5-ceilings.json` gets **fresh** real numbers (or still-blocked with a new real error). Repair the measurement script / human-gate invocation docs if the documented command is wrong for cloud-dev (T5 used `convex dev --once`; human gate lists `npx convex deploy` — align with what actually targets cloud-dev without production).
- If deploy still fails ModulesTooLarge after honest max-effort footprint work: commit residual evidence (zipped size, remaining externalPackages, size notes) and a short architecture decision request under `.spec/prds/route-agent-quality/tasks/sprint-02-mastra-reference-spike/evidence/modules-too-large-decision.md` listing the exact Founder-Operator options. Do **not** write `status: "pass"` on ceilings.

**NEVER**
- NEVER deploy production.
- NEVER hand-write green coldStartMs / bundleDeltaBytes / status pass.
- NEVER remove live pi-ai importers (Sprint 07 scope).
- NEVER print secret env values.
- NEVER report prior blocked S2-T5 evidence as pass.

## ACCEPTANCE CRITERIA

### AC-1 — Vestigial externalPackages removed

**Requirement:** GIVEN packages listed in `convex.json` `node.externalPackages` that are absent from root `package.json` dependencies AND have zero `from`/`require` imports under `convex/` WHEN the task lands THEN those entries are removed from `externalPackages`.

- VERIFY: `node -e '...'` or a small assertion in the existing orchestrator-tier test updated honestly; `rg` shows zero imports for removed packages.
- MUST_OBSERVE: no `@workos-inc/node`, `papaparse`, `langchain`, `@langchain/*` remaining in externalPackages if still unused; `jose` removed if still unused/non-dep.
- MUST_NOT_OBSERVE: removal of `@mariozechner/pi-ai`, `@mastra/core`, `ai` solely because they are large without a working alternative path.

### AC-2 — Real cloud-dev deploy probe after footprint change

**Requirement:** GIVEN the updated footprint WHEN `npx convex dev --once --typecheck disable` (or documented cloud-dev `convex deploy`) is run THEN either (a) push succeeds (exit 0) or (b) push fails with a **new** captured ModulesTooLarge (or other) error whose residual zipped size is recorded.

- VERIFY: `.tmp/DEPENDENCY-FIX-001/deploy-probe.txt` exists, non-empty, contains the real Convex CLI output; exit code recorded.
- MUST_OBSERVE: real endpoint / error string OR success markers from Convex CLI.
- MUST_NOT_OBSERVE: fabricated success; production deploy URL/command.

### AC-3 — Measurement path re-armed OR architecture decision package

**Requirement:** IF AC-2(a) success THEN re-run measure script and refresh `evidence/s2-t5-ceilings.json` from real observation (pass or fail ceilings honestly). IF AC-2(b) still blocked THEN write `evidence/modules-too-large-decision.md` with residual size, what was tried, and the exact external decision needed (e.g. early pi-ai teardown; Convex components/split; move Mastra agent off Convex Node actions; vendor ceiling exception; adopt Convex Agent product).

- VERIFY: file exists; if ceilings refreshed, status is not pass unless both numbers are real and within ceilings.
- MUST_NOT_OBSERVE: status pass with null coldStartMs/bundleDeltaBytes.

### AC-4 — S2-T1 externalPackages contract stays truthful

**Requirement:** GIVEN S2-T1 tests assert `externalPackages` membership WHEN membership intentionally changes THEN update `models.orchestratorTier.test.ts` so it asserts the **new intentional steady-state list** (still requires Mastra + openai-compatible present in package.json; externalPackages assertions match the chosen external vs bundle strategy). Tests pass.

- VERIFY: `pnpm test convex/actions/agent/lib/__tests__/models.orchestratorTier.test.ts`

## SCOPE (writeAllowed)

- `convex.json`
- `package.json` / `pnpm-lock.yaml` **only** if removing a package that is confirmed unused AND safe (prefer externalPackages-only cleanup first)
- `convex/actions/agent/lib/__tests__/models.orchestratorTier.test.ts` (update AC-2 externalPackages expectations if list changes)
- `scripts/spike/measure-mastra-spike-ceilings.ts` (repair cloud-dev invocation / comments only if needed)
- `convex/actions/agent/spike/__tests__/coldStartBundle.integration.test.ts` (only if skip/block messaging must match new evidence shape)
- `.spec/prds/route-agent-quality/tasks/sprint-02-mastra-reference-spike/evidence/s2-t5-ceilings.json` (refresh from real probe only)
- `.spec/prds/route-agent-quality/tasks/sprint-02-mastra-reference-spike/evidence/modules-too-large-decision.md` (NEW if still blocked)
- `.tmp/DEPENDENCY-FIX-001/**` (evidence)
- Optional comment-only fixes in spike action deployment notes if they document the wrong command

**writeProhibited:**
- Production deploy credentials / production project
- Sprint 07 pi-ai teardown of live agent importers
- React Native app, schema migrations unrelated to footprint
- Hand-authored green ceilings

## AGENT ASSIGNMENT

- Implementer: `convex-implementer`
- Reviewer: `convex-reviewer`

## DEPENDENCIES

- Unblocks: S2-T5 re-measurement, S2-T7 human gate
- Depends on: S2-T1..T4, S2-T6 landed baseline

<details>
<summary>▸ REQUIREMENT-CONTRACT v1</summary>

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "DEPENDENCY-FIX-001",
  "tdd_mode": "skipped",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": false,
    "requires_seeded_evidence": true
  },
  "requirements": [
    {
      "id": "AC-1",
      "description": "Remove unused vestigial externalPackages (zero imports + not in package.json deps)",
      "verify": "rg + package.json + convex.json inspection; models.orchestratorTier.test.ts"
    },
    {
      "id": "AC-2",
      "description": "Real cloud-dev deploy probe after footprint change; capture CLI output",
      "verify": "test -s .tmp/DEPENDENCY-FIX-001/deploy-probe.txt"
    },
    {
      "id": "AC-3",
      "description": "Refresh s2-t5-ceilings.json from real measure OR write modules-too-large-decision.md",
      "verify": "evidence files present; no fake pass"
    },
    {
      "id": "AC-4",
      "description": "S2-T1 externalPackages tests match intentional steady-state list and pass",
      "verify": "pnpm test convex/actions/agent/lib/__tests__/models.orchestratorTier.test.ts"
    }
  ]
}
-->
</details>
