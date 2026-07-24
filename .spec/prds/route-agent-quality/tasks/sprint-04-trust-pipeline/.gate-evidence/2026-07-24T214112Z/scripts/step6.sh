#!/usr/bin/env bash
# Fresh 2026-07-24 gate step6: VERIFY wrong+pass is rejected WRONG_FORCES_FAIL (never forges).
# Uses live active sample route list; rejection is pre-insert so pass is not revoked.
set -euo pipefail
cd /Users/inference1/Projects/LaneShadow-RN
FOUNDER_ID='{"subject":"s4t6-record-verdict","issuer":"https://laneshadow.test"}'
python3 - <<PY
import json, subprocess, sys
identity = '''$FOUNDER_ID'''
def run(fn, args):
    return subprocess.run(
        ["npx", "convex", "run", fn, json.dumps(args), "--identity", identity],
        capture_output=True, text=True, cwd="/Users/inference1/Projects/LaneShadow-RN",
    )
st = run("couchVerdict:couchGateStatus", {})
raw = st.stdout
start = raw.find("{")
status = json.loads(raw[start: raw.rfind("}") + 1])
sample_id = status["sampleId"]
gv = run("couchVerdict:getCouchVerdict", {"sampleId": sample_id})
grow = json.loads(gv.stdout[gv.stdout.find("{"): gv.stdout.rfind("}") + 1])
rvs = [{"routeId": r["routeId"], "verdict": ("wrong" if i == 0 else "true")}
       for i, r in enumerate(grow.get("routeVerdicts") or [])]
assert len(rvs) >= 1, "no routeVerdicts on active sample"
args = {"sampleId": sample_id, "overallVerdict": "pass", "routeVerdicts": rvs}
rej = run("couchVerdict:recordCouchVerdict", args)
joined = rej.stdout + rej.stderr
assert rej.returncode != 0 and "WRONG_FORCES_FAIL" in joined, joined[:800]
print(json.dumps({"ok": True, "rejected": True, "code": "WRONG_FORCES_FAIL", "sampleId": sample_id}))
PY
