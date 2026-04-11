================================================================================
TASK: CONVEX-008 - Environment variable for curation deploy key
================================================================================

TASK_TYPE: INFRA
STATUS: Backlog
TDD_PHASE: N/A
CURRENT_AC: N/A
PRIORITY: P0
EFFORT: XS
TYPE: INFRA
ITERATION: 1

--------------------------------------------------------------------------------
BACKGROUND
--------------------------------------------------------------------------------

**Problem:** The CONVEX-003 admin ingest endpoints (`POST /admin/curation/routes`, `POST /admin/curation/enrichments`) must authenticate the Python seed pipeline via a shared secret. No such secret exists in the Convex deployment environment today, and no documentation exists for generating or rotating one.

**Why it matters:** Without the `CURATION_DEPLOY_KEY` environment variable provisioned in Convex, the HTTP handlers implemented in CONVEX-003 will either fail at startup or silently accept unauthenticated writes. Either outcome blocks the seed pipeline and/or opens the ingest endpoints to the public internet.

**Current state:** `npx convex env list` does not include `CURATION_DEPLOY_KEY`. There is no `SETUP.md` for the curation feature. The repo's `.env.local` may not yet contain the key for the Python pipeline's local use.

**Desired state:** A 32-byte hex secret is generated locally, stored in Convex via `npx convex env set CURATION_DEPLOY_KEY <value>`, mirrored into `.env.local` (gitignored) for local Python pipeline runs, and documented in `.spec/prds/curation/SETUP.md` with generation and rotation procedures. The actual key value never appears in any checked-in file or task document.

--------------------------------------------------------------------------------
IMPLEMENTATION_STEPS
--------------------------------------------------------------------------------

1. Generate a 32-byte random key locally:
   ```
   openssl rand -hex 32
   ```
   Do NOT paste the output into this task file, into a commit message, or into any tracked document.

2. Set the key in the Convex deployment environment:
   ```
   npx convex env set CURATION_DEPLOY_KEY <generated-value>
   ```

3. Verify the Convex deployment accepted it:
   ```
   npx convex env list
   ```
   Confirm `CURATION_DEPLOY_KEY` appears in the list.

4. Mirror the key into `.env.local` at repo root so the Python pipeline can read it locally:
   ```
   CURATION_DEPLOY_KEY=<same-generated-value>
   ```

5. Confirm `.env.local` is already listed in `.gitignore` (it is expected to be). If it is not, STOP and escalate — do not commit a modification here; flag to the user first. Do NOT `git add .env.local` under any circumstance.

6. Create `.spec/prds/curation/SETUP.md` documenting:
   - Purpose of `CURATION_DEPLOY_KEY`
   - Generation command: `openssl rand -hex 32`
   - How to set it in Convex: `npx convex env set CURATION_DEPLOY_KEY <value>`
   - How to mirror to `.env.local` for Python pipeline
   - Rotation procedure: generate new key → set in Convex → update `.env.local` → redeploy pipeline workers
   - Security: never commit, never log the plaintext value
   - Canonical name note (see NOTES below)

7. Commit only `.spec/prds/curation/SETUP.md`. Do not stage `.env.local` or any other file.

--------------------------------------------------------------------------------
Quality Criteria
--------------------------------------------------------------------------------

- [ ] Generated key is at least 64 hex characters (32 bytes)
- [ ] `npx convex env list` shows `CURATION_DEPLOY_KEY`
- [ ] `.env.local` contains the same key, and `.env.local` is gitignored
- [ ] `SETUP.md` documents the generation + rotation procedure
- [ ] Plaintext key value does NOT appear in the task file, commit message, SETUP.md, or any tracked file
- [ ] Only `.spec/prds/curation/SETUP.md` is staged for commit

--------------------------------------------------------------------------------
VERIFICATION_CHECKLIST (Boolean Verification)
--------------------------------------------------------------------------------

| # | Boolean Statement | Maps To Step | Verify | Status |
|---|-------------------|--------------|--------|--------|
| 1 | `npx convex env list` output contains the string `CURATION_DEPLOY_KEY` | Step 3 | `npx convex env list \| grep CURATION_DEPLOY_KEY` | [ ] TRUE [ ] FALSE |
| 2 | `.env.local` contains a line starting with `CURATION_DEPLOY_KEY=` followed by at least 64 hex chars | Step 4 | `grep -E '^CURATION_DEPLOY_KEY=[0-9a-f]{64,}$' .env.local` | [ ] TRUE [ ] FALSE |
| 3 | `.env.local` is listed in `.gitignore` | Step 5 | `grep -E '^\.env\.local$\|^\.env\*' .gitignore` | [ ] TRUE [ ] FALSE |
| 4 | `.spec/prds/curation/SETUP.md` exists and documents the generation command `openssl rand -hex 32` | Step 6 | `grep -n "openssl rand -hex 32" .spec/prds/curation/SETUP.md` | [ ] TRUE [ ] FALSE |
| 5 | `.spec/prds/curation/SETUP.md` contains a rotation procedure section | Step 6 | `grep -in "rotation" .spec/prds/curation/SETUP.md` | [ ] TRUE [ ] FALSE |
| 6 | `git status --porcelain` shows only `.spec/prds/curation/SETUP.md` as staged (no `.env.local`) | Step 7 | `git status --porcelain` | [ ] TRUE [ ] FALSE |
| 7 | The plaintext key value does not appear anywhere in `git grep` | Steps 1-7 | `git grep -nE '[0-9a-f]{64}'` returns nothing matching the real key | [ ] TRUE [ ] FALSE |

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .gitignore
   - Lines: ALL
   - Focus: Confirm `.env.local` or `.env*` pattern is already excluded

2. .spec/prds/curation/09-technical-requirements.md
   - Sections: S9-TRD-7 Convex Backend (auth header expectations)
   - Focus: Cross-reference to confirm the auth mechanism for ingest endpoints is a shared secret

3. Convex CLI documentation — `npx convex env --help`
   - Focus: Confirm exact subcommand surface (`env set`, `env list`, `env remove`)

4. brain/docs/CONVEX-RULES.md
   - Sections: Environment variables, secrets
   - Focus: Project conventions for naming and handling secrets

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED (explicit file list):
- .env.local (local only, gitignored, NEVER committed)
- .spec/prds/curation/SETUP.md (NEW)

WRITE-PROHIBITED:
- convex/schema.ts — out of scope
- convex/http.ts — CONVEX-003 owns HTTP handlers
- convex/curationAdmin.ts — CONVEX-003
- README.md — not to be modified here
- .gitignore — if `.env.local` is missing from it, escalate rather than edit
- Any task file or spec file other than SETUP.md

MUST:
- [ ] Use `openssl rand -hex 32` (32 bytes = 64 hex chars)
- [ ] Set the key in Convex via `npx convex env set`
- [ ] Mirror to `.env.local` with identical value
- [ ] Confirm `.env.local` is gitignored before writing to it
- [ ] Document generation AND rotation in SETUP.md
- [ ] Name the variable exactly `CURATION_DEPLOY_KEY`

MUST NOT:
- [ ] Write the plaintext key value into any checked-in file
- [ ] Paste the key into commit messages, task comments, or PR descriptions
- [ ] `git add .env.local` under any circumstance
- [ ] Rename the variable to `CURATION_INGEST_KEY` — despite that name appearing in `convex-api-design.md`, this task canonicalises `CURATION_DEPLOY_KEY` (see NOTES)
- [ ] Modify convex/ source files
- [ ] Skip the `.gitignore` verification step

--------------------------------------------------------------------------------
CODE PATTERN (Reference)
--------------------------------------------------------------------------------

Source: Convex CLI (see `npx convex env --help`) and existing secret usage in `convex/lib/env.ts` (e.g., `CLERK_WEBHOOK_SECRET`).

```bash
# Generate (DO NOT COMMIT OUTPUT)
openssl rand -hex 32

# Set in Convex deployment
npx convex env set CURATION_DEPLOY_KEY <value>

# Verify
npx convex env list | grep CURATION_DEPLOY_KEY

# Mirror to local env file (gitignored)
printf 'CURATION_DEPLOY_KEY=%s\n' '<value>' >> .env.local
```

```markdown
<!-- .spec/prds/curation/SETUP.md skeleton -->
# Curation Backend — Local Setup

## CURATION_DEPLOY_KEY

Shared secret used by the Python seed pipeline to authenticate to Convex
admin ingest endpoints (`POST /admin/curation/routes`, `POST /admin/curation/enrichments`).

### Generation
```
openssl rand -hex 32
```

### Installation
1. `npx convex env set CURATION_DEPLOY_KEY <value>`
2. Mirror into repo-root `.env.local` (gitignored) as `CURATION_DEPLOY_KEY=<value>`

### Rotation
1. Generate a new key via `openssl rand -hex 32`
2. `npx convex env set CURATION_DEPLOY_KEY <new>`
3. Update `.env.local` and redeploy the Python pipeline workers
4. Invalidate old key — Convex will reject requests signed with the previous value

### Security
- Never commit the plaintext value
- Never log the value
- Rotate on any suspected leak
```

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (Implementation Steps)
--------------------------------------------------------------------------------

AGENT: convex-implementer

This is an INFRA task — no TDD RED/GREEN cycle. Execute the IMPLEMENTATION_STEPS above in order, then run the VERIFICATION_CHECKLIST commands and record results.

STEP-BY-STEP EXECUTION:

1. Run `grep -n '\.env\.local' .gitignore`. If no match, STOP and surface to the user. Do not proceed.
2. Run `openssl rand -hex 32` and capture the output in an ephemeral shell variable (e.g., `KEY=$(openssl rand -hex 32)`). Do not echo it to task output.
3. Run `npx convex env set CURATION_DEPLOY_KEY "$KEY"`.
4. Run `npx convex env list` and confirm `CURATION_DEPLOY_KEY` appears.
5. Append `CURATION_DEPLOY_KEY=$KEY` to `.env.local` (create the file if missing).
6. Write `.spec/prds/curation/SETUP.md` per the CODE PATTERN skeleton above.
7. Unset the ephemeral variable: `unset KEY`.
8. Run `git status --porcelain` — confirm only SETUP.md is tracked-dirty.
9. Commit SETUP.md with message `CONVEX-008: document curation deploy key setup`.

RETURN: { phase: "INFRA_COMPLETE", files_changed: [".spec/prds/curation/SETUP.md"], convex_env_verified: true, env_local_written: true }

MUST:
- Use an ephemeral shell variable to avoid leaking the key into logs
- Verify gitignore BEFORE writing `.env.local`

MUST NOT:
- Print the key value in any tool call output
- Stage `.env.local`

--------------------------------------------------------------------------------
ORCHESTRATOR VERIFICATION PROTOCOL
--------------------------------------------------------------------------------

AFTER implementation:

1. RUN: npx convex env list
   EXPECT: Output contains `CURATION_DEPLOY_KEY`

2. RUN: grep -E '^CURATION_DEPLOY_KEY=[0-9a-f]{64,}$' .env.local
   EXPECT: Exit 0 (line present with 64+ hex chars)

3. RUN: grep -E '\.env\.local' .gitignore
   EXPECT: Exit 0

4. RUN: test -f .spec/prds/curation/SETUP.md && grep -q "openssl rand -hex 32" .spec/prds/curation/SETUP.md
   EXPECT: Exit 0

5. RUN: git status --porcelain
   EXPECT: Only `.spec/prds/curation/SETUP.md` is listed (or the file is already committed)

6. RUN: git log -1 --name-only
   EXPECT: Commit includes SETUP.md, does NOT include `.env.local`

7. RUN: git grep -nE '^CURATION_DEPLOY_KEY=[0-9a-f]{64}'
   EXPECT: No matches (plaintext key never committed)

If any step fails: return to agent with precise failure.

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

**Implementation Agent**: convex-implementer
**Rationale**: Task involves Convex CLI env management and spec documentation. convex-implementer owns Convex CLI workflows and understands project secret-handling conventions.

**Review Agent**: convex-reviewer
**Rationale**: Review verifies that the canonical variable name matches CONVEX-003's usage, SETUP.md is complete, and no plaintext key was committed anywhere.

**Assignment Date**: 2026-04-11

**Agent Pairing**: Standard implementer-reviewer pairing per brain/docs/kanban/agent-assignment.md

**Assignment Logic**:
- Task Type: INFRA
- File Patterns: .env.local (local only), .spec/prds/curation/SETUP.md
- Implementation: convex-implementer
- Review: convex-reviewer

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: Convex env var set
  Command: npx convex env list | grep CURATION_DEPLOY_KEY
  Expected: Exit 0

Gate 2: Local mirror present
  Command: grep -E '^CURATION_DEPLOY_KEY=[0-9a-f]{64,}$' .env.local
  Expected: Exit 0

Gate 3: Gitignore protects .env.local
  Command: grep -E '\.env\.local' .gitignore
  Expected: Exit 0

Gate 4: SETUP.md documents procedure
  Command: grep -q "openssl rand -hex 32" .spec/prds/curation/SETUP.md && grep -iq "rotation" .spec/prds/curation/SETUP.md
  Expected: Exit 0

Gate 5: No plaintext key committed
  Command: git log -p -- .env.local && git grep -nE 'CURATION_DEPLOY_KEY=[0-9a-f]{64}'
  Expected: No results — key never entered git history

Gate 6: Scope Compliance
  Command: git diff --name-only main...HEAD
  Expected: Only `.spec/prds/curation/SETUP.md`

--------------------------------------------------------------------------------
REVIEW CRITERIA (for convex-reviewer)
--------------------------------------------------------------------------------

TDD Quality:
- [ ] N/A — INFRA task, no TDD

Code Quality:
- [ ] SETUP.md is clear, actionable, and self-contained
- [ ] Variable name `CURATION_DEPLOY_KEY` used consistently
- [ ] No plaintext key in any tracked file

Domain-Specific:
- [ ] `npx convex env list` shows `CURATION_DEPLOY_KEY`
- [ ] `.env.local` contains the same key and is gitignored
- [ ] Rotation procedure documented
- [ ] Canonical variable name reconciled with CONVEX-003 (see NOTES)

Security:
- [ ] Key length >= 64 hex chars (32 bytes)
- [ ] Key never appears in git history, commit messages, or task comments
- [ ] `.env.local` is not staged

Review Verdict: [ ] APPROVED   [ ] NEEDS_FIXES

Feedback (required if NEEDS_FIXES):
```
[Reviewer documents specific, actionable issues here]
```

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On:
- (none)

Blocks:
- CONVEX-003 — HTTP handlers read `process.env.CURATION_DEPLOY_KEY` and must fail fast if unset

--------------------------------------------------------------------------------
TASK READINESS
--------------------------------------------------------------------------------

Prerequisites:
- [ ] Convex CLI is authenticated locally (`npx convex env list` succeeds against the dev deployment)
- [ ] `.env.local` is already listed in `.gitignore`

Can Execute In Parallel With: CONVEX-001, CONVEX-002, PIPE-001

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

- **Variable name reconciliation**: `.spec/prds/curation/convex-api-design.md` refers to the same secret as `CURATION_INGEST_KEY`. This task deliberately uses `CURATION_DEPLOY_KEY` per the user's task spec. The reviewer MUST confirm the canonical name and, if a later decision prefers `CURATION_INGEST_KEY`, open a follow-up task to rename consistently across CONVEX-003, the Python pipeline, and `convex-api-design.md`. Do NOT silently rename in this task.
- The plaintext key value must never appear in chat output, task comments, commit messages, or any tracked file. Use an ephemeral shell variable during execution.
- If `.env.local` is missing from `.gitignore`, STOP and escalate to the user — do not self-edit `.gitignore` as part of this task.
- This is a one-shot infra step; no recurring work. Rotation is a documented manual procedure, not an automated job.

--------------------------------------------------------------------------------
APPROVAL
--------------------------------------------------------------------------------

Approved By: [pending]
Date: [pending]

================================================================================