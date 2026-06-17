# Autocomplete Backend Evidence

Date: 2026-05-07

Command:

```sh
pnpm exec vitest run convex/__tests__/places-autocomplete.test.ts --exclude '.kb-run-sprint/**'
```

Result: PASS / Exit 0

Summary:

- 1 test file passed.
- 6 tests passed.
- Covered max-three suggest behavior, Search Box request shaping, retrieve behavior, and typed upstream failure handling without leaking `MAPBOX_ACCESS_TOKEN`.

Output summary:

```text
convex/__tests__/places-autocomplete.test.ts (6 tests) 40ms
Test Files  1 passed (1)
Tests       6 passed (6)
```

