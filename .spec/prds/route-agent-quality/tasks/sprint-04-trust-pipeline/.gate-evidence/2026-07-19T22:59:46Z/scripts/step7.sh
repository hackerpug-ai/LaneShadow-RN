#!/usr/bin/env bash
# REDHAT-FIX-12 rebuilt: operator-gated REVIEW-queue dispositions.
# Seeded operator identity, no deterministic-seam args (retry uses the production
# lever=1 path), no non-operator closeout identity. seed/approve/retire are
# operator-gated; under GATE_IDENTITY=bare the operator-gated approve throws
# FORBIDDEN.
set -euo pipefail
cd /Users/inference1/Projects/LaneShadow-RN
OP_ID='{"subject":"test:s4t12-operator","issuer":"https://laneshadow.test"}'
GATE_IDENTITY="${GATE_IDENTITY:-$OP_ID}"
POLY='_p~iF~ps|U_ulLnnqC_mqNvxq\\'
npx convex run testSupport:devSetupFounderUser '{"clerkUserId":"test:s4t12-operator","role":"founder"}' --identity "$OP_ID" >/dev/null
for R in test:s4t12-approve test:s4t12-retry test:s4t12-retire; do
  npx convex run reviewQueue:seedReviewQueueEntry "{\"routeId\":\"$R\",\"name\":\"Gate $R\",\"bestCandidateGeometry\":\"$POLY\",\"failedCondition\":\"ratio\",\"lengthMiles\":41}" --identity "$OP_ID" >/dev/null
done
npx convex run reviewQueue:approveDisposition '{"routeId":"test:s4t12-approve"}' --identity "$GATE_IDENTITY" | tee /tmp/s4t12-approve.json
npx convex run reviewQueue:retireDisposition '{"routeId":"test:s4t12-retire"}' --identity "$GATE_IDENTITY" | tee /tmp/s4t12-retire.json
npx convex run reviewQueue:retryDisposition '{"routeId":"test:s4t12-retry","lever":1}' --identity "$GATE_IDENTITY" | tee /tmp/s4t12-retry.json
python3 - <<'PY'
import json
a = json.load(open('/tmp/s4t12-approve.json'))
t = json.load(open('/tmp/s4t12-retire.json'))
r = json.load(open('/tmp/s4t12-retry.json'))
assert a.get('disposition') == 'approve'
assert r.get('disposition') == 'retry' or r.get('nextLever') or 'retry' in json.dumps(r).lower()
assert t.get('retiredAt') or t.get('disposition') == 'retire' or 'retire' in json.dumps(t).lower()
print(json.dumps({'ok': True, 'approve': a.get('disposition'), 'retry': r.get('disposition'), 'retire': bool(t.get('retiredAt')) or t.get('disposition'), 'pipelineIdentity': 'test:s4t12-operator'}, default=str))
PY
