---
service: mobile-app
feature: UC-WHY-03
priority: P2
type: security
tier: holdout
scope: task-local
---

# UC-WHY-03 edge: internal lifecycle state never leaks through the rendered surface or the wire

Provenance transparency must not become internal-state leakage. For seeded enriched routes
(one fresh `qa_passed`, one stale-with-pass), an on-device inspection of the detail screen
— view hierarchy, accessibility labels, testID payloads — must contain no lifecycle
vocabulary ('qa_passed', 'stale', 'generated'), no QA issue strings, no model or
prompt-version values, and no groundingFacts content. On the wire, the subscribed query
result carries only `why` and `generatedAt` under `enrichment`. The rider-visible surface
is the paragraph, the label, and the caption — nothing else about the pipeline.

**Verify (e2e real device + network inspection against live Convex):**
- Dump the view hierarchy on both routes and grep for lifecycle/QA/model/prompt strings →
  zero hits outside the paragraph and caption copy themselves.
- Inspect the live query payload (metro network tooling) → the enrichment sub-object
  contains exactly `why` and `generatedAt`.
