---
service: convex
feature: UC-GEN-01
priority: P1
type: error_handling
tier: holdout
scope: task-local
---

# UC-GEN-01 edge: model output that busts the single-paragraph contract never lands as-is

GLM-5.2 will occasionally return bulleted lists, multiple paragraphs, or markdown headings
despite the prompt. The engine must enforce the format contract itself rather than trusting
the model: an emitted "why" containing a list marker, a blank-line paragraph break, or a
heading is never persisted in that shape — it is either repaired within a bounded re-ask or
recorded as a failure with a retrievable reason, leaving the route in honest absence.

**Verify (pipeline acceptance, real dev deployment + real GLM-5.2; malformed payload staged
at the persistence seam):**
- Drive the persistence path with a tool-emit containing `- point one\n- point two` and a
  two-paragraph variant → neither is ever readable from `curated_route_enrichments`.
- After a real `--sample` run, sweep every stored `whyText`: zero rows contain `\n\n`, a
  leading `#`, or list markers.
- A route whose output could not be repaired shows `enrichmentStatus: 'failed'` with a
  format-flavored reason — not a malformed row, not a truncated fragment.
