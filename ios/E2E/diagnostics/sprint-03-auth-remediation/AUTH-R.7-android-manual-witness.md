# AUTH-R.7 Android Evidence

Android PASS is allowed only when produced from a physical device or project-approved instrumentation artifact.

Required command:
adb devices
cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.LoginSmokeTest,com.laneshadow.ui.RootViewAuthGateEspressoTest

Physical device witness:
1. Install a debug build on a physical device.
2. Sign in with Google OAuth or email fixture auth-remediation-reviewer+clerk@laneshadow.test.
3. Confirm IdleScreen renders the Convex display name.
4. Kill/relaunch and confirm restore.
5. Sign out and confirm AuthScreen returns.

Expected artifact: Gradle connectedDebugAndroidTest output, device screenshot/video, or androidTest screenshot path.
