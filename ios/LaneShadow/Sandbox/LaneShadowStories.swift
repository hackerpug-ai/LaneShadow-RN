import NativeSandbox
import SwiftUI

@MainActor
enum LaneShadowStories {
    static let all: [Story] = [
        Story(
            id: "atoms.hello.world",
            tier: .atom,
            component: "HelloWorld",
            name: "Hello World",
            summary: "Your first sandbox story."
        ) { _ in
            Text("Hello from LaneShadow!")
        },
    ]
}
