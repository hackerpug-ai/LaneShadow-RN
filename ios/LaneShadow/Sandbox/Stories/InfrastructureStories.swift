import NativeSandbox

/// Infrastructure tier stories for the LaneShadow sandbox.
///
/// Pure reducer — delegates to per-component story files under Infrastructure/.
@MainActor
enum InfrastructureStories {
    static let all: [Story] = PlaceholderInfrastructureStories.all + InfrastructureControlsStories.all
}
