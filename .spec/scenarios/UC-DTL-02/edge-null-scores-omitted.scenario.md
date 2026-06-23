---
service: mobile-app
feature: UC-DTL-02
priority: P2
type: edge_case
tier: visible
scope: task-local
---

# UC-DTL-02 edge: null/undefined scores gracefully omit the bar section

When all five dimension score fields are null or undefined for a route, the entire score-
bar section is omitted — no broken layout, no "NaN%" label, no zero-width bars.

**Verify (integration, live Convex dev → rendered component):**
- A route with all dimension scores null renders no score-bar section.
- A route with one or more scores present renders the section with only the populated bars.
