#!/usr/bin/env bash
# Honest step1 @ HEAD: production runSampleWaterfall under operator identity.
# NO lever2FixedGeometry seam. Real Google + LLM on real catalog routes.
set -euo pipefail
cd /Users/inference1/Projects/LaneShadow-RN
OP_ID='{"subject":"test:s4-gate-operator","issuer":"https://laneshadow.test"}'
ROUTE_IDS="${ROUTE_IDS:-motorcycleroads:twist-of-tepusquet-loop motorcycleroads:von-hoak-loop motorcycleroads:old-hwy-40-cisco-grove-to-donner-lake}"
ROUTE_JSON=$(printf '%s\n' $ROUTE_IDS | python3 -c "import sys,json;print(json.dumps(sys.stdin.read().split()))")
# Ensure operator is seeded (idempotent)
npx convex run testSupport:devSetupFounderUser '{"clerkUserId":"test:s4-gate-operator","role":"operator"}' --identity "$OP_ID" >/dev/null
npx convex run waterfallOrchestrator:runSampleWaterfall "{\"routeIds\":$ROUTE_JSON,\"maxCost\":5}" --identity "$OP_ID"
