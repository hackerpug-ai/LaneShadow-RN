# Autocomplete Manual Run-Book Status

Date: 2026-05-07

Design review: N/A. Sprint 7 design/snapshot review tasks were deleted by the user and explicitly removed from this completion scope.

Required walkthrough:

- iOS Big Sur: type `Big Sur` in the redesigned idle input, confirm max 3 recommendations, select one recommendation, confirm it primes the input, confirm no routing/no planning starts until Send.
- Android Big Sur: type `Big Sur` in the redesigned idle input, confirm max 3 recommendations, select one recommendation, confirm it primes the input, confirm no routing/no planning starts until Send.

Observed in this run:

- iOS automated evidence covers the Big Sur-style idle autocomplete behavior through `IdlePlaceAutocompleteTests`: max-three recommendations, selection priming, and no planning before Send.
- Android automated evidence covers the same contract through `IdlePlaceAutocompleteTest`; connected-device observation is BLOCKED because `adb devices` returned no attached emulator/device.

Manual status:

- iOS manual physical-device walkthrough: BLOCKED / not performed in this run.
- Android manual emulator/device walkthrough: BLOCKED / no attached emulator/device.
- No manual PASS is claimed here. The automated gate passed; human real-device evidence remains a follow-up if required by release policy.

