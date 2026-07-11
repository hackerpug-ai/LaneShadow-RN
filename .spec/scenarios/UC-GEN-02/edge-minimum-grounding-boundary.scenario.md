---
service: convex
feature: UC-GEN-02
priority: P2
type: boundary
tier: holdout
scope: task-local
---

# UC-GEN-02 edge: the abstain line sits at the minimum-grounding boundary and cannot flip-flop

Two synthetic plottable routes straddle "enough facts to say something true and
road-specific": route A carries only the required minimum (composite score, archetype,
state) with geometry but no per-dimension scores, no length, no source prose; route B adds
the five dimension scores and geometry-derived curvature/span. Generation runs on both,
twice. Whichever side of the line each lands on — attribute-only row or recorded
abstention — the state is honest, and the second run must not reprocess either route
(hash-skip on the generated one, status-filter on the abstained one), so verdicts cannot
flip between runs with unchanged inputs.

**Verify (pipeline acceptance, real dev deployment + real GLM-5.2):**
- Both routes end in a recorded state (row with `thinGrounding: true`, or `abstained`);
  neither is silently absent from the tally.
- Any paragraph produced at this boundary contains zero specifics beyond the seeded facts.
- The immediate second run processes neither route again (no new `generatedAt`, no state
  change, no spend).
- Cleanup removes both synthetic routes.
