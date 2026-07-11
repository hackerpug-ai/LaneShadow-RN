---
service: mobile-app
feature: UC-WHY-01
priority: P1
type: security
tier: holdout
scope: task-local
---

# UC-WHY-01 edge: the client surface never exposes enrichment internals or internal functions

An authenticated client (real Clerk identity against the real dev deployment) fetches
`getCuratedRouteDetail` for an enriched route and inspects the raw response: it must
contain only `enrichment.why` and `enrichment.generatedAt` — never `groundingFacts`, `qa`,
`status`, or `couchVerdict`. The same client then tries to call the pipeline directly —
`curatedEnrichment:coverageReport`, `upsertEnrichment`, `clearEnrichment`,
`actions/curatedEnrichment:generateForRoute` — and every call is rejected: these are
internal functions with no public wrapper, unreachable from the client SDK.

**Verify (integration, real dev deployment, real client credentials):**
- The raw response JSON's enrichment sub-object has exactly the two allowed keys and
  nothing else.
- Each internal-function invocation from the client errors as non-public; afterwards no
  row or status changed.
- The enrichment sub-object stays under ~1 KB on the wire.
