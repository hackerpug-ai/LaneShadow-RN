import json, subprocess
VS="/Users/justinrich/Projects/brain/tools/validate-scenario/validate_scenario.py"
base=".tmp/sprint01-expansion"
def load(k): return json.load(open(f"{base}/{k}.json"))
fixes={**json.load(open(f"{base}/convex-fix.json")), **json.load(open(f"{base}/rn-fix.json"))}
applied=0
for k in ["convex","rn"]:
    o=load(k)
    for t in o.get("expanded_tasks",[]):
        tid=t.get("task_id") or t.get("id")
        if tid in fixes:
            for ac in t.get("acceptance_criteria",[]):
                if ac.get("id") in fixes[tid]:
                    ac["scenario"]=fixes[tid][ac["id"]]; applied+=1
    json.dump(o,open(f"{base}/{k}.json","w"),indent=2)
print(f"applied {applied} corrected scenarios")
# re-audit ALL FEATURE tasks
allt=[]
for k in ["convex","rn","design"]:
    o=load(k)
    for t in (o.get("expanded_tasks") or o.get("design_tasks") or []): allt.append(t)
fails={}
for t in allt:
    tid=t.get("task_id") or t.get("id")
    if t.get("task_type")!="FEATURE": continue
    reqs=[{"id":a.get("id"),"scenario":a["scenario"]} for a in t.get("acceptance_criteria",[]) if a.get("scenario")]
    contract={"fixtures":t.get("fixtures",{}),"requirements":reqs}
    r=subprocess.run(["python3",VS,"/dev/stdin"],input=json.dumps(contract),capture_output=True,text=True)
    if r.returncode!=0:
        try: codes=sorted(set(x["code"]+":"+x["severity"] for x in json.loads(r.stdout).get("violations",[])))
        except: codes=[r.stdout[-160:]]
        fails[tid]=codes
print("\n=== RE-AUDIT AFTER FIX ===")
if not fails: print("✓ ALL FEATURE TASKS PASS the fakeability floor (0 CRITICAL/HIGH)")
else:
    for tid,c in fails.items(): print(f"FAIL {tid}: {c}")
