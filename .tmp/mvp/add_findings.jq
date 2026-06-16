.findings += [
  {
    "id": "RF-018",
    "severity": "MEDIUM",
    "confidence": "LOW",
    "dimension": "consistency",
    "target": "09-routing.md line 18 (Route Map table, curated route detail row) — LOCKED SOURCE",
    "summary": "Locked source 09-routing.md entry condition for curated route detail references the deleted Discover screen ('Tap a pin or list row on Discover'), inconsistent with DELTA-001 which re-homed discovery to the map/chat home.",
    "evidence": "09-routing.md line 18 entry condition predates DELTA-001. The v2.0.0 Route Delta correctly deletes discover.tsx, but the v1.0.0 Route Map table retains the stale entry condition.",
    "proposed_fix": "Update 09-routing.md entry condition to 'Tap a pin on the home map or a curated route card in the chat history' to reflect DELTA-001 reality. (Requires PRD edit — outside ROADMAP scope.)",
    "raised_by": ["code-reviewer#rev-c2"],
    "status": "upstream-escalated",
    "is_upstream": true,
    "first_cycle": 2,
    "reopened_count": 0
  },
  {
    "id": "RF-019",
    "severity": "CRITICAL",
    "confidence": "LOW",
    "dimension": "missed-task",
    "target": "sprint-01 DISC-012 + sprint-03 capstone gate step 3",
    "summary": "Sprint 03 capstone gate step 3 says 'tap a curated route card/pin to open its detail', but DISC-012 only wires card→map re-render and DTL-001 only wires pin→detail. The 'card' path to detail is ambiguous — either card taps must open detail directly, or the capstone gate must clarify the card→map→pin flow.",
    "evidence": "Sprint 01 gate step 5: 'tap an earlier curated-route card, and observe it re-render on the map and return you to map view' (card → map). Sprint 03 gate step 3: 'tap a curated route card/pin to open its detail' (card/pin → detail). DISC-012 task brief: 'wire the existing card→map→pin-back loop' (no detail wiring). DTL-001: 'wire the home map pin/marker tap handler to router.push' (pin → detail only). The 'card' path to detail is unassigned.",
    "proposed_fix": "Either (a) extend DISC-012 to wire curated-route card taps to router.push('/curated-route/[id]') distinct from planned routes' card→map loop; OR (b) clarify Sprint 03 capstone gate step 3 to 'tap a curated route card to re-render it on the map, then tap the pin to open its detail' matching the DELTA-001 designed flow.",
    "raised_by": ["code-reviewer#rev-c2"],
    "status": "open",
    "is_upstream": false,
    "first_cycle": 2,
    "reopened_count": 0
  },
  {
    "id": "RF-020",
    "severity": "MEDIUM",
    "confidence": "LOW",
    "dimension": "gate-validity",
    "target": "sprint-02 gate sentence (narrative framing)",
    "summary": "Sprint 02 gate sentence ('Tapping a route opens...') frames detail as the entry point without acknowledging discovery (Sprint 01) as the upstream hero. Test steps correctly contextualize ('From the home map, tap...'), but the gate sentence itself doesn't.",
    "evidence": "Sprint 01 Overview: 'Re-anchor LaneShadow on its strategic hero — Discovery'. Sprint 02 gate sentence: 'Tapping a route opens an honest, complete route detail...' — starts from the tap, not from discovery.",
    "proposed_fix": "Rewrite Sprint 02 gate sentence to acknowledge the discovered-route upstream: 'From a curated route discovered on the map/chat home (Sprint 01), tapping it opens honest, complete detail — summary/name headline, score bars with composite headline, polyline-or-centroid map, basic conditions — and from there the rider can save, find again in Saved, reopen without error, and hand off to Apple/Google Maps to ride it.'",
    "raised_by": ["code-reviewer#rev-c2"],
    "status": "open",
    "is_upstream": false,
    "first_cycle": 2,
    "reopened_count": 0
  }
]
| .reviewers_this_cycle = ["code-reviewer#rev-c2"]
