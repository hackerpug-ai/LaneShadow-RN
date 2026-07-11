---
service: convex
feature: UC-QUAL-02
priority: P2
type: boundary
tier: holdout
scope: task-local
---

# UC-QUAL-02 edge: the length budget is exact at its edges and counts characters honestly

Boundary probes on the format rules, with fixtures built to the character: a 320-char
paragraph passes and a 321-char one fails; a lead sentence of exactly 100 chars passes and
101 fails; a paragraph whose only oddity is a trailing newline is not misread as two
paragraphs; an emoji or accented character counts as one character, not its UTF-8 byte
width; and the fixture "Rte. 39 climbs hard out of the valley…" must not fool the
lead-sentence detector into measuring a 7-char lead at the abbreviation's period.

**Verify (vitest unit; UNIT_TEST_JUSTIFIED — pure string logic, zero I/O):**
- Exact-length fixtures at 319/320/321 chars → pass/pass/fail; leads at 99/100/101 →
  pass/pass/fail.
- "⛰️"- and "é"-bearing fixtures are counted per the documented character-counting rule,
  probed one character below and one above the cap.
- The trailing-newline fixture passes; the abbreviation fixture measures the full first
  sentence.
