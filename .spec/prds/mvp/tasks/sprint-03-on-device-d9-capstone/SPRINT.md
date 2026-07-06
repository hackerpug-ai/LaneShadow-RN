---
sprint: 3
title: On-Device D9 Capstone
sequence: 3
timeline: Phase 3
status: Execution
---

# Sprint 3: On-Device D9 Capstone

**Sequence:** 3
**Timeline:** Phase 3
**Status:** Execution
**Proposed by:** react-native-ui-planner

> Generated JIT from [ROADMAP.md](../../ROADMAP.md) by /kb-sprint-tasks-plan. Re-pointed for v3.0.0 from the "map + chat home" to the canonical route plan view discovery surface (no separate Discover screen). This is the terminal sprint — the MVP "done" gate.

> ✅ **EXPANSION COMPLETE.** 1 task expanded to `TASK-*.md`. Specialist authorship: DISC-007 proposed by `react-native-ui-implementer` **standing in as the RN planning specialist** — the nominal `react-native-ui-planner` agent is non-responsive in this harness (3 consecutive empty `state:completed` bodies per Sprint 02 record), so the RN domain implementer authored the task JSON per the domain-specialist rule (every task carries an honest `Proposed By:`). ROADMAP.md Sprint 03 status → In Progress. Run with `/kb-run-sprint tasks/sprint-03-on-device-d9-capstone`.

---

## Overview

The terminal sprint. The founder completes the entire discover-to-ride journey on the **route plan view** on a real iPhone **and** a real Android phone against live Convex — open the app to the plan view (no separate Discover screen), discover a road via the curated suggestion cards over the input and/or by chatting (including at least one state-scoped request), tap a route to its detail, understand its scores/geometry/conditions, save it, reopen it from Saved, and hand off to maps to ride it — with recorded per-platform evidence and no mocks. Any platform-specific issues discovered during the journey are surfaced and fixed. This is what "done" means.

All upstream work (Sprint 01 discovery behavior + Sprint 02 detail/save/ride-it) is pre-verified and must be complete before this sprint executes. The single task (DISC-007) is the cross-cutting integration capstone — it verifies the whole arc.

---

## Human Test Deliverable

The founder completes the entire discover-to-ride journey on the route plan view on a real iPhone **and** a real Android phone against live Convex, with recorded evidence and no mocks.

**Test Steps:**
1. Build and run the app on a real iOS device pointed at live Convex, and confirm it opens directly to the route plan view with no separate Discover screen.
2. On iOS, find 5 roads you have never ridden in a region you actually ride — using the curated suggestion cards over the input (tap-to-plot) AND by chatting (e.g. "twisties near Asheville"); include at least one state-scoped request (e.g. "twisties in North Carolina") and confirm matching curated routes are returned and plotted, verifying browse-by-state intent survives conversationally.
3. On iOS, tap an earlier curated-route card to re-render it on the map (returning to map view), then tap the route to open its detail — confirm its score bars, geometry-or-centroid, and conditions; save it; reopen it from Saved; and tap Ride It to hand off to Apple Maps.
4. Repeat the entire journey on a real Android device, confirming the Google Maps handoff and the browser fallback when Google Maps is unavailable.
5. Record video or screenshot evidence of the complete arc on both platforms.
6. *(Post-gate reflection — NOT required to mark the sprint complete):* actually ride at least one discovered road within two weeks and note whether the surfaced ranking matched your own judgment (input to the post-MVP scoring-calibration fast-follow).

---

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| DISC-007 | D9 on-device capstone: verify the full discover-to-ride arc on the route plan view on real iOS and real Android against live Convex; surface and fix platform-specific issues; record per-platform evidence; founder dogfood | react-native-ui-implementer | 240 min |

---

## Human Testing Gate

**Gate:** The founder completes the entire discover-to-ride journey on the route plan view on a real iPhone **and** a real Android phone against live Convex — open the app to the plan view (no separate Discover screen), discover a road via the curated suggestion cards over the input and/or by chatting (including at least one state-scoped request), tap a route to its detail, understand its scores/geometry/conditions, save it, reopen it from Saved, and hand off to maps to ride it — with recorded per-platform evidence and no mocks. This is what "done" means.

---

## Source Coverage

- UC-DISC-01 (full discover-to-ride journey on a real device — on the route plan view) → DISC-007
- e2e criteria: T-DISC-001 (the D9 capstone human-gate full arc) + supporting human-gates T-DTL-004, T-SAVE-002 ([10-e2e-testing-criteria.md](../../10-e2e-testing-criteria.md))

## Capability Coverage

- discover-to-ride-journey: the cross-cutting capstone integrating every prior seam — plan-view landing, curated suggestion cards (tap-to-plot), chat-driven curated discovery, card→map render, detail, save+reopen, maps handoff — verified on real iOS + real Android against live Convex with no mocks (DISC-007). Satisfies the project iron rule: integration/E2E against real services is the primary acceptance bar.

---

## Blocks

- None (terminal sprint — the MVP "done" gate)

## Dependencies

- Dependent on: Sprint 01 (plan-view discovery: suggestion cards over the input, chat-driven curated discovery, card→map loop, no-separate-screen contract, footer chat button) AND Sprint 02 (curated route detail including score bars + geometry graceful degradation + weather, save via curatedRouteRef + Saved-screen reopen, Ride-It maps deep-link with web fallback).
- No intra-sprint ordering (single task).

## Task Detail Files

Generated by /kb-sprint-tasks-plan on 2026-07-06

- DISC-007-d9-on-device-capstone-verify-full-discover-to-ride-arc.md
