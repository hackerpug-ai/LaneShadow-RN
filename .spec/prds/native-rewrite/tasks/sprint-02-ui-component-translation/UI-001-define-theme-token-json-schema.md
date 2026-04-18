# UI-001: Define theme token JSON schema (source of truth)

**Task ID:** UI-001
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** frontend-designer
**Reviewer:** frontend-designer
**Estimate:** 240 min
**Type:** [FEATURE] [INFRA]
**Status:** Planned
**Phase:** Foundation — Token Schema
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios. Before any component translation begins, all three UI stacks (RN, iOS, Android) must consume identical semantic theme tokens. This task defines the **single JSON source of truth** for those tokens — schema, values, and validation rules — without any platform code generation or enforcement. iOS and Android enforcement are split into the two follow-up tasks (UI-002 and UI-002B).

**Objective:** Produce a versioned, machine-validated JSON schema describing every semantic token category (color, spacing, typography, radius, elevation, motion, opacity) plus a populated token document that conforms to it.

**Success State:** A reviewer can read the schema, validate the token document against it with a single command, and reference the resulting JSON as the unambiguous contract for downstream iOS and Android enforcement tasks.

## CRITICAL CONSTRAINTS

### MUST
- Produce exactly one JSON Schema (Draft 2020-12) describing the full theme token surface.
- Produce exactly one token document (`tokens/theme.json`) populated with current LaneShadow semantic values, light and dark variants.
- Use DTCG-aligned naming so the same token names are addressable from RN, Swift, and Kotlin without renames.
- Provide a CLI command (`pnpm tokens:validate`) that validates `tokens/theme.json` against the schema and exits non-zero on drift.
- Document the contract surface (categories, naming, value types, light/dark structure) in `.spec/prds/native-rewrite/08-design-system.md`.

### NEVER
- Generate platform code (Swift, Kotlin, TypeScript) in this task — that is owned by UI-002 and UI-002B.
- Add Style Dictionary, build pipelines, or codegen tooling here.
- Allow ad-hoc, ungoverned token additions (every key must be covered by the schema).

### STRICTLY
- Any deviation from DTCG naming conventions must be called out as an explicit waiver in the design-system doc.
- Light and dark must be expressed as parallel structures with identical key sets.

## DELIVERABLES

- `tokens/theme.schema.json` — JSON Schema (Draft 2020-12)
- `tokens/theme.json` — populated token document conforming to schema
- `tokens/README.md` — short usage notes (validate command, layout, versioning)
- `package.json` — `tokens:validate` script
- `.spec/prds/native-rewrite/08-design-system.md` — schema contract section

## ACCEPTANCE CRITERIA

### AC-1
**GIVEN** No machine-validated token contract exists today.
**WHEN** UI-001 is complete.
**THEN** A JSON Schema at `tokens/theme.schema.json` describes every semantic category (color, spacing, typography, radius, elevation, motion, opacity) with strict types and required fields.
**Verify:** `node -e "const s=require('./tokens/theme.schema.json');for(const k of ['color','spacing','typography','radius','elevation','motion','opacity'])if(!s.properties[k])throw new Error('missing '+k)"`

### AC-2
**GIVEN** The schema must be authoritative.
**WHEN** A populated `tokens/theme.json` is provided.
**THEN** Running `pnpm tokens:validate` validates `tokens/theme.json` against `tokens/theme.schema.json` and exits 0; mutating any required key to a wrong type causes exit non-zero.
**Verify:** `pnpm tokens:validate`

### AC-3
**GIVEN** Three platforms must consume identical token names.
**WHEN** Naming and structure are reviewed.
**THEN** Token paths follow DTCG-aligned naming (e.g., `color.surface.background`, `spacing.scale.4`) with identical key sets across `light` and `dark` variants.
**Verify:** `node -e "const t=require('./tokens/theme.json');const k=o=>Object.keys(o).sort().join(',');for(const c of Object.keys(t))if(t[c].light&&k(t[c].light)!==k(t[c].dark))throw new Error('parity '+c)"`

### AC-4
**GIVEN** Downstream UI-002 and UI-002B will enforce the schema natively.
**WHEN** The contract is documented.
**THEN** `08-design-system.md` contains a "Token Schema Contract" section describing the schema location, validation command, naming rules, light/dark parity rule, and the two downstream enforcement tasks.
**Verify:** `rg -n "Token Schema Contract|tokens/theme.schema.json|UI-002|UI-002B" .spec/prds/native-rewrite/08-design-system.md`

## TEST CRITERIA

| ID | Maps To | Boolean Statement | Verify |
|---|---|---|---|
| TC-1 | AC-1 | Schema covers every required semantic category. | `node -e "const s=require('./tokens/theme.schema.json');for(const k of ['color','spacing','typography','radius','elevation','motion','opacity'])if(!s.properties[k])throw new Error('missing '+k)"` |
| TC-2 | AC-2 | Validation command passes for the conforming document and fails for a malformed mutation. | `pnpm tokens:validate` |
| TC-3 | AC-3 | Light and dark variants share identical key sets. | `node -e "const t=require('./tokens/theme.json');const k=o=>Object.keys(o).sort().join(',');for(const c of Object.keys(t))if(t[c].light&&k(t[c].light)!==k(t[c].dark))throw new Error('parity '+c)"` |
| TC-4 | AC-4 | Schema contract is documented in the design-system spec. | `rg -n "Token Schema Contract\|tokens/theme.schema.json\|UI-002\|UI-002B" .spec/prds/native-rewrite/08-design-system.md` |
| TC-5 | ALL | Repo validation gates remain green. | `pnpm typecheck && pnpm lint` |

## READING LIST

1. `.spec/prds/native-rewrite/README.md`
2. `.spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md`
3. `.spec/prds/native-rewrite/08-design-system.md`
4. `.spec/prds/native-rewrite/08d-component-parity-spec.md`
5. `react-native/styles/theme.ts`
6. `RULES.md`

## GUARDRAILS

### WRITE-ALLOWED
- `tokens/**`
- `package.json` (only the `tokens:validate` script entry)
- `.spec/prds/native-rewrite/08-design-system.md`

### WRITE-PROHIBITED
- `ios/**`
- `android/**`
- `react-native/**`
- `server/**`

### MUST
- Keep this task JSON-only — schema, document, validation command, and doc updates.
- Use DTCG-aligned naming so iOS and Android enforcement can map directly.

### MUST NOT
- Do not introduce code generators, Style Dictionary, or platform output formats.
- Do not modify React Native, iOS, or Android source trees.

## CODE PATTERN

**Reference:** JSON Schema Draft 2020-12, DTCG token format.

**Pattern:** `tokens/theme.schema.json` declares categories and value shapes with `additionalProperties: false`. `tokens/theme.json` is a single object conforming to the schema. `pnpm tokens:validate` runs a small Node script (using `ajv` already in the dependency tree) that loads schema + document and exits non-zero on validation errors.

**Anti-pattern:** Splitting tokens across multiple files, embedding platform-specific values, allowing free-form keys via `additionalProperties: true`.

## DESIGN NOTES

- Color tokens must declare both `light` and `dark` variants with identical key sets so iOS/Android can switch by trait collection / theme without runtime branching.
- Spacing, radius, elevation, motion, opacity are scalar scales (single value per token) — no light/dark variants required.
- Typography tokens carry `family`, `weight`, `size`, `lineHeight`, `letterSpacing`.

## VERIFICATION GATES

- `pnpm tokens:validate`
- `pnpm typecheck`
- `pnpm lint`

## DEPENDENCIES

- None (foundation task)

## CODING STANDARDS

- `.spec/prds/native-rewrite/08-design-system.md` — token contract surface
- `.spec/prds/native-rewrite/08d-component-parity-spec.md` — token consumption rules

## OUT OF SCOPE

- iOS native enforcement (UI-002).
- Android native enforcement (UI-002B).
- Style Dictionary, Swift/Kotlin code generation, or RN consumption refactor.
