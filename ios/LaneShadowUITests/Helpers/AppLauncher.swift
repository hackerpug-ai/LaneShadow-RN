import XCTest

enum AppLauncher {
    @MainActor
    static func launchApp(
        _ app: XCUIApplication,
        sandbox: Bool = false,
        sandboxStoryId: String? = nil,
        resetAuth: Bool = false,
        bypassAuth: Bool = false,
        e2eSignIn: Bool = false,
        directIdleScreen: Bool = false
    ) {
        let shouldLaunchSandbox = sandbox || sandboxStoryId != nil
        app.launchEnvironment["LANESHADOW_LAUNCH_SANDBOX"] = shouldLaunchSandbox ? "1" : "0"
        forwardRuntimeEnvironment(to: app)
        var arguments = ["-UITesting"]
        if shouldLaunchSandbox {
            arguments.append("-LaneShadowSandbox")
        }
        if let sandboxStoryId {
            arguments += ["-SandboxStoryId", sandboxStoryId]
        }
        if resetAuth {
            arguments.append("-LaneShadowUITestResetAuth")
        }
        if bypassAuth {
            arguments.append("-LaneShadowUITestBypassAuth")
        }
        if e2eSignIn {
            arguments.append("-LaneShadowUITestE2E")
        }
        if directIdleScreen {
            arguments.append("-DirectIdleScreenUITest")
        }
        app.launchArguments = arguments
        app.launch()
    }

    @MainActor
    private static func forwardRuntimeEnvironment(to app: XCUIApplication) {
        let environment = ProcessInfo.processInfo.environment
        let dotEnv = loadDotEnvLocal()
        NSLog(
            "🔵 AppLauncher: dotEnv has \(dotEnv.count) entries; CLERK_TEST_EMAIL present: \(dotEnv["CLERK_TEST_EMAIL"] != nil)"
        )

        // Hardcoded Mailosaur test inbox fallback for real-device E2E
        let fallbacks: [String: String] = [
            "CLERK_TEST_EMAIL": "e2e-login@jjrnshw9.mailosaur.net",
            "CLERK_TEST_PASSWORD": "test-password-123"
        ]

        for key in [
            "CLERK_PUBLISHABLE_KEY",
            "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY",
            "CONVEX_URL",
            "EXPO_PUBLIC_CONVEX_URL",
            "CLERK_TEST_EMAIL",
            "CLERK_TEST_PASSWORD"
        ] {
            let value = environment[key] ?? dotEnv[key] ?? fallbacks[key] ?? ""
            guard !value.isEmpty else {
                NSLog("🔵 AppLauncher: SKIP \(key) (empty)")
                continue
            }
            app.launchEnvironment[key] = value
            NSLog("🔵 AppLauncher: SET \(key) (len=\(value.count))")
        }
    }

    private static func loadDotEnvLocal() -> [String: String] {
        let envPath = "/Users/justinrich/Projects/LaneShadow/.env.local"
        guard let content = try? String(contentsOfFile: envPath, encoding: .utf8) else {
            return [:]
        }
        var result: [String: String] = [:]
        for line in content.components(separatedBy: .newlines) {
            let trimmed = line.trimmingCharacters(in: .whitespaces)
            guard !trimmed.isEmpty, !trimmed.hasPrefix("#"),
                  let equalsIndex = trimmed.firstIndex(of: "=") else { continue }
            let key = String(trimmed[..<equalsIndex]).trimmingCharacters(in: .whitespaces)
            var value = String(trimmed[trimmed.index(after: equalsIndex)...])
                .trimmingCharacters(in: .whitespaces)
            // Strip surrounding quotes
            if (value.hasPrefix("\"") && value.hasSuffix("\"")) ||
                (value.hasPrefix("'") && value.hasSuffix("'")) {
                value = String(value.dropFirst().dropLast())
            }
            result[key] = value
        }
        return result
    }
}
