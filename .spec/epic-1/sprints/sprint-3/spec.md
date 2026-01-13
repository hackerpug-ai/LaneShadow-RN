## Sprint 3 — Backend data flows: PlanRide action + providers + overlays


**Goal**: Implement `actions.agent.planRide` end-to-end so planning produces provider-backed, normalized route options with wind overlay support and clear error behavior.

**Backend deliverables**

- Implement `actions.agent.planRide` (action → PlannedRouteOptionsView, TRD §4.3.5) including:
  - LLM route sketching + validation (TRD §5.2 constraints)
    - **LangChain**: implement sketch generation via LangChain’s agent framework (JS/TS) using `createAgent` (+ optional `tool`s) and structured JSON outputs (see LangChain overview: `http://docs.langchain.com/oss/javascript/langchain/overview`).
    - **Schema strategy**: Convex `v` validators remain canonical for backend contracts, but the agent layer uses **Zod** for tool/agent schemas.
      - Co-locate Zod schemas **in the same `models/*.ts` files** as the `v` validators (do not create separate `*.zod.ts` files).
      - Example: `models/saved-routes.ts` exports `planInputValidator` + `planInputSchema` (Zod) side-by-side.
    - LangChain output must be validated against `routeSketchValidator` before any provider compilation.
  - Compile sketch into provider route (TRD §5.3)
  - Normalize provider output into `routeSnapshot` (TRD §3.3)
  - Compute `routeIndex` (TRD §3.4)
  - Conditions probing / wind overlay mapping with soft-fail support (TRD §6.2.10)
  - Error codes per TRD §11 (INVALID_INPUT, LLM_SKETCH_INVALID/AMBIGUOUS, ROUTING_COMPILE_FAILED, CONDITIONS_LOOKUP_FAILED)
- Implement **reliability standards** for the agentic pipeline (TRD §4.2.1):
  - timeouts on external calls (LLM / routing / weather)
  - bounded concurrency and bounded fan-out (TRD §9)
  - retry-once policy with explicit fallback behavior (validate → retry once → fallback)
  - deterministic error-code semantics (TRD §11) so the UI can map failures reliably
- Ensure planning is bounded (max 2–3 options) and avoids excessive action→query/mutation fan-out (Convex best practices).

**Acceptance criteria**

- Given valid start/end input, `planRide` returns 2–3 options with:
  - label, rationale
  - stats (distance/duration/legsCount)
  - map bounds + overviewGeometry + legs[]
  - overlaysPreview.windSummary + conditionsStatus
- Hard failures produce deterministic error codes.
- LLM sketching is implemented via LangChain agent framework (not raw provider SDK calls), consistent with LangChain’s recommended agent architecture built on LangGraph.
- Soft conditions failures still return routes with `conditionsStatus: "unavailable"`.
- External providers used by planning follow the reliability standards (timeouts, bounded concurrency, retry-once, fallback) in TRD §4.2.1.