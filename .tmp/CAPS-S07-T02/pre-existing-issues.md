# Pre-Existing Issues Observed During Verification

## Android Lint / `detekt` Gate
- `android/app/src/main/java/com/laneshadow/data/location/FusedLocationProviderImpl.kt:37` — `MissingPermission` on `fusedLocationClient.lastLocation.await()`

## Notes
- `pnpm type-check:native` passed.
- `pnpm lint` passed.
- `:app:assembleDebug` passed.
- `adb devices` returned no attached emulator/device, so screenshot capture was blocked in this worktree session.
