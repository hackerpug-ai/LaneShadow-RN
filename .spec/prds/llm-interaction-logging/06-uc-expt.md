---
stability: FEATURE_SPEC
last_validated: 2026-04-13
prd_version: 1.0.0
functional_group: EXPT
---

# Use Cases: Training Data Export (EXPT)

| ID | Title | Description |
|----|-------|-------------|
| UC-EXPT-01 | JSONL export script | A Python script pulls interactions from Convex and writes one JSONL file per task to `.spec/training-data/`. |
| UC-EXPT-02 | Export record format | The exported JSONL records contain enough structure to re-render the prompt with a different template later. |

---

## UC-EXPT-01: JSONL export script

A new script `scripts/curation/export_training_data.py` reads `llm_interactions` from Convex and writes versioned JSONL artifacts to `.spec/training-data/{task}/YYYY-MM-DD.jsonl`, one file per task.

### Acceptance Criteria

- ☐ Developer can run `python scripts/curation/export_training_data.py` from the repo root without arguments to export all tasks with default 30-day window
- ☐ Developer can pass `--task enrichRoute` to restrict the export to a single task
- ☐ Developer can pass `--since 2026-04-01` to override the default start date
- ☐ Developer can pass `--status success` (or `fallback` / `error` / `all`) to filter by interaction status, defaulting to `success`
- ☐ System writes exports to `.spec/training-data/{task}/{YYYY-MM-DD}.jsonl` using the run date as the filename
- ☐ System creates the `.spec/training-data/{task}/` directory on demand if it does not exist
- ☐ System prints a summary line per task showing `{count} records exported to {path}`
- ☐ System reads Convex data using the existing curation MCP pattern (reuse existing auth from `scripts/curation/`)
- ☐ System exits with a non-zero code and a descriptive error when Convex is unreachable
- ☐ Developer can re-run the script idempotently — re-running the same day overwrites the day's file without errors

---

## UC-EXPT-02: Export record format

Each line of the exported JSONL is a self-contained training example with the structured context preserved, so future distillation work can re-template prompts without needing to query Convex again.

### Acceptance Criteria

- ☐ System writes one JSON object per line with fields `task`, `model`, `system_prompt`, `user_prompt`, `tool_schema`, `response`, `latency_ms`, `status`, `route_context`, and `created_at`
- ☐ System serializes `tool_schema`, `response`, and `route_context` as nested JSON objects, not stringified JSON
- ☐ System omits `user_id` from the exported records so that exports can be shared or checked into research artifacts without exposing user identifiers
- ☐ Developer can load any exported file with `jsonlines.open(path)` in Python without parse errors
- ☐ Developer can reconstruct the exact prompt Haiku saw from `system_prompt` + `user_prompt`
- ☐ Developer can reconstruct a different prompt for the same example from `route_context` + a new template function
- ☐ System ensures each exported record is under 50 KB so JSONL streaming tools don't choke on oversized lines
