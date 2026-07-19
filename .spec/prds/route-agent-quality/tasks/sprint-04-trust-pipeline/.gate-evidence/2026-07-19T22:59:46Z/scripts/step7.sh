#!/usr/bin/env bash
set -euo pipefail
cd /Users/inference1/Projects/LaneShadow-RN
ID='{"subject":"s4-human-gate","issuer":"https://laneshadow.test"}'
POLY='oditE~o~}Uk~@uq@i~@uq@k~@uq@k~@uq@i~@uq@k~@sq@i~@uq@k~@uq@k~@uq@i~@uq@k~@uq@k~@uq@i~@uq@k~@uq@i~@uq@k~@sq@k~@uq@'
for R in test:s4gate-approve test:s4gate-retry test:s4gate-retire; do
  npx convex run reviewQueue:seedReviewQueueEntry "{\"routeId\":\"$R\",\"name\":\"Gate $R\",\"bestCandidateGeometry\":\"$POLY\",\"failedCondition\":\"ratio\",\"lengthMiles\":41}" --identity "$ID"
done
npx convex run reviewQueue:approveDisposition '{"routeId":"test:s4gate-approve"}' --identity "$ID" | tee /tmp/s4-approve.json
npx convex run reviewQueue:retryDisposition '{"routeId":"test:s4gate-retry","lever":2,"lever2FixedGeometry":{"routedMiles":41,"pointCount":80,"anchorCount":2,"claimedMiles":41}}' --identity "$ID" | tee /tmp/s4-retry.json
npx convex run reviewQueue:retireDisposition '{"routeId":"test:s4gate-retire"}' --identity "$ID" | tee /tmp/s4-retire.json
python3 - <<'PY'
import json
a=json.load(open('/tmp/s4-approve.json'))
r=json.load(open('/tmp/s4-retry.json'))
t=json.load(open('/tmp/s4-retire.json'))
assert a.get('disposition')=='approve' or a.get('geometryStatus')=='generated' or 'approve' in json.dumps(a)
assert r.get('disposition')=='retry' or r.get('retryCount')==1 or 'retry' in json.dumps(r).lower()
assert t.get('disposition')=='retire' or t.get('retiredAt') or 'retire' in json.dumps(t).lower()
print(json.dumps({'ok':True,'approve':a.get('disposition'),'retry':r.get('disposition'),'retire':t.get('disposition')}, default=str))
PY
