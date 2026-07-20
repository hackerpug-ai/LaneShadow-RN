#!/usr/bin/env bash
# REDHAT-FIX-12 rebuilt: operator-gated couch verdict record (recordCouchVerdict).
# Seeded operator identity, no deterministic-seam args, no non-operator closeout
# identity. Under GATE_IDENTITY=bare -> FORBIDDEN.
set -euo pipefail
cd /Users/inference1/Projects/LaneShadow-RN
OP_ID='{"subject":"test:s4t12-operator","issuer":"https://laneshadow.test"}'
GATE_IDENTITY="${GATE_IDENTITY:-$OP_ID}"
npx convex run testSupport:devSetupFounderUser '{"clerkUserId":"test:s4t12-operator","role":"founder"}' --identity "$OP_ID" >/dev/null
python3 - "$GATE_IDENTITY" <<'PY'
import json, subprocess, sys
identity = sys.argv[1]
sample = json.load(open('/tmp/s4t12-sample.json'))
rv = [{'routeId': r['routeId'], 'verdict': 'true'} for r in sample['routes']]
args = json.dumps({'sampleId': sample['sampleId'], 'overallVerdict': 'pass', 'routeVerdicts': rv})
r = subprocess.run(['npx', 'convex', 'run', 'couchVerdict:recordCouchVerdict', args, '--identity', identity],
                   capture_output=True, text=True)
sys.stdout.write(r.stdout); sys.stderr.write(r.stderr)
assert r.returncode == 0, r.stderr
body = json.loads(r.stdout)
assert body['overallVerdict'] == 'pass'
assert body['recordedBy'] == 'test:s4t12-operator'
open('/tmp/s4t12-verdict-pass.json', 'w').write(json.dumps(body, indent=2))
print(json.dumps({'ok': True, 'sampleId': body['sampleId'], 'recordedBy': body['recordedBy'], 'overallVerdict': body['overallVerdict'], 'routeVerdicts': len(body['routeVerdicts'])}))
PY
