---
service: convex
feature: UC-VER-02
priority: P1
type: edge_case
tier: holdout
scope: task-local
---

# UC-VER-02 edge: a repair that lands exactly where the first attempt did

Consider a route where the repair attempt produces the same ratio as the first attempt — say
both route to 2.1× claimed because the description genuinely describes a longer ride than the
stored mileage. The "keep the better attempt" rule has no better attempt to keep; the engine
must still terminate at two attempts, store one candidate deterministically (not neither, not
both), and the stored attempt count must read 2. Separately, when the first attempt fails not
on ratio but because only one anchor survived geocoding, the repair prompt the LLM receives
must say so — feeding back an empty routed length rather than a fabricated one — and if the
repair then yields a passing route, the final state is `generated` with `attempts=2` and the
success is indistinguishable in shape from a first-try pass except for the attempt counter.
Nothing about a repaired success may mark the route as second-class: same provenance value,
same rider-ready eligibility.
