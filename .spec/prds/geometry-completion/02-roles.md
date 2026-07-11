---
stability: PRODUCT_CONTEXT
last_validated: 2026-07-10
prd_version: 1.0.0
---

# Roles

| Role | Description |
|------|-------------|
| **Rider** ("Returning Rider Rachel") | The end user browsing and accepting route suggestions. Needs every suggested road to plot as a real, previewable line before she commits a Saturday to it; prefers honest absence over inflated results; abandons apps that oversell. Today 7 of her top-10 national suggestions are junk and half the catalog renders as a centroid dot. |
| **Founder-Operator** | Runs the hygiene passes and rescue batches via `npx convex run` + driver scripts; couch-tests the ~25-route sample that unlocks the full batch; adjudicates the REVIEW queue; is the only authority who can retire a route. Needs resumable, observable, cost-capped batches (~$0.07/route) and recorded evidence for every decision. |
| **System** | The pipeline itself. Owns the deterministic guarantees: fail-closed gating (no unvalidated line is ever stored as servable), provenance on every produced line, a stored deterministic `riderReady` flag, gated read paths that can never serve a centroid dot as a route, idempotent resume, and honest thin-region absence. |
