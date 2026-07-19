#!/usr/bin/env bash
set -euo pipefail
cd /Users/inference1/Projects/LaneShadow-RN
python3 - <<'PY'
import json,subprocess,sys
ID=json.dumps({'subject':'s4-human-gate','issuer':'https://laneshadow.test'})
sample=json.load(open('/tmp/s4-sample.json'))
rv=[{'routeId':r['routeId'],'verdict':'true'} for r in sample['routes']]
args=json.dumps({'sampleId':sample['sampleId'],'overallVerdict':'pass','routeVerdicts':rv})
r=subprocess.run(['npx','convex','run','couchVerdict:recordCouchVerdict',args,'--identity',ID],capture_output=True,text=True)
sys.stdout.write(r.stdout)
sys.stderr.write(r.stderr)
assert r.returncode==0, r.stderr
body=json.loads(r.stdout)
assert body['overallVerdict']=='pass'
assert len(body['routeVerdicts'])==len(sample['routes'])
open('/tmp/s4-verdict-pass.json','w').write(json.dumps(body,indent=2))
print(json.dumps({'ok':True,'sampleId':body['sampleId'],'routeVerdicts':len(body['routeVerdicts']),'overallVerdict':body['overallVerdict']}))
PY
