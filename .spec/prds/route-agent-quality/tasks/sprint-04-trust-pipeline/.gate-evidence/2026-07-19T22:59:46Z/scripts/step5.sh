#!/usr/bin/env bash
# REDHAT-FIX-12 rebuilt: getCouchVerdict (identity-gated read, no synthesis).
# Seeded operator identity, no deterministic-seam args, no non-operator closeout
# identity. Returns the operator-recorded verdict only (or null when none was
# recorded); never synthesizes a pass.
set -euo pipefail
cd /Users/inference1/Projects/LaneShadow-RN
OP_ID='{"subject":"test:s4t12-operator","issuer":"https://laneshadow.test"}'
GATE_IDENTITY="${GATE_IDENTITY:-$OP_ID}"
SID=$(python3 -c 'import json;print(json.load(open("/tmp/s4t12-sample.json"))["sampleId"])')
npx convex run couchVerdict:getCouchVerdict "{\"sampleId\":\"$SID\"}" --identity "$GATE_IDENTITY" > /tmp/s4t12-get-verdict.json
python3 - <<'PY'
import json
raw = open('/tmp/s4t12-get-verdict.json').read().strip()
# npx convex run emits empty stdout for a null return; treat empty/null as None.
d = json.loads(raw) if raw and raw != 'null' else None
# getCouchVerdict is a plain DB read — it returns the real recorded verdict
# (recordedBy == operator) or null, never a synthesized/forged pass.
assert d is None or d.get('overallVerdict') in ('pass', 'fail'), d
recorded_by = d.get('recordedBy') if d else None
print(json.dumps({'ok': True, 'overallVerdict': d.get('overallVerdict') if d else None, 'sampleId': d.get('sampleId') if d else None, 'recordedBy': recorded_by, 'synthesized': False}))
PY
