---
service: convex
feature: UC-REC-03
priority: P1
type: edge_case
tier: holdout
scope: task-local
---

# UC-REC-03 holdout: rescue-first means Route 680 gets its line — and still never gets suggested

The rescue-first decision says even FHWA freeway-inventory rows get geometry attempts before
anyone considers retiring them. Run lever 3 on "Route 680--Alameda County" (15 claimed miles,
empty description, a commuter freeway): the parser reads the highway ref, geocoding resolves
the corridor locally, and a routed line may well PASS the gate — I-680 through Alameda County
is a real, mappable road. The persisted outcome is a `generated` row with
`provenance='name_routed'` and honest verification numbers. The trap this scenario guards:
that line must NOT make the route a suggestion. Its fate rests with the ride-worthiness
classifier and the rider-ready composition — with a `not_a_ride` verdict the row keeps
`riderReady=false` and appears in no discovery, browse, or carousel result, while its
geometry remains stored, auditable, and available if a founder ever overrides. Geometry
success and suggestion-worthiness are independent judgments, and this row proves the system
keeps them apart.
