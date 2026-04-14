---
stability: FEATURE_SPEC
last_validated: 2026-04-13
prd_version: 1.0.0
functional_group: PRIV
---

# Use Cases: Privacy, Consent & Retention (PRIV)

| ID | Title | Description |
|----|-------|-------------|
| UC-PRIV-01 | Opt-in consent flag on users | Add a `allowTrainingDataCollection` boolean to the users table, defaulting to `false`, gating whether interactions are logged at all for that user. |
| UC-PRIV-02 | Settings screen toggle | Show riders a toggle in the Settings screen with honest copy explaining what the contribution does and how to withdraw it. |
| UC-PRIV-03 | Daily retention cron | Automatically delete interactions older than 90 days via a daily Convex cron. |
| UC-PRIV-04 | User-initiated deletion | Allow riders to delete all their logged interactions with one tap from Settings. |

---

## UC-PRIV-01: Opt-in consent flag on users

The `users` table gains a new boolean column that gates whether any logging happens for a given user. Default is `false` so that the rollout is opt-in.

### Acceptance Criteria

- ☐ System adds an optional `allowTrainingDataCollection` boolean field to the `users` validator in `convex/schema.ts`
- ☐ System treats missing or `false` values as "do not log" inside `loggedComplete` — the wrapper short-circuits the logging mutation when consent is not granted
- ☐ System still returns the LLM response normally when consent is missing — disabling logging never disables the feature
- ☐ System logs interactions with `userId: undefined` when there is no authenticated user in the action context, so anonymous flows never log identifying data
- ☐ Developer can flip the field manually in the Convex dashboard for test accounts
- ☐ Existing user records without the field continue to function (field is optional, default absent = no consent)

---

## UC-PRIV-02: Settings screen toggle

Riders see a toggle in the Settings screen labeled "Help build offline mode" with clear, honest copy about what's collected and how to stop.

### Acceptance Criteria

- ☐ Rider can view the "Help build offline mode" toggle in the app Settings screen
- ☐ Rider can tap the toggle to flip their `allowTrainingDataCollection` value via a Convex mutation
- ☐ Rider can read inline copy explaining: "Share the routes you plan so we can train a faster, offline assistant. No personal messages are collected — only route waypoints and AI-generated descriptions."
- ☐ Rider can tap a "Learn more" link that opens the privacy policy at the LLM-logging section
- ☐ Rider can see the current state of the toggle reflected within 500ms of tapping
- ☐ Rider sees the toggle default to OFF on first view (opt-in, never opt-out)
- ☐ System persists the toggle state across app restarts and device switches via Convex

---

## UC-PRIV-03: Daily retention cron

A Convex cron runs once per day and purges `llm_interactions` records older than 90 days, keeping the table bounded and limiting historical exposure.

### Acceptance Criteria

- ☐ System runs a new `purgeExpiredInteractions` cron defined in `convex/crons.ts` once every 24 hours
- ☐ System deletes all `llm_interactions` records where `createdAt < (Date.now() - 90 days)` during each cron run
- ☐ System batches deletions to avoid exceeding Convex mutation limits (e.g., 500 records per batch, multiple passes if needed)
- ☐ System logs the count of records purged to `console.info` after each run for observability
- ☐ Developer can adjust the retention window by changing a single constant (`RETENTION_DAYS`) in the cron file
- ☐ Existing cron jobs in `convex/crons.ts` continue to run unchanged

---

## UC-PRIV-04: User-initiated deletion

Riders can request deletion of all their logged interactions from Settings. The request is honored immediately and irreversibly.

### Acceptance Criteria

- ☐ Rider can tap a "Delete my contributed data" button in the Settings screen below the toggle
- ☐ Rider can confirm the deletion through a native confirmation dialog before any records are purged
- ☐ System exposes a `deleteMyTrainingData` public mutation that deletes all `llm_interactions` records where `userId` matches the authenticated caller
- ☐ System returns the count of deleted records to the caller so the UI can display "Deleted N records"
- ☐ System completes the deletion within 5 seconds for users with up to 10,000 logged records
- ☐ Rider sees a success toast "Your contributed data has been deleted" after the mutation returns
- ☐ System rejects the mutation with an auth error when called without an authenticated user
