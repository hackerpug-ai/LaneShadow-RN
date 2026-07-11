---
service: convex
feature: UC-QUAL-01
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-QUAL-01 core: the cross-provider verifier passes grounded claims and blocks a planted fabrication

Freshly generated rows go through the real QA gate: the OpenAI low-tier verifier
(cross-provider from GLM-5.2 generation, so blind spots don't correlate) extracts each
factual claim and maps it to a supplied input fact, recording
`{claim, supported, sourceFact}` per claim. Fully grounded rows flip to `qa_passed`. One
doctored `generated` row is planted whose `whyText` names "the famous Blue Ridge Diner" — a
business in no input fact. That row must land `qa_failed` with the diner claim recorded in
`qa.issues`, stay blocked from ship-ready, and remain invisible to
`getCuratedRouteDetail`. The operator can read exactly which claim failed and why.

**Verify (pipeline acceptance, real dev deployment + real OpenAI verifier):**
- `npx convex run actions/curatedEnrichmentQa:qa '{"sample": 5}'` → passing rows carry
  `qa.verdict: 'pass'` with every extracted claim `supported: true` and a named
  `sourceFact`.
- The doctored row → `qa_failed`; `qa.issues` contains the fabricated-business claim.
- `qa.qaModel` records an OpenAI model, not the generation model (cross-provider proof).
- Detail query for the doctored routeId returns no enrichment field.
