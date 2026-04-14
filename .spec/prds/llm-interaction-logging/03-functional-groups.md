---
stability: FEATURE_SPEC
last_validated: 2026-04-13
prd_version: 1.0.0
---

# Functional Groups

| Group | Prefix | Description |
|-------|--------|-------------|
| **Capture Infrastructure** | LOG | The schema, internal mutation, wrapper function, and callsite migration that together record every Haiku interaction. The mechanical heart of the system. |
| **Privacy, Consent & Retention** | PRIV | User-facing consent toggle, default-off behavior, retention cron, user deletion mutation, and privacy policy updates. The trust layer. |
| **Training Data Export** | EXPT | The Python script and conventions for pulling logged interactions out of Convex as versioned JSONL artifacts ready for future distillation work. |

## Use Case Summary

| Group | Prefix | UCs |
|-------|--------|-----|
| Capture Infrastructure | LOG | 4 |
| Privacy, Consent & Retention | PRIV | 4 |
| Training Data Export | EXPT | 2 |
| **Total** | | **10** |
