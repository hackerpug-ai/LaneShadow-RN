---
stability: FEATURE_SPEC
last_validated: 2026-07-10
prd_version: 1.0.0
functional_group: QUAL
---

# Use Cases: Quality Gate & Couch Test (QUAL)

| ID | Title | Description |
|----|-------|-------------|
| UC-QUAL-01 | Validate claim grounding | Every claim traces to a supplied input fact; ungrounded blocks shipping |
| UC-QUAL-02 | Enforce tone + forbidden content | Rider voice; no invented specifics or ungrounded superlatives |
| UC-QUAL-03 | Pass the R2 couch test | The founder's human ship gate on personally-known roads |

---

## UC-QUAL-01: Validate that every claim in a generated "why" traces to a supplied input fact

Before an enrichment is eligible to ship, an automated grounding check verifies each factual
claim maps to one of the route's supplied input facts. The verifier runs on a different
provider than generation (cross-provider check) so correlated blind spots are reduced.
Claims with no supporting input fact are flagged and block the enrichment from ship-ready
status. Verifier errors fail closed.

**Acceptance Criteria**

- ☐ System can flag any factual claim in a generated "why" that does not map to a supplied input fact for that route.
- ☐ System can block an enrichment from reaching ship-ready status while it contains at least one ungrounded claim.
- ☐ Operator can view, for a flagged enrichment, which specific claim failed grounding and why.
- ☐ System can pass an enrichment through grounding QA only when every factual claim resolves to a supplied input fact.
- ☐ System can treat a grounding-verifier error as a failed verdict (fail-closed), leaving the route unshipped rather than unverified.

---

## UC-QUAL-02: Enforce tone and forbidden-content rules on every generated "why"

The "why" must sound like it was written by a rider and must never invent businesses,
landmarks, vistas, history, hazards, or superlatives the inputs do not support. Deterministic
lint enforces format/length, banned-claim patterns, and score-consistency (prose must not
contradict the sub-scores) before the LLM verifier runs. The rule set is a governed,
versioned artifact — changing it is a recorded event, not a code edit buried in a prompt.

**Acceptance Criteria**

- ☐ Admin can define the tone rules and forbidden-content list that every generated "why" is checked against, as a versioned artifact.
- ☐ System can reject a "why" that names a specific business, landmark, event, or historical claim not present in the route's input facts.
- ☐ System can reject a "why" that uses hype or unsupported superlatives (e.g., "world's best," "must-ride") absent an input fact that justifies the emphasis.
- ☐ System can reject a "why" whose claims contradict the route's sub-scores (e.g., "relentless switchbacks" on a low curvature score, "gloriously deserted" on a low remoteness score).
- ☐ System can reject a "why" that violates the format/length budget (single paragraph, ≤320 characters, lead sentence ≤100 characters).

---

## UC-QUAL-03: Pass the R2 couch test as a human ship gate on personally-known roads

The founder-operator reviews the generated "why" for ~10 roads they personally know —
sampled to span archetypes, sources, and at least two thin-grounding routes — and judges
whether each reads true. The gate passes only when at least 9 of 10 read true AND zero
enrichments contain a fabricated specific (a single fabrication is an automatic fail
regardless of count). A fail routes the offending enrichments back to regeneration or
rule-tuning, and the gate re-runs. This is FOUNDER-BAR R2.

**Acceptance Criteria**

- ☐ Operator can obtain a couch-test sample of at least ten QA-passed enrichments biased toward personally-known roads, spanning sources and including at least two thin-grounding routes.
- ☐ Operator can mark each sampled enrichment as pass or fail with a short reason recorded against that route.
- ☐ System can compute the couch-test result against the defined pass condition (≥9/10 true AND zero fabrications) and record whether the R2 gate is green.
- ☐ Operator can block the rider-facing "why" from shipping while the R2 gate is red.
- ☐ Operator can route a failed sample enrichment back to regeneration or to a tone/grounding-rule change, and re-run the gate after remediation.
