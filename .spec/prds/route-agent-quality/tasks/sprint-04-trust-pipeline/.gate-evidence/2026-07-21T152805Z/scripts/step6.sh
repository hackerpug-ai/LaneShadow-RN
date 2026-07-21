#!/usr/bin/env bash
# Honest step6: single routeVerdict=wrong with overallVerdict=pass must be rejected WRONG_FORCES_FAIL.
set -euo pipefail
cd /Users/inference1/Projects/LaneShadow-RN
OP_ID='{"subject":"test:s4-gate-operator","issuer":"https://laneshadow.test"}'
npx convex run testSupport:devSetupFounderUser '{"clerkUserId":"test:s4-gate-operator","role":"operator"}' --identity "$OP_ID" >/dev/null
# Expects SAMPLE_JSON path or uses last assembled sample id via env
SAMPLE_JSON="${SAMPLE_JSON:?set SAMPLE_JSON to a frozen sample json with routes[]}"
python3 - <<PY
import json,subprocess,sys
sample=json.load(open("$SAMPLE_JSON"))
rv=[{'routeId':r['routeId'],'verdict':('wrong' if i==0 else 'true')} for i,r in enumerate(sample['routes'])]
args=json.dumps({'sampleId':sample['sampleId'],'overallVerdict':'pass','routeVerdicts':rv})
r=subprocess.run(['npx','convex','run','couchVerdict:recordCouchVerdict',args,'--identity','''$OP_ID'''],capture_output=True,text=True)
joined=r.stdout+r.stderr
assert r.returncode!=0 and 'WRONG_FORCES_FAIL' in joined, joined[:800]
print(json.dumps({'ok':True,'rejected':True,'code':'WRONG_FORCES_FAIL'}))
PY
