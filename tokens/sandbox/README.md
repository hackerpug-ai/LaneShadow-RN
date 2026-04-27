# Sandbox Tokens & Parity

This directory contains sandbox infrastructure for cross-platform visual regression testing.

## Device Geometry & Parity Diffs

iOS snapshots are captured on **iPhone 16** (375x667 pt), Android snapshots on **Pixel 5** (393x851 dp). These are the per-platform standard profiles and intentionally differ in aspect ratio and resolution.

**Geometric diffs are expected noise.** Spacing, sizing, and layout differences arising from aspect ratio / resolution variance are not real platform divergences.

**Actionable diffs** (these indicate bugs):
- Missing UI elements on one platform
- Elements in wrong order or wrong hierarchy
- Wrong colors (not using theme tokens)
- Missing or incorrect text content

**Non-actionable diffs** (expected from device geometry):
- Padding/margin differences from density-independent unit rounding
- Font size differences from Dynamic Type / font scaling defaults
- Layout reflow from different available widths (375 vs 393 dp)

When reviewing the parity report (`pnpm snapshots:parity-report`), focus on structural and semantic differences, not pixel-perfect geometric matching.
