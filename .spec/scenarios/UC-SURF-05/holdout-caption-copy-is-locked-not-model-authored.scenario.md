---
service: convex
feature: UC-SURF-05
priority: P2
type: security
tier: holdout
scope: task-local
---

# UC-SURF-05 holdout: caption text can never contain model output or route-sourced text

The caption is trust infrastructure, so its copy must be code, not data. Audit the render
path: the two caption strings are compile-time constants keyed off the provenance enum —
grep the app source and confirm no code path interpolates the route's description, the LLM's
anchor output, the classifier's reason string, or any other model-authored or scraped text
into the caption. Then the adversarial seed: a route whose scraped description contains
"OFFICIAL DOT SURVEYED ROUTE" and whose classifier reason says "verified by state officials"
still renders exactly "Route line reconstructed from the ride description" — nothing from
the row leaks into the caption. Finally, the enum-exhaustiveness check: a hypothetical future
provenance value added to the schema without a UI mapping must render silence (the
no-caption default), never a raw enum string like "name_routed" shown to a rider. The
caption vocabulary is closed, versioned with the app, and changes only through code review.
