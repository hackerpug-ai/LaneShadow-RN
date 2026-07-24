#!/usr/bin/env bash
# Fresh 2026-07-24 gate step8: after recorded pass, couchGateStatus allows --all
# (pass_allowed=true). The pre-pass refusal contract is covered by step6 WRONG_FORCES_FAIL
# + historical evidence; post-pass honest check is allowed===true.
set -euo pipefail
cd /Users/inference1/Projects/LaneShadow-RN
READER_ID='{"subject":"gate-evidence-reader","issuer":"https://laneshadow.test"}'
OP_ID='{"subject":"s4t6-record-verdict","issuer":"https://laneshadow.test"}'
python3 - <<PY
import json, subprocess
reader = '''$READER_ID'''
op = '''$OP_ID'''
def run(fn, args, identity):
    return subprocess.run(
        ["npx", "convex", "run", fn, json.dumps(args), "--identity", identity],
        capture_output=True, text=True, cwd="/Users/inference1/Projects/LaneShadow-RN",
    )
st = run("couchVerdict:couchGateStatus", {}, reader)
raw = st.stdout
start = raw.find("{")
assert start >= 0, st.stdout + st.stderr
status = json.loads(raw[start: raw.rfind("}") + 1])
assert status.get("allowed") is True, status
assert status.get("overallVerdict") == "pass", status
# Smoke: runAllWaterfall is no longer COUCH_GATE_BLOCKED for a tiny sample
# (may skip already-terminal; must not be gate-blocked)
allr = run("couchVerdict:runAllWaterfall", {
    "routeIds": ["motorcycleroads:twist-of-tepusquet-loop"],
}, op)
joined = allr.stdout + allr.stderr
assert "COUCH_GATE_BLOCKED" not in joined, joined[:600]
print(json.dumps({
    "ok": True,
    "pass_allowed": True,
    "allowed": True,
    "overallVerdict": "pass",
    "sampleId": status.get("sampleId"),
    "runAll_not_gate_blocked": True,
}))
PY
