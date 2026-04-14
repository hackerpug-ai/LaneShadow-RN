---
stability: PRODUCT_CONTEXT
last_validated: 2026-04-13
prd_version: 1.0.0
---

# Roles

| Role | Description |
|------|-------------|
| **Rider (End User)** | Uses LaneShadow to plan rides. Indirectly generates training data when they plan routes while opted in. Can view, toggle, and delete their contribution at any time from the Settings screen. |
| **System (Convex Server)** | Deterministic backend code that captures LLM interactions via the `loggedComplete` wrapper, persists them through the internal mutation, enforces retention via the daily cron, and serves export queries. Owns all writes to `llm_interactions`. |
| **Developer (Justin / Future Contributors)** | Runs `scripts/curation/export_training_data.py` to pull JSONL for offline analysis or future fine-tuning. Uses the logged data to debug quality regressions and reconstruct user reports. Has read access to the table via Convex dashboard. |
| **Privacy Auditor (Justin wearing compliance hat)** | Periodically reviews what's logged, confirms retention is working, validates the deletion flow end-to-end, and keeps the privacy policy accurate. |
