---
service: mobile-app
feature: UC-DTL-02
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-DTL-02 core: ScoreDimensionBar renders a 0–1 float as a labeled percentage bar

The `ScoreDimensionBar` component converts a 0–1 float to a horizontal bar with a label on
the left ("Scenic"), a fill width of `score × 100%`, copper fill on an inset track, and the
percentage value on the right ("74%"). The composite renders as `Math.round(composite × 100)
+ '/100'` above the five bars.

**Verify (integration, live Convex dev → rendered component):**
- For score 0.74, the bar fill width is 74% of the track and the right label reads "74%".
- The composite renders as e.g. "82/100" in title-lg above the five bars.
- Bar fill uses copper-500 (#EE7C2B); track uses surface.inset; pill border-radius.
