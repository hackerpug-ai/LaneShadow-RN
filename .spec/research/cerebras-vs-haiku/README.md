# Cerebras (llama3.1-8b / zai-glm-4.7) vs Anthropic Haiku — Agent Invocation Comparison

**Purpose:** Validate that `cerebras / llama3.1-8b` is sufficient for LaneShadow's `low` intelligence tier (routing, search, enrichment sub-agents) before committing to the migration in `.spec/proposals/cerebras-provider-migration.md` + Epic 0. Compare against `zai-glm-4.7` (candidate `high` tier) and the current production baseline `claude-haiku-4-5` (sub-agents) and `claude-sonnet-4-6` (orchestrator).

**Why this matters:** `llama3.1-8b` is ~20× cheaper than Haiku ($0.10/$0.10 vs $0.80/$4 per 1M tokens) and has a 32K context window. If it can reliably pick the right tool, pass correct arguments, and return concise answers for our actual agent prompts, the migration saves real money. If it hallucinates tool names, mangles JSON, or refuses to tool-call when it should, we either (a) fall back to a more capable Cerebras model for `low`, or (b) keep Anthropic for `low` and use Cerebras only for `high`.

## Scope

Four real prompts extracted verbatim from `convex/actions/agent/agents/`:

| Fixture | Source Agent | Level | Tier Under Test |
|---------|--------------|-------|-----------------|
| `routing_agent.json` | `routingAgent.ts:1033` (buildRoutingPrompt) | low | llama3.1-8b |
| `search_agent.json` | `searchAgent.ts:53` (buildSearchPrompt) | low | llama3.1-8b |
| `enrichment_agent.json` | `enrichmentAgent.ts:174` (buildEnrichmentPrompt) | low | llama3.1-8b |
| `orchestrator.json` | `orchestrator.ts:120` (buildOrchestratorPrompt) | high | zai-glm-4.7 |

Each fixture bundles the real system prompt + real tool schemas (from `AgentToolSchemas`) + a set of representative user messages covering the common paths the agent will see in production.

## Models tested

| Model | Provider | Role in comparison |
|-------|----------|--------------------|
| `llama3.1-8b` | cerebras | **Candidate for `low` tier** |
| `zai-glm-4.7` | cerebras | Candidate for `high` tier (and `low` upgrade path if llama3.1 fails) |
| `claude-haiku-4-5-20251001` | anthropic | Production baseline for sub-agents |
| `claude-sonnet-4-6` | anthropic | Production baseline for orchestrator |

## How to run

```bash
# From repo root
cd .spec/research/cerebras-vs-haiku

# Install deps (isolated venv)
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# API keys — set in your shell or export here
export CEREBRAS_API_KEY=...   # https://cloud.cerebras.ai
export ANTHROPIC_API_KEY=...

# Run all fixtures against all models
python run_comparison.py

# Outputs land in ./results/<timestamp>/
#   - raw_responses.jsonl    (one line per model × fixture × user_message)
#   - summary.md             (side-by-side markdown comparison)
```

Single-fixture runs:

```bash
python run_comparison.py --fixture routing_agent
python run_comparison.py --fixture routing_agent --models llama3.1-8b,claude-haiku-4-5
```

## What we're grading

For each (model, fixture, user_message) we record and grade:

1. **Tool selection** — did it call the right tool? (or correctly decline to call one)
2. **Tool arguments** — are args valid against the declared JSON schema?
3. **JSON-mode obedience** — for routingAgent, does the final response include the `{"status": ...}` JSON envelope the prompt demands?
4. **Conciseness** — the prompts all say "1-2 sentences"; does the model actually comply?
5. **Latency** — end-to-end ms (cloud roundtrip, not just token gen)
6. **Cost** — computed from published $/1M input + output rates

Then `summary.md` pivots the results so you can scan each fixture and eyeball: "did llama3.1-8b pick the right tool for 'scenic ride to Santa Cruz'? did it emit the JSON envelope? did it stay concise?"

## Verdict template

After running, fill in `VERDICT.md` with:

- **Can `llama3.1-8b` replace Haiku for all three sub-agents?** Yes / No / Conditional
- **Failure modes observed** (if any)
- **Recommendation for `MODEL_MAP.low`**: `llama3.1-8b` | `qwen-3-235b-a22b-instruct-2507` | `zai-glm-4.7` | keep `claude-haiku-4-5`
- **Recommendation for `MODEL_MAP.high`**: `zai-glm-4.7` | `gpt-oss-120b` | keep `claude-sonnet-4-6`

## Files

```
.spec/research/cerebras-vs-haiku/
├── README.md                       # this file
├── VERDICT.md                      # written after running (TODO until results exist)
├── requirements.txt                # python deps
├── run_comparison.py               # the harness
├── fixtures/
│   ├── routing_agent.json          # buildRoutingPrompt + routingTools + user messages
│   ├── search_agent.json           # buildSearchPrompt + searchTools + user messages
│   ├── enrichment_agent.json       # buildEnrichmentPrompt + enrichmentTools + user messages
│   └── orchestrator.json           # buildOrchestratorPrompt + orchestrator tools + user messages
├── models.json                     # model registry for the harness
└── results/
    └── <timestamp>/
        ├── raw_responses.jsonl
        └── summary.md
```

## Known caveats

- **32K context window** on llama3.1-8b. Sub-agent prompts are ~300-600 tokens and sub-agents run with NO conversation history (see `searchAgent.ts:140`), so this is fine for steady state. The harness will flag any fixture that exceeds 16K tokens so we can catch edge cases.
- **Tool-calling format divergence.** Cerebras is OpenAI-compatible (`tools` + `tool_choice`), Anthropic uses its own `tools` block. The harness abstracts this in `run_comparison.py` — same semantic inputs, adapter-specific wire format.
- **Temperature=0 enforcement.** All calls use temperature=0 to match production (`P4` hard constraint per `.spec/prds/curation/tasks/epic-2-scraping-llm-apis/CONVEX-006.md`).
- **This does NOT test the Convex runtime.** It hits provider APIs directly. The assumption is that `@mariozechner/pi-ai` passes `tools` + `tool_choice` through faithfully; if the Convex-bundled path behaves differently we'd catch it only in a staging smoke test.
