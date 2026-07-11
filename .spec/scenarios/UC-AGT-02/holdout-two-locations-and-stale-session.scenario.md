---
service: convex
feature: UC-AGT-02
priority: P2
type: edge_case
tier: holdout
scope: task-local
---

# UC-AGT-02 holdout: named places beat stale session pins, and two places force a choice

Two grounding ambiguities the visible ACs never name.

First, staleness: the rider's session location was captured hours ago in Salt Lake City, but
the new message says "find me twisties up in Logan." A named place in the utterance must WIN
over the stored session pin — the captured `searchCuratedRoutes` center must sit near Logan
(≈41.73, -111.83), not SLC — and the reply must make the anchor explicit ("near Logan")
so the rider can correct it if they meant something else. The stale pin is context, never a
silent override.

Second, two anchors in one message: "somewhere between Ogden and Provo." The agent must not
silently average the coordinates into a center in the middle of the Great Salt Lake
suburbs and present it as either city. Acceptable behaviors are explicit: search a corridor
midpoint and SAY that's what it did ("centering between Ogden and Provo, about Salt Lake
City"), or ask which end the ride should start from. Unacceptable: a reply anchored on one
city while claiming the other, or results whose stated distances are measured from an anchor
the reply never names.

Verify from captured tool args + reply text on the dev deployment: the Logan turn's center
is Logan; the two-anchor turn's reply names the anchor its distances are measured from, and
every stated distance recomputes correctly from that named anchor.
