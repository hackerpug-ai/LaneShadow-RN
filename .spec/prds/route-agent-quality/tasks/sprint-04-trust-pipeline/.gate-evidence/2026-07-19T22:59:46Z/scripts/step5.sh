#!/usr/bin/env bash
set -euo pipefail
cd /Users/inference1/Projects/LaneShadow-RN
ID='{"subject":"s4-human-gate","issuer":"https://laneshadow.test"}'
SID=$(python3 -c 'import json; print(json.load(open("/tmp/s4-sample.json"))["sampleId"])')
npx convex run couchVerdict:getCouchVerdict "{\"sampleId\":\"$SID\"}" --identity "$ID" | tee /tmp/s4-get-verdict.json
python3 - <<'PY'
import json
d=json.load(open('/tmp/s4-get-verdict.json'))
assert d and d.get('overallVerdict')=='pass', d
print(json.dumps({'ok':True,'overallVerdict':d['overallVerdict'],'sampleId':d['sampleId']}))
PY
