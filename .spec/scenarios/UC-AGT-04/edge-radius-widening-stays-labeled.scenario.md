---
service: convex
feature: UC-AGT-04
priority: P1
type: edge_case
tier: holdout
scope: task-local
---

# UC-AGT-04 edge: "anything a bit farther?" widens the circle without moving the goalposts

The rider got two honest suggestions within 50 miles and pushes: "what about a bit farther
out? I don't mind a ride to the ride." The agent may widen — that is the correct move — but
the widening must stay visible. The follow-up search's captured args show a larger
`radiusMi` (e.g. 100–150), the reply says it widened ("looking out to about 120 miles"),
and every new suggestion still carries its distance. The 170-mi Capitol-Reef-class route may
NOW legitimately appear — at 170 miles with a widened, stated radius — and that is honest;
what remains forbidden is presenting it without its distance or re-anchoring the language
back to "near Ogden."

The inverse pressure also holds: after widening, the rider says "actually keep it close."
The next search must shrink back (captured `radiusMi` returns to the default band), and
previously-offered far routes must not linger in new replies as if they were local.

Verify from captured tool args across the three turns (50 → widened → narrow again) and
reply-text grading: radius monotonicity matches the rider's asks, every distance stated,
zero "near" claims for beyond-current-radius routes in any turn.
