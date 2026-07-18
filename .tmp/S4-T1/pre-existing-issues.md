# S4-T1 — pre-existing gate failures (typecheck RED, lint RED)

Both `pnpm type-check` (exit 1) and `pnpm exec biome check` (exit 1) are RED in this
worktree. **Neither is caused by S4-T1.** Evidence and root cause below.

## 1. `pnpm type-check` — 10 errors — ROOT CAUSE IDENTIFIED

The dispatch briefed these as 10 genuine type defects in three Convex files, to be
"fixed at root cause". Investigation shows that framing is **incorrect**: the three
files are correct, and the errors are an artifact of the **root `tsconfig.json`
missing `strict`**.

### Proof

`pnpm type-check` runs two projects:

```
"type-check": "tsc --noEmit -p convex/tsconfig.json && tsc --noEmit -p tsconfig.json"
```

| Project | `strict` | Result |
|---|---|---|
| `convex/tsconfig.json` | `true` | **exit 0 — clean.** All 10 "errors" absent. |
| root `tsconfig.json` (extends `expo/tsconfig.base`) | **never set → `false`** | all 10 errors |

Confirmed with `tsc -p tsconfig.json --showConfig` → `strict: NOT SET -> false`.

### Mechanism

With `strictNullChecks: false`, `undefined` is assignable to every type, so zod v3's
`requiredKeys<T>` helper — `{[k in keyof T]: undefined extends T[k] ? never : k}` —
evaluates to `never` for **every** key. Consequences:

- `z.infer` degrades: every property becomes optional
  (`{lat: number}` → `{lat?: number}`) → the `spikeTools.ts:229` error.
- `keyof` of such a type collapses to `never` → the nine
  `Argument of type '"sessionId"' is not assignable to parameter of type 'never'`
  errors in `rideAgentSpike.ts`.
- Discriminated-union narrowing on the zod-derived result degrades → the
  `zaiProvider.ts:204` `'reason' does not exist` error.

Minimal reproduction (3 lines, no project code), checked under the root config:

```ts
import { z } from 'zod'
const s = z.object({ lat: z.number(), lng: z.number() })
const check: { lat: number; lng: number } = null as unknown as z.infer<typeof s>
```

→ `error TS2322: Type '{ lat?: number; lng?: number; }' is not assignable to
type '{ lat: number; lng: number; }'` — byte-identical to the reported
`spikeTools.ts:229` error. The same file is clean with `--strictNullChecks`.

### Why the Convex files are in the root program at all

The root `tsconfig.json` **explicitly excludes** `convex/actions/**`. That exclude is
ineffective: `exclude` only filters the `include` glob, it cannot drop files reached by
**import**. `tsc --explainFiles` shows:

```
convex/actions/agent/lib/zaiProvider.ts
  Imported via "../actions/agent/lib/summarizeForContext.js" from file 'convex/_generated/api.d.ts'
```

Convex's generated `api.d.ts` references every server module, so the whole Convex
server graph is pulled into the root (app) program and checked under Expo's
non-strict settings — settings it was never written for and which Convex itself does
not use.

### There is no in-scope fix

The nine `rideAgentSpike.ts` errors pass a `string` to a parameter whose type is
literally `never`. **No value of any type can satisfy `never`** — the only way to
silence them at the source is a cast (`as never`/`as any`), which is forbidden and
would be papering over a config defect. `spikeTools.ts:229` already correctly guards
`if (!inputData.center)`; only the *inner* `lat`/`lng` degraded.

### The real fix (out of scope for S4-T1)

Add `"strict": true` to the root `tsconfig.json` (Expo's own default template ships
this; this project's config omits it). Verified effect:

- Convex errors: **10 → 0**
- Newly surfaced: **26 real latent null-safety bugs** in 7 app/RN files —
  `app/(app)/saved-route/[id].tsx` (12), `app/(app)/(tabs)/saved-routes.tsx` (4),
  `app/(auth)/sign-in.tsx` (2), `components/map/route-summary-carousel.tsx` (2),
  `components/settings/favorite-roads-section.tsx` (2),
  `hooks/use-curated-discovery.ts` (2), `stores/offline-store.ts` (2).

Those 26 are genuine bugs (e.g. `data.routeSnapshot` is possibly `undefined` and
would crash at runtime), but fixing them requires **UI-semantics decisions** (what
renders when a snapshot is absent) in the React-Native domain — outside
`SCOPE.writeAllowed`, outside this task, and not reviewable by `convex-reviewer`.

**Recommended follow-up task:** `react-native-ui-implementer` — enable `strict: true`
on the root tsconfig and fix the 26 revealed null-safety bugs. This unblocks the
`pnpm type-check` gate for **every** task in the sprint, not just S4-T1.

## 2. `pnpm exec biome check` — 19 errors — pre-existing, untouched

All 19 are in `app/index.tsx` and
`app/(app)/(tabs)/index.footer-visibility-simple.test.tsx`.

- **Zero** are in S4-T1 files. Biome over the 10 files S4-T1 changed:
  **0 errors** (15 warnings only).
- `app/index.tsx` is **byte-identical to `main@1b431453`** (verified by `diff` against
  `git show 1b431453:app/index.tsx`) — S4-T1 never touched it.
- The pre-commit `biome` job only lints `{staged_files}`, so these do not gate an
  S4-T1 commit.

## 3. Note on the commit gate in this worktree

`core.hooksPath=.husky/_`, but `.husky/_` **does not exist in this worktree** (it is
gitignored and generated by husky's `prepare` script, which only ran in the primary
checkout). Git hooks therefore **silently do not run for commits made in
`.kb-run-sprint/worktrees/*`** — every worktree commit is an implicit `--no-verify`
with no warning. Commits made here are NOT gate-verified; the gates above were run
manually and reported honestly.
