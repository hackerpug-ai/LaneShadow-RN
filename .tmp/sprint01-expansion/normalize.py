import json, subprocess, os
VS="/Users/justinrich/Projects/brain/tools/validate-scenario/validate_scenario.py"
def load(k): return json.load(open(f".tmp/sprint01-expansion/{k}.json"))
def norm_scenario(ac):
    sc=ac.get("scenario")
    if not sc: return
    # copy test_tier from AC if scenario lacks it
    if not sc.get("test_tier") and ac.get("test_tier"): sc["test_tier"]=ac["test_tier"]
    if not sc.get("verification_service") and ac.get("verification_service"): sc["verification_service"]=ac["verification_service"]
    for case in sc.get("cases",[]):
        if "end_state" not in case:
            es={}
            for key in ("must_observe","must_not_observe"):
                if key in case: es[key]=case.pop(key)
            if es: case["end_state"]=es
for k in ["convex","rn","design"]:
    o=load(k)
    for t in (o.get("expanded_tasks") or o.get("design_tasks") or []):
        for ac in t.get("acceptance_criteria",[]):
            if isinstance(ac,dict): norm_scenario(ac)
    json.dump(o,open(f".tmp/sprint01-expansion/{k}.json","w"),indent=2)
# re-run audit
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
    p=f".tmp/sprint01-expansion/contracts/{tid}.json"; json.dump(contract,open(p,"w"),indent=2)
    r=subprocess.run(["python3",VS,p],capture_output=True,text=True)
    if r.returncode!=0:
        # collect violation codes
        try:
            v=json.loads(r.stdout); codes=[x.get("code")+":"+x.get("severity") for x in v.get("violations",[])]
        except: codes=[r.stdout.strip()[-200:]]
        fails[tid]=codes
print("=== AFTER NORMALIZATION ===")
if not fails: print("ALL FEATURE TASKS PASS fakeability floor ✓")
for tid,codes in fails.items(): print(f"FAIL {tid}: {codes}")
