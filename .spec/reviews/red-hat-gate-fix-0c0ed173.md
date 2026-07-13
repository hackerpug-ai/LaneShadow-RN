# Red-Hat Review: Gate-Wiring Remediation 0c0ed173

| Field | Value |
|-------|-------|
| **Commit** | `0c0ed17309fe6d62baf5bb5d194c01ed06cc0134` |
| **Date** | 2026-07-13 |
| **Reviewer** | Independent red-hat (OpenCode) |
| **Scope** | 5 changed files only (2 new scripts, 3 spec docs) |
| **Verdict** | **APPROVE** |

---

## Summary

The commit fixes two wiring gaps that blocked fresh QA execution on sprint-02:

1. **S2-T7 / SPRINT.md gate steps** documented `npx convex deploy` (production by default) instead of the safe cloud-dev command. Replaced with `npx convex dev --once --typecheck disable`.
2. **S2-T8 gate steps** used a test-suite invocation (`pnpm test ...`) instead of a standalone CLI. Added `scripts/spike/zai-glm-proof.ts` — a real CLI that loads `.env.local`, imports `createZaiProvider` / `zaiStructuredComplete` via the existing env loader, prints structured JSON, and exits non-zero on missing key or provider failure.

---

## Verdict: APPROVE

No blocking findings. All checks pass. The remediation is correct, safe, and well-evidenced.

---

## Checks Run

### 1. Contract Test Execution (standalone z.ai proof)

```
pnpm test scripts/spike/__tests__/zai-glm-proof.contract.test.ts
```

**Result: 2/2 passed (12.86s)**

| Test | Status | Notes |
|------|--------|-------|
| missing Z_AI_API_KEY → exit 1 | PASS | Exit code 1, stderr contains "Z_AI_API_KEY" |
| real provider path → exit 0 | PASS (live) | Z_AI_API_KEY was present; test ran live against z.ai API, exit 0, valid JSON output with ok/path/summary/confidence |

### 2. TypeScript Type-Check

```
npx tsc --noEmit --pretty
```

**Result: Clean — zero errors.**

### 3. Biome Lint (new files only)

```
npx biome lint scripts/spike/zai-glm-proof.ts scripts/spike/__tests__/zai-glm-proof.contract.test.ts
```

**Result: Clean — "Checked 2 files in 26ms. No fixes applied."**

### 4. Convex Command Safety (cloud-dev, not production)

| Verification | Result |
|-------------|--------|
| `.env.local` `CONVEX_DEPLOYMENT` value | `dev:quirky-panther-164` (cloud-dev prefix `dev:`) |
| OLD command (`npx convex deploy`) | Targets production by default — DANGEROUS |
| NEW command (`npx convex dev --once --typecheck disable`) | Targets `CONVEX_DEPLOYMENT` from `.env.local` — cloud-dev only |
| Evidence file `evidence/s2-t5-ceilings.json` `deployAttempts[]` | Contains 4 entries, ALL `npx convex dev --once --typecheck disable`, all annotated "cloud-dev quirky-panther-164 (NOT prod)" |

**Conclusion: The fix correctly eliminates the production-deploy risk. The new command cannot target production — `convex dev` reads `CONVEX_DEPLOYMENT` which is `dev:quirky-panther-164`.**

### 5. Environment-Load Ordering in the CLI

The CLI (`scripts/spike/zai-glm-proof.ts`) uses a deliberate CJS-require pattern to ensure `.env.local` is loaded BEFORE the module graph evaluates:

```
// 1. Static ESM imports (fs, module, path) — hoisted, but don't read env vars
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

// 2. Create synchronous require
const require = createRequire(import.meta.url)

// 3. Load .env.local into process.env (BEFORE any require triggers env.ts)
loadDotEnvLocal()

// 4. NOW require modules that read env at load time
const { zaiStructuredComplete } = require('../../convex/actions/agent/lib/zaiProvider')
const { Z_AI_API_KEY } = require('../../convex/lib/env')
```

**Why this is correct:**
- ESM static imports are hoisted above all other code. If `env.ts` were imported statically, it would evaluate BEFORE `loadDotEnvLocal()` runs — `requireEnv('CLERK_*')` would throw.
- `createRequire` + `require()` is synchronous and NOT hoisted — it executes in source order, after `loadDotEnvLocal()`.
- `loadDotEnvLocal()` respects existing env values (`if (!(key in process.env))`) — won't overwrite operator-set vars.
- `optionalEnv('Z_AI_API_KEY')` returns `undefined` for empty strings, so the `Z_AI_API_KEY: ''` test strategy works correctly.
- CLERK_* required vars are present in `.env.local` (confirmed: all 3 keys present), so the require chain does not throw.

**Conclusion: Ordering is correct. `.env.local` is in `process.env` before `env.ts` evaluates.**

### 6. Machine-Readable Gate Docs vs. Runnable Commands

Cross-checked every `verify` field in the REQUIREMENT-CONTRACT JSON against the step-by-step prose and SPRINT.md:

| Task | Requirement ID | `verify` field | Step-by-step command | Match? |
|------|---------------|----------------|---------------------|--------|
| S2-T7 | HG-1 | `manual (Founder-Operator observation)` | `npx convex dev --once --typecheck disable` | Yes — HG-1 description matches step text |
| S2-T8 | HG-1 | `pnpm tsx scripts/spike/zai-glm-proof.ts` | `pnpm tsx scripts/spike/zai-glm-proof.ts` | Yes — exact match |
| S2-T8 | HG-2 | `pnpm tsx scripts/spike/zai-glm-proof.ts` | `pnpm tsx scripts/spike/zai-glm-proof.ts` | Yes — exact match |
| SPRINT.md | Test Step 1 | N/A | `npx convex dev --once --typecheck disable` | Yes — matches S2-T7 |
| SPRINT.md | Test Step 7 | N/A | "Run a z.ai GLM-5.2 structured-output completion" | Abstracted (see non-blocking obs.) |

**Conclusion: All machine-readable gate docs match the runnable commands.**

---

## Files Changed (5)

| File | Change | Assessment |
|------|--------|------------|
| `scripts/spike/zai-glm-proof.ts` (NEW, 127 lines) | Standalone CLI for z.ai GLM-5.2 proof | Correct env-load ordering; real provider path; proper exit codes (0/1/2); biome-ignore annotations for operator console output |
| `scripts/spike/__tests__/zai-glm-proof.contract.test.ts` (NEW, 88 lines) | Contract tests for CLI | Tests error contract (missing key → exit 1) and real provider path (skipped without key); subprocess-based, no in-CLI mocking |
| `S2-T7-...ceilings.md` (4 lines changed) | Deploy command fix + evidence pointer | Correct command; evidence reference verifiable |
| `S2-T8-...external-dependencies-.md` (20 lines changed) | Test invocation → CLI invocation | Steps, expected output, and REQUIREMENT-CONTRACT `verify` fields all updated consistently |
| `SPRINT.md` (2 lines changed) | Deploy command fix | Matches S2-T7 step 1 |

---

## Residual Non-Blocking Observations

1. **SPRINT.md test step 7 is abstracted.** It says "Run a z.ai GLM-5.2 structured-output completion; confirm a non-empty parsed object" without referencing the new CLI (`pnpm tsx scripts/spike/zai-glm-proof.ts`). This is the sprint-level abstraction; S2-T8 carries the precise command. Not a mismatch — just less precise. No action needed.

2. **Evidence path is relative.** S2-T7 step 1 references `evidence/s2-t5-ceilings.json` — this resolves correctly relative to the sprint task directory (`.../sprint-02-mastra-reference-spike/evidence/s2-t5-ceilings.json`). The file exists and contains the claimed `deployAttempts[]` entries. No issue, but an operator running from repo root would need to use the full path.

3. **Contract test live-path is env-dependent.** The "real provider path" test skips when `Z_AI_API_KEY` is absent. In this review environment the key was present, so the test ran live and passed. In a CI environment without the key, only the error-contract test runs. This is the intended design (same skip pattern as the integration test) — not a gap.

4. **CLI imports `zaiProvider.ts` which has `'use node'` directive.** This is a Convex server directive that is a no-op string outside Convex runtime. The CLI comment correctly notes this. No issue.

---

## Verdict

**APPROVE** — The remediation is correct, safe, and complete. The two wiring gaps (production-targeting deploy command, test-suite-as-gate-invocation) are properly fixed. All checks pass: contract tests (2/2), type-check (clean), lint (clean), Convex command safety (cloud-dev confirmed), env-load ordering (correct), gate docs consistency (verified).
