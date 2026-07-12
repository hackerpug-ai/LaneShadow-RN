# S2-T7 — Run the §5b spike gate; record accept/adjust on the pinned ceilings

| Field | Value |
|-------|-------|
| TASK_ID | S2-T7 |
| SPRINT | [Sprint 02 — Mastra spike + z.ai proof + enrichment re-ratification](./SPRINT.md) |
| TASK_TYPE | HUMAN_GATE |
| AGENT | Founder-Operator (manual) |
| ESTIMATE | 30 min |
| STATUS | Backlog |
| PROPOSED_BY | `mastra-planner` |
| TDD_MODE | `skipped` (manual observation; the automated proof is the FEATURE tasks) |
| RED_GREEN_REQUIRED | no |
| CRITERION | T-AGT-023 (human-gate) |
| DEPENDS_ON | S2-T3, S2-T4, S2-T5, S2-T6 |

## OUTCOME

Run the §5b spike gate; record accept/adjust on the pinned ceilings

## HUMAN TESTING GATE

**Gate:** On the cloud dev deployment, the operator's second conversation turn ('OK what's scenic') inherits the Ogden center resolved by the first turn through the embedded @mastra/core agent — with root/model/tool spans visible and redacted in LangSmith and the cold-start ≤8s / bundle-delta ≤10MB ceilings accepted or adjusted.

> This is a manual sign-off. It is NOT a FEATURE task and carries no TDD scenario — the sprint FEATURE tasks carry the automated proof; this task is the founder's own-eyes confirmation on the real running deployment.

### Pre-steps (one-time setup)

1. One-time: ensure ANTHROPIC_API_KEY, GOOGLE_MAPS_API_KEY, LANGSMITH_API_KEY, and LANGSMITH_PROJECT are set on the CLOUD DEV deployment via `npx convex env set <KEY> <value>` (not just .env.local).
2. One-time: confirm S2-T3 (rideAgentSpike), S2-T4 (Observability wiring), and S2-T5 (ceilings evidence) have landed on main.
3. One-time: run `pnpm install` so @mastra/core + @mastra/observability + ai@7 are present.

### Step-by-step

1. Run `npx convex deploy` to the cloud dev deployment (NOT local `convex dev`, which is a warm sandbox).
2. Invoke the spike action with 'twisty roads near Ogden'; confirm the reply lists routes with real distances from Ogden.
3. Send turn two 'OK what's scenic' in the same session; confirm turn two searches near Ogden (not statewide).
4. Open the LangSmith trace; confirm root + model + tool span types are present, each stamped promptVersion / sessionId / tier / cost.
5. Grep the exported span JSON for `sk-ant-`, `sk-`, `AIza`, and any `*_API_KEY` value — expect none (SensitiveDataFilter redaction).
6. Read evidence/s2-t5-ceilings.json; accept or adjust the pinned cold-start ≤ 8 s and bundle-delta ≤ 10 MB ceilings, recording the decision.

## DEPENDENCIES

- Depends on: S2-T3, S2-T4, S2-T5, S2-T6
- Blocks: sprint-07-agent-rebuild

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "S2-T7",
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
      "description": "Run `npx convex deploy` to the cloud dev deployment (NOT local `convex dev`, which is a warm sandbox).",
      "verify": "manual (Founder-Operator observation)"
    },
    {
      "id": "HG-2",
      "type": "human_verification",
      "primary": false,
      "maps_to_ac": null,
      "description": "Invoke the spike action with 'twisty roads near Ogden'; confirm the reply lists routes with real distances from Ogden.",
      "verify": "manual (Founder-Operator observation)"
    },
    {
      "id": "HG-3",
      "type": "human_verification",
      "primary": false,
      "maps_to_ac": null,
      "description": "Send turn two 'OK what's scenic' in the same session; confirm turn two searches near Ogden (not statewide).",
      "verify": "manual (Founder-Operator observation)"
    },
    {
      "id": "HG-4",
      "type": "human_verification",
      "primary": false,
      "maps_to_ac": null,
      "description": "Open the LangSmith trace; confirm root + model + tool span types are present, each stamped promptVersion / sessionId / tier / cost.",
      "verify": "manual (Founder-Operator observation)"
    },
    {
      "id": "HG-5",
      "type": "human_verification",
      "primary": false,
      "maps_to_ac": null,
      "description": "Grep the exported span JSON for `sk-ant-`, `sk-`, `AIza`, and any `*_API_KEY` value — expect none (SensitiveDataFilter redaction).",
      "verify": "manual (Founder-Operator observation)"
    },
    {
      "id": "HG-6",
      "type": "human_verification",
      "primary": false,
      "maps_to_ac": null,
      "description": "Read evidence/s2-t5-ceilings.json; accept or adjust the pinned cold-start ≤ 8 s and bundle-delta ≤ 10 MB ceilings, recording the decision.",
      "verify": "manual (Founder-Operator observation)"
    }
  ],
  "human_gate": {
    "gate": "On the cloud dev deployment, the operator's second conversation turn ('OK what's scenic') inherits the Ogden center resolved by the first turn through the embedded @mastra/core agent — with root/model/tool spans visible and redacted in LangSmith and the cold-start ≤8s / bundle-delta ≤10MB ceilings accepted or adjusted.",
    "criterion": "T-AGT-023 (human-gate)"
  }
}
-->
</details>
