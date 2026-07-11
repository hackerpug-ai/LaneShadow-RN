---
service: convex
feature: UC-REC-04
priority: P1
type: error_handling
tier: holdout
scope: task-local
---

# UC-REC-04 holdout: a provider outage mid-batch halts the run, never fakes progress

Simulate the failure the FIX-001 posture exists for: partway through a lever-2 batch the LLM
provider (or Google) starts erroring on every call — expired key in a sandbox run, or a real
outage. The batch must not (a) mark those routes `generated` with any placeholder or stale
line, (b) mark them `failed` permanently as if the routes themselves were bad, or (c) grind
through the remaining hundreds of routes burning a failed call on each. After N consecutive
provider errors the batch halts with an explicit halt reason and a resumable cursor; the
routes hit during the outage remain eligible for the next run; the report distinguishes
provider-halt from route-level failure. When the key/provider is restored, resuming the same
command completes the batch, and the final per-route states are indistinguishable from a run
that never saw the outage.
