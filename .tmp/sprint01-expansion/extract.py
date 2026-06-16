import json, re, sys, os
TR = "/Users/justinrich/.claude/projects/-Users-justinrich-Projects-LaneShadow-RN/e9ffadb3-9c0d-48f2-8853-9a4dddb4ad6d/tool-results"
files = {
  "convex": "toolu_01AuFe7DCGWfBRzpdYx8kE3X.json",
  "rn":     "toolu_01LDpFmbiU4KdHCyDyzop86u.json",
  "design": "toolu_01ByNneYT8GzMLZXgiPKwgzz.json",
}
def get_text(p):
    with open(p) as f: data = json.load(f)
    # data is a list of {type,text}
    if isinstance(data, list):
        return "\n".join(b.get("text","") for b in data if isinstance(b,dict))
    return json.dumps(data)
def extract_json(text):
    # find ```json ... ``` (greedy to last fence)
    m = re.search(r"```json\s*(.*?)```", text, re.S)
    if not m:
        # maybe no closing fence; take from ```json to end
        m2 = re.search(r"```json\s*(.*)", text, re.S)
        if m2: return m2.group(1)
        return None
    return m.group(1)
out = {}
for k,fn in files.items():
    p = os.path.join(TR, fn)
    txt = get_text(p)
    js = extract_json(txt)
    if js is None:
        print(f"{k}: NO JSON BLOCK FOUND (len text {len(txt)})"); continue
    try:
        obj = json.loads(js)
    except Exception as e:
        # try trimming trailing junk after last }
        last = js.rfind("}")
        obj = json.loads(js[:last+1])
    out[k]=obj
    with open(f".tmp/sprint01-expansion/{k}.json","w") as f: json.dump(obj,f,indent=2)
    # summarize
    if k=="design":
        dt=obj.get("design_tasks",[]); en=obj.get("design_enrichments",[])
        ids=[t.get("id") or t.get("task_id") for t in dt]
        print(f"design: {len(dt)} design_tasks {ids}, {len(en)} enrichments")
    else:
        et=obj.get("expanded_tasks",[])
        ids=[t.get("task_id") or t.get("id") for t in et]
        print(f"{k}: {len(et)} expanded_tasks {ids}")
