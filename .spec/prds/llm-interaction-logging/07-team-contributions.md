# Team Contributions

This PRD was synthesized in conversation from a live thread between Justin and Claude (Opus 4.6) on 2026-04-13, rather than spawning a full multi-agent planning team. The originating discussion walked through the local-LLM pruning strategy research, rejected aggressive MoE pruning as overkill for the 2026 lifestyle roadmap, and converged on Haiku-distillation as the winning path — which in turn surfaced "we have no training data pipeline" as the blocking gap. This PRD captures the solution to that gap.

## Phase 1: User Personas (condensed)

**Personas considered:**
- **Rider (primary)** — Plans rides in the LaneShadow app, generates LLM calls as a side-effect of use, cares about privacy and battery, not about ML
- **Developer (Justin)** — Wants training data, debugging evidence, and quality telemetry; is the only consumer of the export pipeline
- **Privacy auditor (Justin)** — Same person, different hat; needs to be able to answer "what exactly are we collecting?" honestly

**Key insight:** The rider persona never interacts with the logging subsystem directly except via the consent toggle. The failure mode to avoid is making them feel surveilled. The "help build offline mode" contribution frame reframes the exchange as generosity rather than extraction, and the opt-in default, the delete button, and the Settings visibility are the concrete trust mechanisms.

## Phase 2: Architecture (condensed)

**Components identified:**
1. **`llm_interactions` table** — single source of truth, indexed by task+status and createdAt
2. **`loggedComplete` wrapper** — thin functional wrapper around `pi-ai`'s `complete()`, drop-in compatible
3. **`logInteraction` internal mutation** — server-only write path
4. **`purgeExpiredInteractions` cron** — deterministic retention enforcement
5. **`export_training_data.py`** — Python script using existing curation MCP auth

**Architectural principle:** The logging layer is additive and removable. If it misbehaves, ripping it out does not break inference — `loggedComplete` can be replaced with `complete` at every callsite in one commit and the app keeps working. This is deliberate: data plumbing should never degrade the primary product loop.

**Boundary between deterministic and probabilistic:** Per the global deterministic-vs-probabilistic rule, everything in this PRD is deterministic. The agent produces the prompt and the response (probabilistic); the wrapper records it (deterministic). The wrapper is an instrumentation boundary — agents have no agency over whether logging happens.

## Phase 3: UI Infrastructure (condensed)

**Minimal UI footprint** — one toggle, one button, one link. No new screens, no new navigation, no new design tokens.

- **Toggle component:** Reuse existing Settings toggle pattern from the current Settings screen. No new design work needed.
- **Deletion button:** Destructive-style button (red text or outlined red per existing theme), triggers a native `Alert.alert` confirmation before firing the mutation.
- **Copy:** Plain, honest, no marketing language. Two sentences max in the toggle description.
- **Link to privacy policy:** Standard text link opening a WebView or in-app browser, pointed at a new anchor `#llm-logging` in the privacy policy doc.

**Deferred to later cycles:** In-app dashboard showing "N records contributed," export visualizations for riders, gamification of contribution.

## Phase 4: Holdout Scenarios

Holdout scenarios for each use case should be generated via `/kb-project-groom` or `/kb-prd-refine` in a follow-up pass. Seed scenarios to consider:

- **UC-LOG-03 security:** What happens if `complete()` throws a synchronous error before the timer starts? (Answer: logging should capture it with `latencyMs: 0` and `status: 'error'`.)
- **UC-LOG-03 edge case:** What if the user is anonymous and there is no `ctx.auth.getUserIdentity()` result? (Answer: log with `userId: undefined`, never block on auth.)
- **UC-PRIV-01 security:** What if someone client-side tries to write to `llm_interactions` directly? (Answer: the mutation is internal, so this is structurally prevented, but verify in test.)
- **UC-PRIV-03 edge case:** What if a cron run deletes millions of records and times out mid-batch? (Answer: batch in 500s, idempotent, next run continues.)
- **UC-PRIV-04 security:** What if a user tries to delete another user's data via a crafted call? (Answer: the mutation filters by `ctx.auth` identity, not a client-supplied userId.)
- **UC-EXPT-01 edge case:** What if the Convex query returns zero records for the window? (Answer: create empty file, print "0 records exported," exit 0.)

## Decision Log

| Decision | Rationale |
|----------|-----------|
| Opt-in default, not opt-out | Trust matters more than dataset size for a lifestyle community product |
| 90-day retention, not indefinite | Minimizes historical exposure while covering typical train-and-evaluate windows |
| Fire-and-forget logging | Inference must never degrade for instrumentation reasons — data plumbing is subordinate |
| JSONL export, not live training hooks | Keep training infrastructure out of prod; batch-export is simpler and less risky |
| No PII redaction pipeline v1 | LaneShadow LLM inputs are geographic, not free text — this is an informed accept-risk |
| Drop `loggedComplete` at all four micro-tasks in one sprint | `enrichRoute` handles all four in a single tool call, so callsite migration is actually one callsite — no multi-site coordination needed |
| No consent prompt on first-launch for existing users | Appetite cut — Settings-only discovery is acceptable for v1 because the feature is off by default for everyone |
