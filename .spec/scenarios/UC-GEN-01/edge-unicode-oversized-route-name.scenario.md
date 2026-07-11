---
service: convex
feature: UC-GEN-01
priority: P2
type: boundary
tier: holdout
scope: task-local
---

# UC-GEN-01 edge: unicode-weird and oversized route names survive generation intact

A synthetic curated route is seeded with a hostile name — 180 characters mixing diacritics,
an emoji, and RTL text (e.g. "Þjóðvegur 939 — Öxi Pass ⛰️ درب الجبل …") — plus ordinary
scores and trustworthy geometry. Generation must neither crash nor blow the budget: the
320-char cap holds on the final paragraph even though the name alone would eat more than
half of it, the name is never truncated mid-character inside the paragraph, and the stored
grounding snapshot round-trips the name exactly as seeded. The synthetic route is removed
afterwards.

**Verify (pipeline acceptance, real dev deployment + real GLM-5.2):**
- `generateForRoute` on the seeded route completes with a valid row or an honest
  `abstained`/`failed` state — never a crash, never a >320-char paragraph.
- `groundingFacts.structured` stores the name byte-for-byte (no mojibake, no lost RTL
  segment).
- Length enforcement counts unicode characters, not UTF-8 bytes: a 319-char paragraph
  containing the emoji passes; a 321-char one fails.
- Cleanup deletes the synthetic route and any row it produced.
