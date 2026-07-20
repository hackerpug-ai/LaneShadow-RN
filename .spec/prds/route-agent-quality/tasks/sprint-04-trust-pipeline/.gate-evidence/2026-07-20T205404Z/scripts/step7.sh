#!/usr/bin/env bash
# REDHAT-FIX-01 corrected step7: REVIEW-queue dispositions. The production
# `reviewQueue:retryDisposition` entry NO LONGER accepts the deterministic
# `lever2FixedGeometry` seam (removed by FIX-01). A real Lever-2 retry now calls
# live reconstruction.
#
# Step 7 disposition is a Founder-Operator judgment (S4-T7) on REAL review items.
# This script exercises the approve / retry / retire path; the routeIds must be
# REAL routes currently in the REVIEW queue. The gate is BLOCKED on a human
# founder until steps 4-5 are reviewed — see GATE-RESULTS.md.
set -euo pipefail
cd /Users/inference1/Projects/LaneShadow-RN
ID='{"subject":"s4-human-gate","issuer":"https://laneshadow.test"}'
# REAL review-queue routeIds (override via env). The real route that honestly
# failed the gate (step1) lands in REVIEW and can be dispositioned here.
APPROVE_ID="${APPROVE_ID:-motorcycleroads:twist-of-tepusquet-loop}"
RETRY_ID="${RETRY_ID:-motorcycleroads:twist-of-tepusquet-loop}"
RETIRE_ID="${RETIRE_ID:-motorcycleroads:twist-of-tepusquet-loop}"
echo "approve $APPROVE_ID"
npx convex run reviewQueue:approveDisposition "{\"routeId\":\"$APPROVE_ID\"}" --identity "$ID" || true
echo "retry $RETRY_ID (real Lever-2 reconstruction — no seam)"
npx convex run reviewQueue:retryDisposition "{\"routeId\":\"$RETRY_ID\",\"lever\":2}" --identity "$ID" || true
echo "retire $RETIRE_ID"
npx convex run reviewQueue:retireDisposition "{\"routeId\":\"$RETIRE_ID\"}" --identity "$ID" || true
