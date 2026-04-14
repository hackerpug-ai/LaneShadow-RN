# LLM Interaction Logging - PRD

Capture prompt/response pairs from Haiku-powered features so they can become training data, debugging evidence, and quality telemetry.

## PRD Metadata

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Appetite | 2 weeks |
| Scope Level | Core |
| Created | 2026-04-13 |
| Last Updated | 2026-04-13 |
| Enables | `on-device-ai` PRD (provides training data for distilled local model) |
| Related Research | `.spec/research/local-models/MODEL_PRUNING_MOBILE_STRATEGY_2026-04-12.md` |

## Document Index

| File | Section | Stability |
|------|---------|-----------|
| [00-overview.md](./00-overview.md) | Product description, problem, solution | PRODUCT_CONTEXT |
| [01-scope.md](./01-scope.md) | In scope / out of scope | FEATURE_SPEC |
| [02-roles.md](./02-roles.md) | User roles | PRODUCT_CONTEXT |
| [03-functional-groups.md](./03-functional-groups.md) | Functional groups overview | FEATURE_SPEC |
| [04-uc-log.md](./04-uc-log.md) | UC-LOG: Capture Infrastructure | FEATURE_SPEC |
| [05-uc-priv.md](./05-uc-priv.md) | UC-PRIV: Consent, Retention, Deletion | FEATURE_SPEC |
| [06-uc-expt.md](./06-uc-expt.md) | UC-EXPT: Training Data Export | FEATURE_SPEC |
| [07-team-contributions.md](./07-team-contributions.md) | Condensed planning synthesis | - |
| [08-technical-requirements.md](./08-technical-requirements.md) | Schema, wrapper, architecture | CONSTITUTION |

## Quick Stats

| Metric | Value |
|--------|-------|
| Functional Groups | 3 |
| Use Cases | 10 |
| System Components | 4 |
| Data Entities | 1 (`llm_interactions`) |
| Convex Functions | 3 (log mutation, delete mutation, purge cron) |

## Version History

| Version | Date | Changes | Trigger |
|---------|------|---------|---------|
| 1.0.0 | 2026-04-13 | Initial PRD | Training data gap identified during pruning strategy research |

## Next Steps

- `/kb-project-plan` — Build implementation plan
- `/trd-plan` — Generate TRD for the schema + wrapper
- `/kb-prd-plan --update "..."` — Iterate scope
