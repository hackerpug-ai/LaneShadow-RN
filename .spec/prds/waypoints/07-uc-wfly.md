---
stability: FEATURE_SPEC
last_validated: 2026-04-14
prd_version: 1.0.0
functional_group: WFLY
---

# Use Cases: Waypoint Flywheel (WFLY)

Flywheel mechanics for self-improving catalog quality. Phase 0.5 ships a **minimum viable** flywheel — downvote button + deterministic penalty + scheduled re-verification. Advanced flywheel work (review queue, auto-delete thresholds, score recalibration based on usage data) is Phase 1+.

| UC ID | Title | Description |
|---|---|---|
| UC-WFLY-01 | Process User Downvote | Receive a downvote and apply deterministic score penalty |
| UC-WFLY-02 | Schedule Freshness Re-verification | Category-specific SLA triggers re-fetch of source data |
| UC-WFLY-03 | Recalibrate Score Weights | Periodic batch job that re-computes composite score weights from accumulated flywheel data |

---

## UC-WFLY-01: Process User Downvote

**Description**: When a rider reports "Not a delight" via UC-WDISC-07, the backend applies a deterministic score penalty and records the event for future audit/recalibration.

**Acceptance Criteria**:
- ☐ Convex mutation `reportNotDelight(waypoint_id, reason, user_id)` exists
- ☐ Mutation validates the user is authenticated and hasn't exceeded the daily rate limit (10/day)
- ☐ Mutation inserts a row into `waypoint_downvotes` (timestamp, waypoint_id, user_id, reason)
- ☐ Mutation applies a deterministic score penalty to the waypoint: `composite_score = max(0, composite_score - 0.2)`
- ☐ If the waypoint's downvote count reaches a threshold (default: 10), the waypoint is flagged `status=under_review` for founder inspection (not auto-deleted)
- ☐ Mutation returns success confirmation to the client
- ☐ System logs aggregate downvote metrics for monitoring (rate, reason distribution, region distribution)
- ☐ **Phase 0.5 scope**: deterministic penalty only. No LLM review, no auto-delete. Founder reviews `under_review` queue manually.
- ☐ **Phase 1 scope**: automated review queue + Haiku-assisted review + programmatic auto-delete for high-confidence junk.

## UC-WFLY-02: Schedule Freshness Re-verification

**Description**: A scheduled GitHub Actions cron runs monthly and re-verifies waypoints whose `last_verified` timestamp exceeds their category-specific SLA.

**Acceptance Criteria**:
- ☐ GitHub Actions workflow `waypoint_freshness.yml` runs monthly on the 1st of each month at 03:00 UTC
- ☐ Workflow calls `python -m pipeline.waypoints.freshness_refresh`
- ☐ Freshness SLAs per category:
  - Taste: 12 months
  - Pause: 36 months
  - Wander: 36 months
- ☐ Script queries Convex for waypoints where `last_verified + category_sla < now()`
- ☐ For each stale waypoint, script re-runs the sourcing ingestion for the originating source(s) and re-runs quality gates L1–L6
- ☐ If re-verification succeeds: `last_verified = now()`, any score changes are applied, and the waypoint stays live
- ☐ If re-verification fails (source 404, record deleted, category changed): waypoint is marked `status=stale` or `status=suspended`; admin notification is logged
- ☐ Cost cap per run: $20/month ceiling — if re-verification would exceed, skip lowest-priority categories
- ☐ Summary report posted to admin channel (log or webhook) with total re-verified, total suspended, total cost

## UC-WFLY-03: Recalibrate Score Weights (Phase 1+ planning hook)

**Description**: After Phase 0.5 has accumulated ≥3 months of usage data, a batch job recalibrates composite score weights using saves, downvotes, and dwell-time signals. **Phase 0.5 ships with the score spec but the recalibration job is Phase 1 work.**

**Acceptance Criteria (Phase 0.5)**:
- ☐ System logs all score-relevant events: save, view, downvote, directions-tapped, with timestamp and waypoint_id
- ☐ Logging is efficient (Convex is not a time-series database — use a separate events table with an append-only pattern)
- ☐ Event log has retention: keep last 12 months rolling

**Acceptance Criteria (Phase 1 — not in Phase 0.5 scope)**:
- Recalibration batch job queries event log and computes per-feature weights
- Weights are compared to current weights; significant drift triggers admin review
- Approved weight changes re-run the scoring pass on all waypoints
- Founder has veto authority on automated weight changes
