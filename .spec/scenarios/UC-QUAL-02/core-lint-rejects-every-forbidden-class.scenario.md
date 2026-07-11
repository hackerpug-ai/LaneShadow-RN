---
service: convex
feature: UC-QUAL-02
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-QUAL-02 core: deterministic lint rejects fabrication, hype, contradiction, and format busts before any LLM runs

The versioned rule artifact drives a pure lint pass that runs before the grounding
verifier. Five crafted paragraphs exercise every rejection class: (1) "stop at Wanda's
Diner" with no such input fact → banned-claim reject; (2) "world's best, a must-ride" with
nothing justifying the emphasis → hype reject; (3) "relentless switchbacks" on
`curvatureScore: 22` → score-consistency reject; (4) two paragraphs / 340 chars / 120-char
lead sentence → format rejects; (5) a compliant 240-char single paragraph in a rider's
voice → pass. Every rejection records its lint code, and each verdict records the rule-set
version it was judged under.

**Verify (vitest unit + integration on live Convex dev; UNIT_TEST_JUSTIFIED — lint is a
pure transform, zero I/O):**
- Unit: `curatedEnrichmentLint` yields the expected reject code (or pass) for each crafted
  paragraph, deterministically.
- Integration: a length-violating `generated` row swept by the qa action lands `qa_failed`
  with the lint code in `qa.issues` — deterministic reject, no verifier verdict required.
- The rule-set version is recorded with each verdict.
