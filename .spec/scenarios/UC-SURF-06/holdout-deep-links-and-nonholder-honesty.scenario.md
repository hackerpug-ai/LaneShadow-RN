---
service: convex
feature: UC-SURF-06
priority: P1
type: security
tier: holdout
scope: task-local
---

# UC-SURF-06 holdout: crafted deep links resolve honestly without leaking pipeline judgments

The reachability guarantee must not become an enumeration oracle. Using a real authenticated
session, resolve `getCuratedRouteDetail` directly (the deep-link path — no saved-route
relationship required by the current contract) against four crafted routeIds: a retired
route, a review-held route, a duplicate shadow, and a routeId that never existed. Whatever
policy ships for non-holders, it must be consistent and honest: the nonexistent id and any
intentionally-hidden row must not be distinguishable in a way that leaks pipeline judgments
(e.g. an error body that says "retired: not a real ride" to an arbitrary caller), while a
rider with the route saved still gets her guaranteed resolution. The shadow must redirect to
its canonical rather than exposing two live copies of Cherohala Skyway via id guessing. And
across all four probes, the response must never include operator-only fields — failure
reasons, couch verdicts, classifier rationale, retirement reasons — regardless of
authentication state. The rider-facing contract stays: real line, honest absence, or clean
not-found; the pipeline's opinions remain internal.
