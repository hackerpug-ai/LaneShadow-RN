---
service: convex
feature: UC-AGT-03
priority: P2
type: edge_case
tier: holdout
scope: task-local
---

# UC-AGT-03 holdout: a question is a scalpel, not a shrug

The interrogation policy can be satisfied in letter and violated in spirit: "Can you
clarify?" is one question, but it is useless. This holdout grades question QUALITY and
loop-freedom across a batch of ambiguous fixtures replayed through the eval harness.

For each ambiguous fixture (no location; unmappable ride type "something that slaps";
contradictory constraints "a long short ride"), the single clarifying question must name the
specific missing or contradictory slot — a location question names location, an archetype
question offers concrete ride-type choices ("twisty canyon, scenic cruise, or dirt?"), a
contradiction question names the contradiction ("long or short — which matters more?").
Generic clarifications ("could you tell me more?") fail the grade.

Loop-freedom: feed the agent a fixture where the rider's answer to question one is itself
ambiguous in a NEW dimension (answered location, but the ride type is still unmappable). The
agent may ask its one question for the new turn — but replaying five such turns must never
show the same slot asked about twice, and by the third turn the agent must have produced at
least one concrete, honestly-labeled suggestion set rather than a pure question chain.

Verify via `pnpm agent:eval` over the ambiguity fixture set: grader asserts slot-specificity
(question text references the missing slot's domain), no repeated-slot questions, and
suggestion-by-turn-three across every fixture.
