# S2-T8 — Observe the green T-AGT-024 proof; re-ratify enrichment/06-external-dependencies.md (discharge cross-PRD prerequisite)

| Field | Value |
|-------|-------|
| TASK_ID | S2-T8 |
| SPRINT | [Sprint 02 — Mastra spike + z.ai proof + enrichment re-ratification](./SPRINT.md) |
| TASK_TYPE | HUMAN_GATE |
| AGENT | Founder-Operator (manual) |
| ESTIMATE | 30 min |
| STATUS | completed |
| PROPOSED_BY | `aisdk-planner` |
| TDD_MODE | `skipped` (manual observation; the automated proof is the FEATURE tasks) |
| RED_GREEN_REQUIRED | no |
| CRITERION | T-AGT-024 (gates re-ratification) |
| DEPENDS_ON | S2-T6 |

## OUTCOME

Observe the green T-AGT-024 proof; re-ratify enrichment/06-external-dependencies.md (discharge cross-PRD prerequisite)

## FOUNDER DECISION — 2026-07-13

**Decision: ACCEPTED AND RATIFIED.** Two fresh live runs of
`pnpm tsx scripts/spike/zai-glm-proof.ts` returned `ok:true`, `path:"structured"`, and
`confidence:"high"` with non-empty, different summaries (219 and 300 characters). The
provider wiring and proof details are recorded in
`evidence/s2-t8-zai-ratification.json`. The enrichment dependency section is now
RATIFIED against S2-T6 commit `fed7c669`; the re-ratification prerequisite is discharged.

## HUMAN TESTING GATE

**Gate:** The founder observes S2-T6's green T-AGT-024 evidence — a real z.ai GLM-5.2 completion through the custom createOpenAICompatible provider returning a non-empty parsed structured object — and then re-ratifies the enrichment PRD's external-dependencies section to match the new AI-SDK-native z.ai wiring, discharging the D1/risk-#21 cross-PRD prerequisite that currently blocks the enrichment PRD's own sprints and, per the roadmap, must land before the pi-ai teardown in Sprint 07.

> This is a manual sign-off. It is NOT a FEATURE task and carries no TDD scenario — the sprint FEATURE tasks carry the automated proof; this task is the founder's own-eyes confirmation on the real running deployment.

### Pre-steps (one-time setup)

1. Confirm S2-T6 has landed: `git log --oneline -10 -- convex/actions/agent/lib/zaiProvider.ts` shows at least one commit.
2. Confirm `Z_AI_API_KEY` is present locally so the proof CLI can call the real z.ai API: `grep -c Z_AI_API_KEY .env.local` -> expected output `1`.
3. Open `.spec/prds/enrichment/09-technical-requirements/06-external-dependencies.md` in an editor — this is the file being re-ratified in step 4 below.

### Step-by-step

1. Run the z.ai GLM-5.2 proof CLI to produce fresh, live evidence.

   ```bash
   pnpm tsx scripts/spike/zai-glm-proof.ts
   ```

   **Expected:** Exit code 0. STDOUT prints a JSON object with `ok: true`, a `path` field (`"structured"` or `"text-fallback"`), a non-empty `summary` string, and a `confidence` value (high/medium/low). STDERR prints a human-readable proof summary. Content should read as natural model output, not a static placeholder string. This CLI calls the REAL `createZaiProvider` / `zaiStructuredComplete` path — it does NOT mock the provider.

2. Sanity-check the captured evidence is not a stub: re-run once more and compare the two summaries.

   ```bash
   pnpm tsx scripts/spike/zai-glm-proof.ts
   ```

   **Expected:** Exit code 0 again; the printed `summary` text on this run reads differently (even slightly) from step 1's run — real LLM output is not byte-identical across calls. An IDENTICAL string across both runs is a red flag (possible stub) and should block this gate — do not proceed to step 3 until this is resolved.

3. Open the target PRD section and locate the pending-ratification callout.

   ```bash
   grep -n "pending re-ratification" .spec/prds/enrichment/09-technical-requirements/06-external-dependencies.md
   ```

   **Expected:** One match, at or near the 'z.ai API — GLM-5.2' row (line ~26) and its D1 callout block (lines 11-20), currently reading: '... v3.1.0 D1: the client becomes a custom AI-SDK OpenAI-compatible provider (pi-ai removed); model + baseUrl + thinkingFormat unchanged; pending re-ratification'.

4. Edit that row/callout in a text editor: remove the words 'pending re-ratification' and replace with a re-ratification record — today's date, the S2-T6 commit SHA as verifying evidence, and confirmation that the documented wiring (createOpenAICompatible, baseURL https://api.z.ai/api/coding/paas/v4, env var name Z_AI_API_KEY — NOT ZAI_API_KEY) matches what actually shipped.

   ```bash
   (manual edit — no CLI command; edit .spec/prds/enrichment/09-technical-requirements/06-external-dependencies.md directly)
   ```

   **Expected:** The file's D1 callout and the z.ai row no longer contain the phrase 'pending re-ratification'; both now state the wiring is RATIFIED with a date and commit-SHA reference.

5. Commit the re-ratification edit.

   ```bash
   git add .spec/prds/enrichment/09-technical-requirements/06-external-dependencies.md && git commit -m "docs(enrichment): re-ratify z.ai GLM-5.2 dependency section per T-AGT-024 (S2-T6 <sha>)"
   ```

   **Expected:** A new commit is created; `git log -1 --stat` shows only the one changed file.

6. Deterministically verify the gate is discharged.

   ```bash
   grep -n "pending re-ratification" .spec/prds/enrichment/09-technical-requirements/06-external-dependencies.md; echo "exit=$?"
   ```

   **Expected:** `exit=1` (grep found no matches) — this is the proof the prerequisite is cleared. Sprint 07 (agent rebuild / pi-ai teardown) and the enrichment PRD's own sprints are now unblocked on this specific prerequisite.


## DEPENDENCIES

- Depends on: S2-T6
- Blocks: sprint-07-agent-rebuild-grounding, .spec/prds/enrichment sprints (pipeline-tier tasks gated on D1 re-ratification)

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "S2-T8",
  "tdd_mode": "skipped",
  "verification_policy": {
    "requires_tests": false,
    "requires_red_evidence": false,
    "requires_seeded_evidence": false
  },
  "fixtures": {},
  "requirements": [
    {
      "id": "HG-1",
      "type": "human_verification",
      "primary": false,
      "maps_to_ac": null,
      "description": "Run the z.ai GLM-5.2 proof CLI to produce fresh, live evidence. — Expected: Exit code 0. STDOUT prints a JSON object with ok: true, path (structured/text-fallback), non-empty summary, and confidence. Calls the REAL createZaiProvider/zaiStructuredComplete path — no mocking.",
      "verify": "pnpm tsx scripts/spike/zai-glm-proof.ts"
    },
    {
      "id": "HG-2",
      "type": "human_verification",
      "primary": false,
      "maps_to_ac": null,
      "description": "Sanity-check the captured evidence is not a stub: re-run once more and compare the two summaries. — Expected: Exit code 0 again; the printed `summary` text on this run reads differently (even slightly) from step 1's run — real LLM output is not byte-identical across calls. An IDENTICAL string across both runs is a red flag (possible stub) and should block this gate — do not proceed to step 3 until this is resolved.",
      "verify": "pnpm tsx scripts/spike/zai-glm-proof.ts"
    },
    {
      "id": "HG-3",
      "type": "human_verification",
      "primary": false,
      "maps_to_ac": null,
      "description": "Open the target PRD section and locate the pending-ratification callout. — Expected: One match, at or near the 'z.ai API — GLM-5.2' row (line ~26) and its D1 callout block (lines 11-20), currently reading: '... v3.1.0 D1: the client becomes a custom AI-SDK OpenAI-compatible provider (pi-ai removed); model + baseUrl + thinkingFormat unchanged; pending re-ratification'.",
      "verify": "grep -n \"pending re-ratification\" .spec/prds/enrichment/09-technical-requirements/06-external-dependencies.md"
    },
    {
      "id": "HG-4",
      "type": "human_verification",
      "primary": false,
      "maps_to_ac": null,
      "description": "Edit that row/callout in a text editor: remove the words 'pending re-ratification' and replace with a re-ratification record — today's date, the S2-T6 commit SHA as verifying evidence, and confirmation that the documented wiring (createOpenAICompatible, baseURL https://api.z.ai/api/coding/paas/v4, env var name Z_AI_API_KEY — NOT ZAI_API_KEY) matches what actually shipped. — Expected: The file's D1 callout and the z.ai row no longer contain the phrase 'pending re-ratification'; both now state the wiring is RATIFIED with a date and commit-SHA reference.",
      "verify": "manual (Founder-Operator observation)"
    },
    {
      "id": "HG-5",
      "type": "human_verification",
      "primary": false,
      "maps_to_ac": null,
      "description": "Commit the re-ratification edit. — Expected: A new commit is created; `git log -1 --stat` shows only the one changed file.",
      "verify": "git add .spec/prds/enrichment/09-technical-requirements/06-external-dependencies.md && git commit -m \"docs(enrichment): re-ratify z.ai GLM-5.2 dependency section per T-AGT-024 (S2-T6 <sha>)\""
    },
    {
      "id": "HG-6",
      "type": "human_verification",
      "primary": false,
      "maps_to_ac": null,
      "description": "Deterministically verify the gate is discharged. — Expected: `exit=1` (grep found no matches) — this is the proof the prerequisite is cleared. Sprint 07 (agent rebuild / pi-ai teardown) and the enrichment PRD's own sprints are now unblocked on this specific prerequisite.",
      "verify": "grep -n \"pending re-ratification\" .spec/prds/enrichment/09-technical-requirements/06-external-dependencies.md; echo \"exit=$?\""
    }
  ],
  "human_gate": {
    "gate": "The founder observes S2-T6's green T-AGT-024 evidence — a real z.ai GLM-5.2 completion through the custom createOpenAICompatible provider returning a non-empty parsed structured object — and then re-ratifies the enrichment PRD's external-dependencies section to match the new AI-SDK-native z.ai wiring, discharging the D1/risk-#21 cross-PRD prerequisite that currently blocks the enrichment PRD's own sprints and, per the roadmap, must land before the pi-ai teardown in Sprint 07.",
    "criterion": "T-AGT-024 (gates re-ratification)"
  }
}
-->
</details>
