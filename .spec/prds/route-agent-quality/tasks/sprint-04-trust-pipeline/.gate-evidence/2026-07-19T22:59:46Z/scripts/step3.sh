#!/usr/bin/env bash
# REDHAT-FIX-12 rebuilt: operator-gated couch-sample export.
# Authenticates as a seeded operator/founder (test-prefix subject); calls the
# current public Convex surface with no deterministic-seam arguments and no
# non-operator closeout identity. Exercises assembleCouchSample
# (requireOperatorAction) + exportCouchSample. Under GATE_IDENTITY=bare the
# operator-gated assemble throws FORBIDDEN.
set -euo pipefail
cd /Users/inference1/Projects/LaneShadow-RN
OP_ID='{"subject":"test:s4t12-operator","issuer":"https://laneshadow.test"}'
GATE_IDENTITY="${GATE_IDENTITY:-$OP_ID}"
npx convex run testSupport:devSetupFounderUser '{"clerkUserId":"test:s4t12-operator","role":"founder"}' --identity "$OP_ID" >/dev/null
npx convex run couchSampleAssembler:seedCouchFixturesPublic '{}' --identity "$OP_ID" >/dev/null
# Operator-gated freeze (requireOperatorAction): FORBIDDEN under a bare identity.
# Write to a temp first so a failed (FORBIDDEN) run never clobbers the shared
# sample artifact consumed by step4/step5.
npx convex run couchSampleAssembler:assembleCouchSample '{"targetSize":25}' --identity "$GATE_IDENTITY" > /tmp/s4t12-sample.tmp.json
python3 -c 'import json;d=json.load(open("/tmp/s4t12-sample.tmp.json"));assert 20<=len(d.get("routes",[]))<=30'
mv /tmp/s4t12-sample.tmp.json /tmp/s4t12-sample.json
SID=$(python3 -c 'import json;print(json.load(open("/tmp/s4t12-sample.json"))["sampleId"])')
npx convex run couchSampleExport:exportCouchSample "{\"sampleId\":\"$SID\"}" --identity "$GATE_IDENTITY" > /tmp/s4t12-export.json
python3 - <<'PY'
import json
sample=json.load(open('/tmp/s4t12-sample.json'))
exp=json.load(open('/tmp/s4t12-export.json'))
assert exp.get('size', 0) >= 20, exp.get('size')
print(json.dumps({'ok': True, 'sampleId': sample['sampleId'], 'routes': len(sample['routes']), 'exportSize': exp['size'], 'pipelineIdentity': 'test:s4t12-operator'}))
PY
