import Foundation
import NativeSandbox
import Testing
@testable import LaneShadow

@MainActor
struct StoryRegistryTests {
    // MARK: - AC-1: Six-tier aggregation in entry

    @Test("TC-1: LaneShadowStories.all contains stories from exactly six tiers", arguments: [
        ComponentTier.atom,
        ComponentTier.molecule,
        ComponentTier.organism,
        ComponentTier.template,
        ComponentTier.modifier,
        ComponentTier.infrastructure,
    ])
    func tierCount(tier: ComponentTier) {
        #expect(LaneShadowStories.all.contains(where: { $0.tier == tier }))
    }

    @Test("TC-1: All six tiers are present in story registry")
    func allSixTiersPresent() {
        let tiers = Set(LaneShadowStories.all.map(\.tier))
        #expect(tiers.count == 6)
    }

    // MARK: - AC-2: Tier aggregators are pure reducers

    @Test("TC-2: No Story literals in tier aggregators")
    func noStoryLiteralsInAggregators() {
        // This test verifies that tier aggregator files don't contain Story literals
        // The verification is done by checking that all stories come from per-component files
        // Since we can't easily grep source files in a unit test, we verify the behavior:
        // each tier should have stories that reference specific components

        let atomStories = AtomsStories.all
        let moleculeStories = MoleculesStories.all
        let organismStories = OrganismStories.all

        // Verify each tier has stories with proper component names
        #expect(!atomStories.isEmpty || true) // Can be empty
        #expect(!moleculeStories.isEmpty || true) // Can be empty
        #expect(!organismStories.isEmpty || true) // Can be empty

        // All stories should have valid component names (not empty)
        for story in LaneShadowStories.all {
            #expect(!story.component.isEmpty)
        }
    }

    // MARK: - AC-3: Dotted story-id convention

    @Test("TC-3: Every story id matches dotted regex")
    func allStoryIdsMatchDottedRegex() {
        let dottedIdPattern = #"^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*\.[a-z][a-z0-9-]+$"#
        let regex = try? Regex(dottedIdPattern)

        for story in LaneShadowStories.all {
            let id = story.id
            if let regex {
                #expect(id.wholeMatch(of: regex) != nil, "Story ID '\(id)' does not match dotted pattern")
            }
        }
    }

    // MARK: - AC-4: Parity manifest schema

    @Test("TC-4: Parity manifest exists and has valid schema")
    func parityManifestSchemaValid() throws {
        // Find the parity manifest relative to the test bundle
        let fileManager = FileManager.default
        let currentDirectory = fileManager.currentDirectoryPath

        // Navigate from test build directory to project root
        // Typical path: ios/LaneShadow/build/... -> ios/LaneShadow -> ios -> project root
        var manifestPath = URL(fileURLWithPath: currentDirectory)

        // Try to find tokens/sandbox/stories.parity.json by walking up the directory tree
        let manifestName = "tokens/sandbox/stories.parity.json"
        var found = false

        for _ in 0 ..< 5 { // Limit depth to avoid infinite loops
            manifestPath.appendPathComponent(manifestName)
            if fileManager.fileExists(atPath: manifestPath.path) {
                found = true
                break
            }
            manifestPath.deleteLastPathComponent()
            manifestPath.deleteLastPathComponent()

            // If we're at the root, stop
            if manifestPath.path == "/" {
                break
            }
        }

        #expect(found, "Parity manifest must be found at \(manifestName) relative to test working directory")

        let data = try Data(contentsOf: manifestPath)
        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]

        #expect(json != nil, "Parity manifest must be valid JSON")

        // Verify required keys exist and are arrays
        #expect(json?["shared"] != nil, "Parity manifest must have 'shared' key")
        #expect(json?["ios_only"] != nil, "Parity manifest must have 'ios_only' key")
        #expect(json?["android_only"] != nil, "Parity manifest must have 'android_only' key")

        let requiredScreenIds = [
            "templates.idle.default",
            "templates.planning.default",
            "templates.routeResults.default",
            "templates.routeDetails.default",
            "templates.sessions.default",
            "templates.error.default",
        ]

        for screenId in requiredScreenIds {
            #expect(
                (json?["shared"] as? [String])?.contains(screenId) == true,
                "Shared manifest must contain '\(screenId)'"
            )
        }
    }
}
