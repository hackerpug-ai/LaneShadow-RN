// native-sandbox: configured
import NativeSandbox

/// Debug-only sandbox launch configuration.
/// Configures SandboxLaunch to detect launch arguments and environment variables
/// for opening the sandbox instead of the main app UI.
///
/// This is called from the app's main entry point during initialization when
/// DEBUG is enabled.
public enum SandboxLaunchConfig {
    /// Configure sandbox launch detection with LaneShadow-specific arguments
    /// and environment variables.
    public static func configure() {
        #if DEBUG
            SandboxLaunch.configure(.init(
                argFlags: ["-LaneShadowSandbox"],
                envKeys: ["LANESHADOW_LAUNCH_SANDBOX"]
            ))
        #endif
    }
}
