// native-sandbox: configured
import LaneShadowTheme
import NativeSandbox
import SwiftUI

@main
struct LaneShadowApp: App {
    @State private var convexStore = ConvexStore()
    @State private var sandboxPresentation = LaneShadowSandboxPresentation.initial()

    init() {
        #if DEBUG
            SandboxLaunch.configure(.init(
                argFlags: ["-LaneShadowSandbox"],
                envKeys: ["LANESHADOW_LAUNCH_SANDBOX"]
            ))
        #endif
    }

    var body: some Scene {
        WindowGroup {
            Group {
                #if DEBUG
                    if sandboxPresentation.isPresented {
                        LaneShadowSandboxEntry(selectedStoryId: sandboxPresentation.storyId)
                    } else {
                        RootView(convexStore: convexStore)
                            .environment(\.appEnvironment, AppEnvironment.live())
                            .laneShadowTheme()
                    }
                #else
                    RootView(convexStore: convexStore)
                        .environment(\.appEnvironment, AppEnvironment.live())
                        .laneShadowTheme()
                #endif
            }
            #if DEBUG
            .onOpenURL { url in
                    if let presentation = LaneShadowSandboxPresentation.from(url: url) {
                        sandboxPresentation = presentation
                    }
                }
            #endif
        }
    }
}

struct LaneShadowSandboxPresentation: Equatable {
    let isPresented: Bool
    let storyId: String?

    static func initial(validStoryIds: Set<String>? = nil) -> LaneShadowSandboxPresentation {
        from(
            arguments: ProcessInfo.processInfo.arguments,
            environment: ProcessInfo.processInfo.environment,
            validStoryIds: validStoryIds
        )
    }

    static func from(
        arguments: [String],
        environment: [String: String],
        validStoryIds: Set<String>? = nil
    ) -> LaneShadowSandboxPresentation {
        let requestedStoryId = requestedStoryId(from: arguments)?.takeIf { storyId in
            validStoryIds?.contains(storyId) ?? true
        }
        let shouldPresent =
            arguments.contains("-LaneShadowSandbox") ||
            environment["LANESHADOW_LAUNCH_SANDBOX"] == "1" ||
            requestedStoryId != nil

        return LaneShadowSandboxPresentation(
            isPresented: shouldPresent,
            storyId: requestedStoryId
        )
    }

    static func from(url: URL, validStoryIds: Set<String>? = nil) -> LaneShadowSandboxPresentation? {
        guard SandboxLaunch.handleURL(url) else {
            return nil
        }

        let requestedStoryId =
            URLComponents(url: url, resolvingAgainstBaseURL: false)?
                .queryItems?
                .first(where: { $0.name == "id" })?
                .value?
                .trimmingCharacters(in: .whitespacesAndNewlines)
                .takeIf { id in
                    !id.isEmpty && (validStoryIds?.contains(id) ?? true)
                }

        return LaneShadowSandboxPresentation(
            isPresented: true,
            storyId: requestedStoryId
        )
    }

    private static func requestedStoryId(from arguments: [String]) -> String? {
        guard let index = arguments.firstIndex(of: "-SandboxStoryId") else {
            return nil
        }

        let valueIndex = arguments.index(after: index)
        guard valueIndex < arguments.endIndex else {
            return nil
        }

        return arguments[valueIndex]
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .takeIf { !$0.isEmpty }
    }
}

private extension String {
    func takeIf(_ predicate: (String) -> Bool) -> String? {
        predicate(self) ? self : nil
    }
}
