import NativeSandbox

/// Top-level story registry — pure reducer over six tier aggregators.
/// No Story literals are declared here; each tier file delegates to per-component files.
@MainActor
enum LaneShadowStories {
    static let all: [Story] =
        AtomsStories.all
            + MoleculesStories.all
            + OrganismStories.all
            + TemplateStories.all
            + ModifierStories.all
            + InfrastructureStories.all
}
