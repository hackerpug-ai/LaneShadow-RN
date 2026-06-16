import json, subprocess, os
VS="/Users/justinrich/Projects/brain/tools/validate-scenario/validate_scenario.py"
def load(k): return json.load(open(f".tmp/sprint01-expansion/{k}.json"))
allt=[]
for k in ["convex","rn","design"]:
    o=load(k)
    for t in (o.get("expanded_tasks") or o.get("design_tasks") or []):
        allt.append(t)
os.makedirs(".tmp/sprint01-expansion/contracts",exist_ok=True)
results={}
for t in allt:
    tid=t.get("task_id") or t.get("id")
    if t.get("task_type")!="FEATURE": 
        results[tid]=("SKIP (non-FEATURE)",0); continue
    reqs=[]
    for a in t.get("acceptance_criteria",[]):
        if isinstance(a,dict) and a.get("scenario"):
            reqs.append({"id":a.get("id"),"scenario":a["scenario"]})
    contract={"fixtures":t.get("fixtures",{}),"requirements":reqs}
    p=f".tmp/sprint01-expansion/contracts/{tid}.json"
    json.dump(contract,open(p,"w"),indent=2)
    r=subprocess.run(["python3",VS,p],capture_output=True,text=True)
    results[tid]=(r.stdout.strip()[-400:] if r.returncode!=0 else "PASS", r.returncode)
print("=== FAKEABILITY AUDIT (exit 0 = pass) ===")
fails=[]
for tid,(msg,rc) in results.items():
    mark = "OK" if rc==0 else "FAIL"
    print(f"{mark:5} {tid:14} {msg if rc!=0 else ''}")
    if rc==1: fails.append(tid)
print(f"\nFEATURE fails: {fails if fails else 'NONE — fakeability floor clear'}")
