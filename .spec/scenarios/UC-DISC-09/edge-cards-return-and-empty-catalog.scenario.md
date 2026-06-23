---
service: mobile-app
feature: UC-DISC-09
priority: P1
type: edge_case
tier: visible
scope: task-local
---

# UC-DISC-09 edge: cards return when route is cleared + catalog-empty state

Clearing or dismissing the displayed route brings the suggestion cards back over the input.
If the live catalog is empty (drifted deployment, empty bbox, no routes matching the
rider's region), the cards slot shows nothing (no generic `IDLE_SUGGESTIONS` planning
prompts leak through).

**Verify (e2e, real device + live Convex):**
- After clearing the displayed route, suggestion cards return.
- Against an empty catalog (simulated by a tiny ocean bbox), the slot renders empty —
  not the generic "Plan a scenic ride"/"Find coffee nearby" planning prompts.
