---
service: convex
feature: UC-AGT-02
priority: P1
type: edge_case
tier: holdout
scope: task-local
---

# UC-AGT-02 edge: the other Riverdale — same-name places must not teleport the search

The catalog audit found "Riverdale Road" entries in multiple states, and the US has a
Riverdale in Utah, New Jersey, Georgia, and a dozen other states. A rider whose session
location is in the Salt Lake valley asks for "something fun out by Riverdale." The geocoder,
asked without bias, could legally return Riverdale, NJ. The agent must geocode with the
session-location bias so the resolved center lands on Riverdale, UT (a few miles from
Ogden), and the captured `searchCuratedRoutes` center must be within ~20 mi of the rider —
not 2,000 mi east. If the geocoder still returns a far-off candidate (bias miss), the
region contradiction (resolved center vs session location) must surface as a clarifying
question naming both interpretations ("Riverdale near you in Utah, or Riverdale, New
Jersey?"), never as a silent cross-country search.

A second wrinkle: the rider follows up "no, the one in Georgia." The agent must honor the
explicit correction — the named state overrides both the bias and the session location — and
the reply must present Georgia results labeled with their distances from Riverdale, GA,
without pretending they are near the rider.

Verify with real geocoding on the dev deployment: captured centers for both turns land in
the correct states, and no reply describes a cross-country route as nearby.
