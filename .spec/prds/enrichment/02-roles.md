---
stability: PRODUCT_CONTEXT
last_validated: 2026-07-10
prd_version: 1.0.0
---

# Roles

| Role | Description |
|------|-------------|
| **Rider** | Authenticated app user discovering curated roads (personas: Touring Terry — Butler-map depth-seeker; Weekend Warrior Mike — fast-trust decider; Returning Rider Rachel — cautious-trust rider). Reads the "why" on the detail screen; never sees pipeline states beyond honest presence/absence. |
| **Operator** | The founder running the pipeline (FOUNDER-BAR R2 actor). Executes batch generation via the driver CLI, reviews coverage/health reports, performs the couch test, records verdicts, triggers scoped regeneration. Works through `npx convex run` — no admin UI in this PRD. |
| **Admin** | Governs the quality rule set: tone rules, forbidden-content list, staleness-trigger definitions. In v1 this is the same human as Operator, but the rule surfaces are versioned artifacts (promptVersion, lint config), not hard-coded behavior. |
| **System** | The Convex pipeline itself: generation actions, QA gates, staleness detection, the read path. Owns every always-must-happen behavior (fail-closed gating, honest absence, idempotent skips). |
