---
service: mobile-app
feature: UC-WHY-01
priority: P2
type: boundary
tier: holdout
scope: task-local
---

# UC-WHY-01 edge: a maximal 320-char paragraph with a hostile route name renders untruncated

A seeded row carries the worst legal payload: a full 320-character paragraph (lead sentence
at exactly 100) containing an ampersand, an em-dash, and one emoji, attached to a route
whose name runs past 90 characters. On the smallest supported device profile the paragraph
renders complete — no mid-paragraph ellipsis, no clipped last line, no horizontal overflow
— and the neighboring Summary and Scores sections keep their layout instead of being
shoved off-screen.

**Verify (e2e, real device Maestro + live Convex, seeded rows):**
- The rendered paragraph's visible text ends with the seeded final characters (proof no
  truncation occurred).
- The screen scrolls normally and the Scores section remains reachable below the why.
- No layout crash, overlap, or clipped glyphs from the emoji, em-dash, or ampersand.
