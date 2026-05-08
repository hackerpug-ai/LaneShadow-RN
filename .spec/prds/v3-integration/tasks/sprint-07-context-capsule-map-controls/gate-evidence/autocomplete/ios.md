# Autocomplete iOS Evidence

Date: 2026-05-07
Platform: iPhone 16 Simulator

Command:

```sh
xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSContextCapsuleTests -only-testing:LaneShadowTests/LSMapControlsTests -only-testing:LaneShadowTests/LSMapTests -only-testing:LaneShadowTests/LSMapLayerTests -only-testing:LaneShadowTests/IdleScreenRetrofitTests -only-testing:LaneShadowTests/IdlePlaceAutocompleteTests -only-testing:LaneShadowTests/IdleScreenWiringTests
```

Result: PASS / Exit 0

Artifact:

- `/Users/justinrich/Library/Developer/Xcode/DerivedData/LaneShadow-fxepxmvohisivphhyngnkmuxdbyh/Logs/Test/Test-LaneShadow-2026.05.07_21-10-28--0700.xcresult`

Autocomplete coverage:

- `IdlePlaceAutocompleteTests` passed as part of the selected Swift unit set.
- The tests cover typed idle input queries, max-three recommendations, accessible recommendation rows, stale response handling, recoverable failures, selection priming, and no planning before explicit Send.
- Big Sur path: automated test coverage verifies that recommendation selection primes the input while keeping the app out of planning until Send. Manual physical-device observation was not performed in this run.

