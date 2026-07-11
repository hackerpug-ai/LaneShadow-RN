---
service: mobile
feature: UC-SURF-04
priority: P1
type: error_handling
tier: holdout
scope: task-local
---

# UC-SURF-04 edge: absence honesty when location permission is denied or arrives late

Deny location permission entirely and open the app fresh. The discovery row cannot know
"nearby", so whatever it shows must not claim proximity: either the labeled top-rated
national set (the label copy still true — nothing is "nearby" when nowhere is known) or an
honest prompt tied to the missing permission, but never unlabeled distant pills implying
they're local, and never a distance suffix computed from a null location. Then the slow-GPS
case: the app opens, national fallback renders with its label, and eight seconds later a
location fix lands revealing three genuinely-nearby rider-ready routes. The row must swap to
the nearby results and — critically — drop the "No routes nearby" label; a stale fallback
label sitting above genuinely-nearby pills is a lie in the other direction. The swap
announces politely to screen readers both times, and rapid permission toggling
(denied → granted → denied within a session) never strands the row in a mixed state where
label and pills disagree about what the rider is looking at.
