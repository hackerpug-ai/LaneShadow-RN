---
service: convex
feature: UC-QUAL-02
priority: P1
type: security
tier: holdout
scope: task-local
---

# UC-QUAL-02 edge: homoglyph and zero-width tricks cannot smuggle banned content past the gate

Adversarial paragraphs try to slip forbidden content past pattern matching: "wоrld's bеst"
spelled with Cyrillic о/е, "must-​ride" split by a zero-width space, and a markdown link
(`[map](https://evil.example)`) embedded mid-sentence. None of these may ever reach
`qa_passed`: normalized lint matching catches the lookalikes, link/markup syntax violates
the plain-single-paragraph format either way, and whatever slips past the regex layer must
still die at the cross-provider verifier, which judges semantics rather than bytes. The
two-layer gate is judged as a system — evading the regex is not evading the gate.

**Verify (vitest unit + pipeline acceptance, real dev deployment + real OpenAI verifier):**
- Unit: normalized matching flags the Cyrillic and zero-width variants; markup syntax
  trips the format rule.
- Integration: rows seeded with each adversarial paragraph all end `qa_failed` with the
  offending content recorded.
- `getCuratedRouteDetail` never serves any of them.
