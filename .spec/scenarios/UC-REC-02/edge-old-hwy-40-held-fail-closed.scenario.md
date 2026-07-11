---
service: convex
feature: UC-REC-02
priority: P1
type: error_handling
tier: holdout
scope: task-local
---

# UC-REC-02 edge: the route the PoC could NOT fix stays out of the catalog

Old Hwy 40 Cisco Grove → Donner Lake (claimed 16 mi) is the PoC's documented failure case:
the first reconstruction routed 91.7 miles (a POI anchor geocoded badly and the router
detoured), the repair round improved it to 25.9 miles — closer, but still outside the 0.6–1.6
band — and the gate held it. Re-running the productionized pipeline on this real route must
reproduce the *shape* of that outcome, whatever the LLM does this time: either it genuinely
passes the gate (fine — persisted as `generated` with a ratio the verification block proves),
or it exhausts its 2-attempt budget and lands in `review` with both attempts' routed lengths
recorded and NO side-table geometry marked servable. What must never exist afterward is a
`generated` row for this route whose stored ratio falls outside the band, or a third LLM
attempt anywhere in the logs. The 25.9-mile near-miss is precisely the wrong-but-plausible
line the product must refuse to ship.
