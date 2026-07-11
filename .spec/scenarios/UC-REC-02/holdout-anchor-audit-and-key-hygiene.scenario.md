---
service: convex
feature: UC-REC-02
priority: P1
type: security
tier: holdout
scope: task-local
---

# UC-REC-02 holdout: every accepted line is auditable to its anchors, and keys never leak

Two trust properties framed away from the happy path. Auditability: pick any route lever 2
accepted (e.g. Von Hoak Loop, whose description names Durant Rd → Turkey Creek Rd → Keysville
Rd around Lithia, FL) and reconstruct the acceptance from stored data alone — the persisted
`anchors[]` (query text + resolved lat/lng) plus the verification block (routedMiles,
claimedMiles, ratio, attempts, anchorCount) must be sufficient to explain why the gate
passed, without consulting any log. Every stored anchor's coordinates sit within 150 mi of
the route centroid. Key hygiene: the batch report, the per-route results, the persisted rows,
and any error recorded for a failed route contain no fragment of `ANTHROPIC_API_KEY` or
`GOOGLE_MAPS_API_KEY` — force one geocode call to fail (temporarily unset the key in a
sandbox run) and confirm the recorded failure reason describes the failure class without
echoing the request URL's key parameter.
