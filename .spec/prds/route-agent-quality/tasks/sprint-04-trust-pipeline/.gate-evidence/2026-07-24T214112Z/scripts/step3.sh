#!/usr/bin/env bash
# Fresh 2026-07-24 gate step3: VERIFY live couch sample PNGs + export (never forge).
# Human founder review already performed; this re-checks durable artifacts + live export.
set -euo pipefail
cd /Users/inference1/Projects/LaneShadow-RN
FOUNDER_ID='{"subject":"s4t6-record-verdict","issuer":"https://laneshadow.test"}'
PNG_DIR=".tmp/S4-T7-review/export-basemap"
python3 - <<PY
import json, os, subprocess, glob, sys
png_dir = "$PNG_DIR"
pngs = sorted(glob.glob(os.path.join(png_dir, "*.png")))
if len(pngs) < 20:
    print(json.dumps({"ok": False, "reason": f"png_count_lt_20:{len(pngs)}", "pngs": len(pngs)}))
    sys.exit(2)
identity = '''$FOUNDER_ID'''
# Resolve active sample from couchGateStatus (live)
st = subprocess.run(
    ["npx", "convex", "run", "couchVerdict:couchGateStatus", "{}", "--identity", identity],
    capture_output=True, text=True, cwd="/Users/inference1/Projects/LaneShadow-RN",
)
raw = st.stdout + st.stderr
start = raw.find("{")
assert start >= 0, raw[:400]
status = json.loads(raw[start: raw.rfind("}") + 1])
sample_id = status.get("sampleId")
assert sample_id, status
# exportCouchSample must return the sample with size >= 20
ex = subprocess.run(
    ["npx", "convex", "run", "couchSampleExport:exportCouchSample",
     json.dumps({"sampleId": sample_id}), "--identity", identity],
    capture_output=True, text=True, cwd="/Users/inference1/Projects/LaneShadow-RN",
)
eraw = ex.stdout
estart = eraw.find("{")
assert estart >= 0, ex.stdout[:200] + ex.stderr[:200]
export = json.loads(eraw[estart: eraw.rfind("}") + 1])
assert export.get("sampleId") == sample_id, export.get("sampleId")
assert int(export.get("size") or 0) >= 20, export.get("size")
print(json.dumps({
    "ok": True,
    "pngs": len(pngs),
    "sampleId": sample_id,
    "exportSize": export.get("size"),
    "manifestHash": status.get("manifestHash"),
}))
PY
