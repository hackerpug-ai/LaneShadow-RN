---
service: convex
feature: UC-GEN-03
priority: P1
type: edge_case
tier: holdout
scope: task-local
---

# UC-GEN-03 edge: a parse-stage failure during regeneration cannot clobber the served text

A route already holds a QA-passed enrichment that riders are reading. Its regeneration is
forced to die AFTER the model responds: the forced `emit_enrichment` tool payload is
malformed (staged at the parse seam), so no valid replacement ever exists. The prior
QA-passed row must remain untouched and still served by `getCuratedRouteDetail`; the
failure is recorded with a parse-flavored reason distinguishable from a provider error; and
the row's `whyText`, `qa`, and `generatedAt` are byte-identical before and after the failed
attempt. Losing good text to a bad regeneration is the corruption this UC forbids.

**Verify (integration, real dev deployment):**
- Snapshot the row → force the parse failure on regeneration → diff the row: unchanged.
- `getCuratedRouteDetail` returns the same `why` before, during, and after.
- The recorded failure reason names a parse/format cause, not a provider outage.
