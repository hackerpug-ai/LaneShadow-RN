#!/usr/bin/env bash
set -euo pipefail
cd /Users/inference1/Projects/LaneShadow-RN
python3 - <<'PY'
import json,subprocess,sys
ID=json.dumps({'subject':'s4-human-gate','issuer':'https://laneshadow.test'})
sample=json.load(open('/tmp/s4-sample.json'))
rv=[{'routeId':r['routeId'],'verdict':('wrong' if i==0 else 'true')} for i,r in enumerate(sample['routes'])]
args=json.dumps({'sampleId':sample['sampleId']+'-wrong-test','overallVerdict':'pass','routeVerdicts':rv})
r=subprocess.run(['npx','convex','run','couchVerdict:recordCouchVerdict',args,'--identity',ID],capture_output=True,text=True)
print('stdout=',r.stdout)
print('stderr=',r.stderr)
print('exit=',r.returncode)
assert r.returncode!=0, 'expected rejection for wrong+pass'
joined=(r.stdout+r.stderr)
assert 'WRONG_FORCES_FAIL' in joined or 'wrong' in joined.lower()
print(json.dumps({'ok':True,'rejected':True,'code':'WRONG_FORCES_FAIL'}))
PY
