---
title: "When to Use LLM Agents vs Deterministic Logic"
date: "2026-04-06"
category: "architecture"
tags: ["llm-agents", "deterministic", "decision-framework"]
status: "complete"
research_confidence: "HIGH"
---

# Agent Decision Framework: When to Use LLM vs Deterministic

## The Better Rule of Thumb

**Replace ">3 switch cases" with:**

> **"Could I write a test that covers all valid inputs?"**

- **YES** → Problem is bounded → Use deterministic code
- **NO** (infinite possibilities, semantic nuance, novel combinations) → Use LLM agent
- **BOTH** → Use hybrid: LLM for semantics, deterministic for validation

This focuses on the **nature of the problem** rather than implementation details.

## Why ">3 Cases" Failed

1. **Implementation complexity ≠ Problem nature**: A 10-case switch might be correct for bounded problems (HTTP status codes)
2. **Misses semantic dimension**: A 2-case problem might need LLM reasoning if semantically complex ("is this review toxic?")
3. **Ignores hybrid solutions**: Many problems benefit from LLM classification + deterministic handling
4. **Wrong question**: It's not "how many cases?" but "is this bounded or unbounded?"

## Bounded vs Unbounded Problems

| Bounded → Deterministic | Unbounded → LLM Agent |
|------------------------|----------------------|
| Well-defined input/output space | Poorly understood or infinite possibilities |
| Stable rules that don't change | Rules evolve or context-dependent |
| High cost of failure (financial, safety) | Failure is tolerable or recoverable |
| Performance predictability required | Latency variability acceptable |
| Auditability and explainability critical | Black-box reasoning acceptable |

**Examples:**
- **Bounded**: Payment processing, password validation, database migrations → Deterministic
- **Unbounded**: Customer support triage, route planning with natural language, code refactoring → LLM

## The Floor and Ceiling Pattern

From industry research: **"Deterministic evaluators provide the 'floor' for safety, while LLMs provide the 'ceiling' for intelligence."**

- **Floor (Deterministic)**: Hard constraints, schema validation, syntax checks, state machines, pre-commit hooks
- **Ceiling (LLM)**: Semantic understanding, creative solutions, judgment calls, nuanced recommendations

**Pattern**: LLM-authored + validated (route sketching is the canonical example)

## Use LLM Agents When

- Natural language input is the primary interface
- The problem requires semantic understanding or context
- You need to handle novel combinations of known concepts
- The solution space is too large to enumerate
- You want to iterate quickly without rewriting code
- Judgment calls are more valuable than perfect consistency

## Use Deterministic Code When

- The problem can be expressed as clear if/then rules
- Regulatory compliance requires auditability
- Performance must be predictable and fast
- The cost of errors is catastrophic
- You need to guarantee exact behavior
- The rules are stable and well-defined

## Use Hybrid When

- LLM provides the "what" (strategy, semantics, intent)
- Deterministic code provides the "how" (execution, validation, safety)
- You want both creativity AND reliability

## Observability Insight

> "LLMs don't introduce uncertainty — they make it measurable."

Retreating to "deterministic automation" doesn't eliminate risk; it hides it. Use LLMs when you need to reason about uncertainty explicitly.

---

**Research basis**: Deep research with HIGH confidence, 15 sources from industry practice (deepset, Salesforce, Anthropic), academic papers (arXiv), and practitioner communities (Reddit, LinkedIn). Full research stored in holocron: `js77ytsces9px9ektpj3p5v9jd84a18b`
