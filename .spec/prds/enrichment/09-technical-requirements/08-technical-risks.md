---
stability: CONSTITUTION
last_validated: 2026-07-10
prd_version: 1.0.0
---

# Technical Risks

| # | Risk | Mitigation |
|---|------|------------|
| R1 | **Hallucination** — invented businesses/history/vistas destroys rider trust (Rachel abandons; R2 auto-fails) | Two-layer QA gate: deterministic lint (banned claims, score-consistency) + cross-provider LLM grounding verifier; any unsupported claim ⇒ `qa_failed` ⇒ honest absence; regenerate-once then stop. R2 couch test as human backstop. |
| R2 | **z.ai provider failure** — FIX-001 precedent: HTTP 429 "Insufficient balance" broke the agent's high tier in this repo | Fail-closed per route + resumable cursor + halt after N consecutive provider errors. **Never silent model substitution.** Balance check before the full run. |
| R3 | **`glm-5.2` not in installed pi-ai registry** (tops out at glm-5.1/glm-5-turbo) | Bump pi-ai (preferred) or registry-override Model literal; either path proven with one real api.z.ai completion before batch. |
| R4 | **Env-var name mismatch** — pi-ai auto-lookup wants `ZAI_API_KEY`, repo has `Z_AI_API_KEY`; deployment env ≠ `.env.local` | Explicit `apiKey` pass from `convex/lib/env.ts`; deployment `npx convex env set` step in the wiring checklist; a missing key fails loudly at action start, not mid-batch. |
| R5 | **Staleness drift** — Trust-wave re-geocodes/drops and later curation invalidate generated text | Sequenced AFTER the drop; eligibility gate `geometryStatus='generated'`; `inputsContentHash` flags stale; stale keeps serving last QA-passed text (no rider-facing lie, no gap). |
| R6 | **Thin-grounding routes (~32%)** produce generic filler or invented color | Explicit `thinGrounding` flag constrains the prompt (attribute-only claims); abstention is a recorded state; couch-test sample must include ≥2 thin routes. |
| R7 | **Prompt-version drift** — silent prompt edits make the corpus incoherent | `promptVersion` + `model` stamped per row and folded into the hash; a bump triggers bounded full regen (~$1-scale). |
| R8 | **LLM nondeterminism vs testability** | Determinism seam: UI/e2e assert against seeded fixture rows; pipeline acceptance asserts INVARIANTS (grounding, length, score-consistency) on a real-LLM sample, never exact prose. |
| R9 | **Migration breakage** — repurposed validator vs old scraper-schema consumers | 0 docs ⇒ data-safe; realign `convex/db/curation.ts` (`fetchEnrichments`, type alias) in the same change; typecheck gate. |
| R10 | **Cost overrun** | Text-first v1 ≈ low single-digit dollars total (see 01/06); paid facts (Places/elevation/vision) are explicitly deferred seams; `budgetTracker` caps per run; idempotent hash-skip prevents duplicate spend. |
| R11 | **Coverage illusion** — "looks done" while half the catalog is absent/abstained | `coverageReport` computed live from table state; R1 verdict is a measured number surfaced to the Operator, and the FOUNDER-BAR R-leg checkbox cites it. |
