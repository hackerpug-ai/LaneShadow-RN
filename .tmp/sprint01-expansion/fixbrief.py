import json, subprocess
VS="/Users/justinrich/Projects/brain/tools/validate-scenario/validate_scenario.py"
def load(k): return json.load(open(f".tmp/sprint01-expansion/{k}.json"))
briefs={}
for k in ["convex","rn"]:
    o=load(k)
    for t in (o.get("expanded_tasks") or []):
        tid=t.get("task_id") or t.get("id")
        if t.get("task_type")!="FEATURE": continue
        for ac in t.get("acceptance_criteria",[]):
            if not ac.get("scenario"): continue
            contract={"fixtures":t.get("fixtures",{}),"requirements":[{"id":ac.get("id"),"scenario":ac["scenario"]}]}
            r=subprocess.run(["python3",VS,"/dev/stdin"],input=json.dumps(contract),capture_output=True,text=True)
            if r.returncode!=0:
                try: viol=[{"code":x["code"],"sev":x["severity"],"msg":x["message"]} for x in json.loads(r.stdout).get("violations",[])]
                except: viol=[{"raw":r.stdout[-150:]}]
                briefs.setdefault(tid,{})[ac["id"]]={"is_primary":ac.get("num")==1 or ac.get("id")=="AC-1","test_tier":ac.get("test_tier"),"violations":viol}
json.dump(briefs,open(".tmp/sprint01-expansion/fixbrief.json","w"),indent=2)
# print compact
for tid,acs in briefs.items():
    print(f"\n### {tid}")
    for acid,d in acs.items():
        codes=",".join(sorted(set(v.get('code','?') for v in d['violations'])))
        print(f"  {acid} (tier={d['test_tier']}): {codes}")
print("\nWrote .tmp/sprint01-expansion/fixbrief.json")
