---
service: convex
feature: UC-GEN-02
priority: P1
type: edge_case
tier: holdout
scope: task-local
---

# UC-GEN-02 edge: degenerate source prose is treated as thin, not as grounding

Three synthetic routes carry a `sourceSummary` that exists but says nothing: `"   "`
(pure whitespace), `"&nbsp;</p>"` (scraper HTML residue), and the 11-char boilerplate
fragment "Great road!". None of these is prose that can ground a narrative claim.
Generation must treat all three as thin-grounding — attribute-only marking, no claim
attributed to the junk text — rather than taking the field's mere presence as license for
narrative color. The paragraphs (or abstentions) that result must be indistinguishable in
honesty from a route whose `sourceSummary` is absent outright.

**Verify (pipeline acceptance, real dev deployment + real GLM-5.2):**
- Each seeded route lands attribute-only (`thinGrounding` treatment) or honestly
  `abstained` — never a row grounded on the junk string.
- No stored paragraph quotes or paraphrases the whitespace/HTML/boilerplate fragment as if
  it were road knowledge.
- Cleanup removes the three synthetic routes and any rows.
