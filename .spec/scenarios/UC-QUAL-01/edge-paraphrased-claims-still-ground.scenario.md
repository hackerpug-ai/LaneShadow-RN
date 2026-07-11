---
service: convex
feature: UC-QUAL-01
priority: P2
type: edge_case
tier: holdout
scope: task-local
---

# UC-QUAL-01 edge: paraphrase and compound phrasing ground to facts — no literal string matching

Hand-built `generated` rows probe the verifier's mapping quality rather than its memory of
the happy path: "almost forty miles" over `lengthMiles: 38.7`; "a corkscrew of blind crests
far from anywhere" over a high curvature score plus a high remoteness score (one compound
clause, two facts). These are grounded claims wearing different words, and the verifier
must resolve them to their supporting facts instead of flagging them for failing a literal
match. Symmetrically, it must not rubber-stamp a near-miss: "well over fifty miles" on the
same 38.7-mile route is unsupported.

**Verify (pipeline acceptance, real dev deployment + real OpenAI verifier; flake policy —
one retry max on provider-network failure):**
- The paraphrase row and the compound row → `qa_passed`, with each claim's `sourceFact`
  naming the length/score facts.
- The near-miss row → `qa_failed` with the length claim recorded as unsupported.
- Cleanup removes the hand-built rows.
