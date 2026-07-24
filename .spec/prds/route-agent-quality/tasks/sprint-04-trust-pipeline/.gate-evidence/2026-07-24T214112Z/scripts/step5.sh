#!/usr/bin/env bash
# Fresh 2026-07-24 gate step5: VERIFY overallVerdict=pass on live gate (never forge).
set -euo pipefail
cd /Users/inference1/Projects/LaneShadow-RN
FOUNDER_ID='{"subject":"s4t6-record-verdict","issuer":"https://laneshadow.test"}'
python3 - <<PY
import json, subprocess, sys
identity = '''$FOUNDER_ID'''
r = subprocess.run(
    ["npx", "convex", "run", "couchVerdict:couchGateStatus", "{}", "--identity", identity],
    capture_output=True, text=True, cwd="/Users/inference1/Projects/LaneShadow-RN",
)
raw = r.stdout
start = raw.find("{")
assert start >= 0, (r.stdout + r.stderr)[:500]
status = json.loads(raw[start: raw.rfind("}") + 1])
if status.get("overallVerdict") != "pass":
    print(json.dumps({"ok": False, "reason": "overall_not_pass", "status": status}))
    sys.exit(2)
if status.get("allowed") is not True:
    print(json.dumps({"ok": False, "reason": "not_allowed", "status": status}))
    sys.exit(2)
print(json.dumps({
    "ok": True,
    "overallVerdict": "pass",
    "sampleId": status.get("sampleId"),
    "allowed": True,
    "manifestHash": status.get("manifestHash"),
}))
PY
