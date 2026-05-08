# Autocomplete Android Evidence

Date: 2026-05-07
Platform: Android unit test JVM

Command:

```sh
./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSContextCapsuleTest' --tests 'com.laneshadow.ui.organisms.LSMapControlsTest' --tests 'com.laneshadow.ui.organisms.LSMapLayerTest' --tests 'com.laneshadow.ui.templates.IdleScreenRetrofitTest' --tests 'com.laneshadow.ui.idle.IdleViewModelTest' --tests 'com.laneshadow.ui.idle.IdlePlaceAutocompleteTest' --tests 'com.laneshadow.ui.sandbox.AppStoriesRegistryTest' --tests 'com.laneshadow.services.ConvexClientProviderTest'
```

Result: PASS / Exit 0

Summary:

- `IdlePlaceAutocompleteTest` passed inside the selected Android Sprint 7 test set.
- The selected set also validates the context capsule, map controls, map-layer audit coverage, idle retrofit, ViewModel clock/capsule behavior, story registry, and Convex client provider behavior.
- Initial run failed in `IdleViewModelTest.greeting_scope_morning_returns_today` because the test `timeProvider` was assigned after `init` launched collectors. Fixed by moving runtime hooks into the primary construction path, then reran successfully.

Device/emulator status:

- BLOCKED for connected-device visual/manual evidence. `adb devices` returned no connected emulator or device.
- Follow-up owner: Android QA/human device runner should run the Big Sur idle-input walkthrough on an emulator/device and attach screenshots if physical evidence is still required.

