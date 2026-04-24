Host remediation for ALIGN-01 after iteration 002 review:

- Expand `drift-report.md` into a complete audit of the unresolved theme drift instead of a selective spot-check report.
- Add discrete rows for missing `radius.*`, `opacity.*`, `size.control-*`, and `size.avatar-*` families.
- Replace grouped `space.0...space.12` prose with one naming-mismatch row per key.
- Add naming-mismatch coverage for `size.icon-*`, including the Android `size.icon-md` value drift.
- Remove extra prose uses of the exact string `sizing.stroke` so the AC-3 verifier returns the expected `3`.
- Add an explicit legacy-dependency section that documents theme-vs-dimensions schema splits blocking second-theme migration.
