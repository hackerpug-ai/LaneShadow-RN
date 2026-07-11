---
stability: FEATURE_SPEC
last_validated: 2026-07-11
prd_version: 3.1.0
functional_group: VER
---

# Use Cases: Verification & Review (VER)

| ID | Title | Description |
|----|-------|-------------|
| UC-VER-01 | Enforce the deterministic geometry gate | One gate owns admission for ALL geometry going forward |
| UC-VER-02 | Run the bounded LLM repair round | ≤2 attempts with failure-evidence feedback, then REVIEW |
| UC-VER-03 | Classify ride-worthiness across the whole catalog | Cross-provider LLM verdict stored as evidence |
| UC-VER-04 | Hold gate failures in a REVIEW queue | Fail-closed queue with founder dispositions |
| UC-VER-05 | Gate the full batch on a founder couch-sample | ~25-route human gate before the full run (R2 pattern) |

> **Ownership note:** the gate is *specified* here (UC-VER-01) and *invoked* by every REC
> lever — implementers must treat VER-01's pure gate module as the single source of truth,
> never re-implement it per lever.

---

## UC-VER-01: Enforce the deterministic geometry gate

Every geometry any lever produces must pass one deterministic gate before storage; the gate
is a pure module reused from the proven PoC, applied to all geometry going forward.

Acceptance Criteria:
- ☐ System computes ratio = routed length / claimed length and admits geometry only when the ratio is within 0.6–1.6.
- ☐ System requires at least 2 geocoded anchors, each within 150 miles of the route centroid, before admitting reconstructed or re-routed geometry.
- ☐ System rejects degenerate geometry with 4 or fewer points or fewer than 1 point per mile.
- ☐ System applies the same gate to all geometry going forward, including re-evaluation of pre-existing rows, not only newly generated geometry.
- ☐ System skips the ratio check in favor of the degenerate + region checks when the claimed length is quarantined (null/outlier), letting the routed length become the stored truth.
- ☐ Founder-Operator can see, for any rejected route, which gate condition it failed.

---

## UC-VER-02: Run the bounded LLM repair round

A gate-failing reconstruction gets a bounded repair: the geocode log and measured lengths
feed back to the LLM once, and still-failing routes go to REVIEW — proven in the PoC where
Old Hwy 40 improved 91.7 → 25.9 mi yet was still held.

Acceptance Criteria:
- ☐ System feeds the geocode log and measured lengths back to the LLM for a repair attempt when the first reconstruction fails the gate.
- ☐ System limits total reconstruction attempts to 2 per route and never exceeds that budget.
- ☐ System accepts a repaired geometry only if it then passes the deterministic gate, keeping the better of the two attempts by ratio distance.
- ☐ System routes a route that still fails after 2 attempts to the REVIEW queue rather than storing its geometry as servable.
- ☐ Founder-Operator can observe, for a repair-round route, both attempts' measured lengths and the gate verdict on each.

---

## UC-VER-03: Classify ride-worthiness across the whole catalog

An LLM classifier judges "is this actually a motorcycle ride?" over the entire catalog —
rescue-first means even FHWA freeway segments get geometry attempts, but a freeway can still
never become a suggestion.

Acceptance Criteria:
- ☐ System runs the ride-worthiness classifier over every route in the catalog, including FHWA freeway segments and recovered rows.
- ☐ System records a ride-worthiness verdict (`ride` / `marginal` / `not_a_ride`) with a reason per route that feeds the rider-ready flag.
- ☐ System withholds rider-ready status from a route the classifier judges `not_a_ride` even when that route has valid geometry.
- ☐ System runs the classifier on a different LLM provider than anchor extraction to decorrelate blind spots.
- ☐ System stores the verdict as recorded evidence on the route, not as a transient read-time decision, and a `marginal` verdict never auto-retires a route.
- ☐ Founder-Operator can review the classifier's verdict and rationale for any route.

---

## UC-VER-04: Hold gate failures in a REVIEW queue

Routes that fail the gate after their repair budget land in a REVIEW queue with honest
rider-side absence; the founder adjudicates each with a recorded disposition.

Acceptance Criteria:
- ☐ System places every route that fails the gate after its attempt budget into the REVIEW queue, including routes whose lever produced no candidate line at all.
- ☐ System keeps a REVIEW-queued route out of the rider-ready surface until it is resolved.
- ☐ Founder-Operator can list the REVIEW queue with each route's failure reason and best candidate geometry when one exists.
- ☐ Founder-Operator can accept, send back for retry, or route to retirement any REVIEW item.
- ☐ System records the founder's disposition on each REVIEW item so the decision is auditable.

---

## UC-VER-05: Gate the full batch on a founder couch-sample

Before the full batch, the founder couch-tests a ~25-route sample stratified across all three
provenance types; the full run is blocked until the sample verdict is recorded as pass.

Acceptance Criteria:
- ☐ System assembles a representative ~25-route couch-sample spanning all three provenance types and a range of reconstruction difficulty before the full batch runs.
- ☐ Founder-Operator can review each sampled route's recovered line rendered on a map alongside its provenance and measured-vs-claimed lengths in one pass.
- ☐ Founder-Operator can record a per-route verdict (true / off / wrong) and an overall pass or fail on the couch-sample.
- ☐ System blocks the full batch from committing while the couch-sample verdict is unrecorded or failed, and a single `wrong` (fabricated-but-passing line) forces a failed verdict.
- ☐ Founder-Operator can trigger the full batch only after the couch-sample verdict is recorded as pass.
- ☐ Founder-Operator can review the post-hygiene, post-gate **top-50 routes by composite rank** (the surface a rider hits first) for correct road, plausible length, no duplicate headliners, and no test/seed rows — FOUNDER-BAR T2 — as a check independent of the provenance-stratified ~25-route couch sample, so a wrong-road or duplicate survivor on the first surface cannot pass unseen.
