---
service: convex
feature: UC-DATA-04
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-DATA-04 core: dirty state strings are normalized and lengthMiles is clamped

The read path normalizes dirty state strings ("north carolina", "N.C.", "NC ", etc.) to a
canonical form and clamps junk `lengthMiles` outliers (values >999 → "1000+ mi", values
≤0 → hidden). Pure transforms — no I/O.

**Verify (integration, live Convex dev):**
- Querying routes by state with various dirty inputs returns rows for the canonical state.
- A route with `lengthMiles > 999` renders as "1000+ mi" in the UI.
- A route with `lengthMiles = 0` is hidden/blank in the UI.
