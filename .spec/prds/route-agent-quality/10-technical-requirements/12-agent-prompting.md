---
stability: CONSTITUTION
last_validated: 2026-07-11
prd_version: 3.0.1
---

# Agent Prompting — the versioned prompt artifact

How the ride agent is prompted, versioned, and change-controlled. Companion to the
tools-vs-prompting ruling in 01-architecture-posture: the prompt owns judgment (when to ask,
how to phrase, when to volunteer); everything that must always hold is a tool/code contract.

## The versioned artifact

`convex/actions/agent/prompts/orchestrator.v1.ts` exports:

```ts
export const PROMPT_VERSION = 'orchestrator@v1'
export function buildSystemPrompt(requestContext): string { … }
```

Every semantic edit bumps the filename + `PROMPT_VERSION` (v2, v3…). The version string is
stamped on every persisted assistant/system message row, on the `performance` run record,
and on every trace span — any reply is traceable to the exact prompt that produced it.

## Change control (ties to 11-e2e-testing §5c)

A prompt edit (new `PROMPT_VERSION`) is **blocked from merge until the fixtured agent-eval
lane is green** on the SLC/Ogden transcript set. The CI grep-gate that forbids provider
literals gains a companion: a diff touching `prompts/orchestrator.v*.ts` must include an
eval run artifact with zero policy violations. A **tool-schema change is treated as
prompt-affecting** (risk #19) — same gate. **A tier-map MODEL-ID change (v3.1.0)** is NOT a
`PROMPT_VERSION` bump but **requires the real-API `--smoke` lane as blocking pre-merge
evidence** — the fixtured lane replays canned turns through a `MockLanguageModel` and is
model-blind, so a model swap would otherwise ship green untested. CI also asserts
`PROMPT_VERSION` actually differs from `main` when the prompt body changed.

## Static policy vs dynamic context

- **Static** (baked into the versioned file, hash-stable across users): identity/persona
  calibration, grounding rules, tool-selection guidance, behavior policies, formatting
  contract.
- **Dynamic** (appended per-turn from `requestContext` / working memory, never versioned):
  the session location block (live / last-known / unknown — the existing three-state
  pattern), the working-memory summary (persistent constraints + resolved center), the
  saved-routes count (for "something new" awareness).

**Token budget:** static prompt ≤ ~1,000 tokens; dynamic blocks ~150–300. **Plus the 9-tool
schema tax (v3.1.0):** `createTool` Zod in/out schemas serialize into the model request EVERY
turn (`searchCuratedRoutes` alone has 6 input fields) — budget another ~900–2,000 tokens, so
real fixed per-turn context is ≈2× the ≤1,000 headline. Keep tool descriptions terse and enum
docs minimal. It rides every turn at Sonnet input pricing — keep it tight.

## Prompt skeleton (named sections; 1–2 example policy lines each — not the full prompt)

```
[IDENTITY / PERSONA-CALIBRATION]
- You are a motorcycle ride-planning agent. Match reply depth to the rider: concise
  best-options by default; expand to scores/surface/curvature only when asked.

[GROUNDING RULES]                                  (structural guarantees, restated for the model)
- Never state a route is "near" a place unless its tool-returned distanceMi is within the
  searched radius.
- Every factual claim (name, distance, score) comes from a tool result, never your memory
  of roads.

[TOOL-SELECTION GUIDANCE]
- Discovery ("scenic near Ogden") → resolve a center (session location or geocodePlace)
  THEN searchCuratedRoutes.
- A ride anchored on a stop → planRoute + searchAlongRoute; never invent the business.

[BEHAVIOR POLICIES]
  · interrogation: if no center resolves and none is in session, ask exactly ONE targeted
    question; otherwise proceed.
  · honesty: on thin coverage, state how far you searched and the nearest real option with
    its distance, and offer a custom route via planRoute.
  · reply-shape: default ≤3 options, one line each; apply stated constraints ("no highways")
    for the whole session.
  · weather: when a suggestion is tied to a stated date/time, volunteer the go/no-go from
    getRouteWeather unasked.

[FORMATTING CONTRACT]                              (must match the app's card renderer)
- Prose ≤2 sentences, 2nd person; route options render as attachment cards — do not restate
  card fields in prose.
- Close a suggestion set with the saveable/shareable next step.

[DYNAMIC — appended per turn, not versioned]
- {session location block} · {working-memory: constraints + resolved center} · {savedRoutesCount}
```
