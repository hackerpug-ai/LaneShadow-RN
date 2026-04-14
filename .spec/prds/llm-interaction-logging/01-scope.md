---
stability: FEATURE_SPEC
last_validated: 2026-04-13
prd_version: 1.0.0
appetite_weeks: 2
---

# Scope

## Appetite

**2 weeks** (core + key edge cases). Scope cuts assume one engineer working solo with Haiku still as the source of truth — no training pipeline built in this cycle.

## In Scope

- New Convex table `llm_interactions` with schema defined in `08-technical-requirements.md`
- New internal mutation `llmInteractions.logInteraction` (server-only, never called from client)
- New wrapper utility `convex/actions/agent/lib/loggedComplete.ts` around `pi-ai`'s `complete()`
- Callsite migration for **all four** micro-tasks: `enrichRoute` (route labels + rationales + highlights + leg labels) at `convex/actions/agent/tools/enrichRoute.ts`
- Status tracking: `success`, `fallback`, `error` — all three captured, not just successes
- User consent field `allowTrainingDataCollection` on the `users` table, defaulting to `false`
- Settings screen toggle with copy explaining the "help build offline mode" contribution framing
- Daily retention cron in `convex/crons.ts` that deletes interactions older than 90 days
- User-facing `deleteMyTrainingData` mutation that purges all interactions for the calling user
- Export script `scripts/curation/export_training_data.py` that reads from Convex and writes JSONL
- Privacy policy update describing what is logged, how long it's kept, and how to delete it
- Logging is fire-and-forget — mutation failures never block or degrade inference

## Out of Scope

- Training a distilled local model (that's the `on-device-ai` PRD's job)
- Running QLoRA fine-tunes on the exported data
- Prompt template versioning and A/B testing infrastructure
- LLM evaluation harness (accuracy scoring, regression detection against gold labels)
- Real-time dashboards or Convex-side analytics on the logged data
- PII detection or automated redaction — we rely on the fact that LaneShadow LLM inputs are geographic/route data, not user-entered free text
- Logging for non-LLM agent tool calls (search, routing, geocoding)
- Exporting to Hugging Face Datasets or similar — JSONL on disk is enough for v1
- Multi-tenant data isolation beyond the existing Convex user scoping
- Consent UI for existing users on first app open after deploy — [DEFERRED: appetite] — v1 defaults `allowTrainingDataCollection = false` for all users and shows the toggle only in Settings; no modal prompt
- Logging cost dashboards / Convex usage alerts — [DEFERRED: appetite]
- Anonymization pipeline that strips user IDs before export — [DEFERRED: appetite] — v1 exports include `userId` field, acceptable because export artifacts stay in `.spec/training-data/` under source control access
