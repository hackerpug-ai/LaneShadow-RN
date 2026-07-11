---
service: convex
feature: UC-LIFE-02
priority: P1
type: security
tier: holdout
scope: task-local
---

# UC-LIFE-02 edge: no client-reachable path can trigger regeneration or model spend

Regeneration moves real money (model tokens) and mutates the catalog, so it must be
operator-only. An authenticated mobile client (real Clerk identity, real dev deployment)
attempts every regeneration surface directly through the client SDK: `generateForRoute`,
`backfill`, `clearEnrichment`, `patchEnrichmentStatus`, and the QA action. Every attempt
must be rejected — these are internal functions with no public wrapper — and afterwards
the table shows zero new rows, zero status changes, and zero model calls made on the
client's behalf. The only client-callable enrichment surface is the read-only detail
query.

**Verify (integration, real dev deployment, real client credentials):**
- Each invocation from the client SDK errors as non-public; no partial effects occur.
- Row count and every row's `generatedAt`/`status` are unchanged after the attempts.
- `getCuratedRouteDetail` remains callable and read-only for the same identity.
