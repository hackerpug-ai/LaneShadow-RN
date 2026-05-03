import Foundation
import Testing
@testable import LaneShadow

/// Tests for canonical story ID format normalization (Sprint 04 templates).
///
/// Canonical format: `templates.{component-kebab}.{variant}`
/// - Component slug must be kebab-case lowercase ending in `-screen`
/// - Variant slug must be kebab-case lowercase
///
/// Cross-platform parity: iOS and Android MUST use the same story ID strings
/// for the same conceptual variants. See RULES.md "Cross-Platform Component Parity".
@MainActor
struct StoryIdFormatTests {
    /// Canonical regex for Sprint 04 template story IDs.
    /// Matches: `templates.{idle|planning|route-results|route-details|error|sessions|auth}-screen.{variant}`
    static let canonicalRegex = /^templates\.(idle|planning|route-results|route-details|error|sessions|auth)-screen\.[a-z0-9-]+$/

    /// Sprint 04 template screens that MUST use canonical format.
    static let sprint04TemplateScreens = [
        "idle-screen",
        "planning-screen",
        "route-results-screen",
        "route-details-screen",
        "error-screen",
        "sessions-screen",
        "auth-screen",
    ]

    @Test("All Sprint 04 template story IDs match canonical format")
    func allSprint04TemplateStoryIdsMatchCanonicalFormat() {
        let allStories = TemplateStories.all

        // Filter to only Sprint 04 template stories
        let sprint04Stories = allStories.filter { story in
            Self.sprint04TemplateScreens.contains { screen in
                story.id.hasPrefix("templates.\(screen)")
            }
        }

        // Collect non-canonical IDs
        var nonCanonicalIds: [String] = []
        for story in sprint04Stories {
            if story.id.wholeMatch(of: Self.canonicalRegex) == nil {
                nonCanonicalIds.append(story.id)
            }
        }

        // All Sprint 04 template story IDs must match canonical format
        #expect(nonCanonicalIds.isEmpty, "Found non-canonical story IDs: \(nonCanonicalIds.joined(separator: ", "))")
    }

    @Test("Snapshot file names match canonical story IDs")
    func snapshotFileNamesMatchCanonicalStoryIds() {
        let snapshotDirectoryString = (#filePath as NSString).deletingLastPathComponent + "/__Snapshots__/StorySnapshotTests"
        let snapshotDirectory = URL(fileURLWithPath: snapshotDirectoryString)
        let fm = FileManager.default

        guard let enumerator = fm.enumerator(at: snapshotDirectory, includingPropertiesForKeys: nil) else {
            throw TestError("Could not enumerate snapshot directory")
        }

        var snapshotFiles: [String] = []
        while let fileURL = enumerator.nextObject() as? URL {
            if fileURL.pathExtension == "png" {
                let filename = fileURL.deletingPathExtension().lastPathComponent
                // Extract story ID from filename (strip .light/.dark suffix)
                if filename.hasSuffix(".light") || filename.hasSuffix(".dark") {
                    let storyId = filename.components(separatedBy: ".").dropLast().joined(separator: ".")
                    snapshotFiles.append(storyId)
                }
            }
        }

        // Filter to Sprint 04 template snapshots
        let sprint04Snapshots = snapshotFiles.filter { snapshot in
            Self.sprint04TemplateScreens.contains { screen in
                snapshot.hasPrefix("templates.\(screen)")
            }
        }

        // Collect non-canonical snapshot IDs
        var nonCanonicalSnapshots: [String] = []
        for snapshot in sprint04Snapshots {
            if snapshot.wholeMatch(of: Self.canonicalRegex) == nil {
                nonCanonicalSnapshots.append(snapshot)
            }
        }

        // All Sprint 04 template snapshot filenames must match canonical format
        #expect(
            nonCanonicalSnapshots.isEmpty,
            "Found non-canonical snapshot filenames: \(nonCanonicalSnapshots.joined(separator: ", "))"
        )
    }

    @Test("Every story ID has a corresponding snapshot file")
    func everyStoryIdHasCorrespondingSnapshotFile() {
        let allStories = TemplateStories.all
        let snapshotDirectoryString = (#filePath as NSString).deletingLastPathComponent + "/__Snapshots__/StorySnapshotTests"
        let snapshotDirectory = URL(fileURLWithPath: snapshotDirectoryString)
        let fm = FileManager.default

        guard let enumerator = fm.enumerator(at: snapshotDirectory, includingPropertiesForKeys: nil) else {
            throw TestError("Could not enumerate snapshot directory")
        }

        var snapshotFiles: Set<String> = []
        while let fileURL = enumerator.nextObject() as? URL {
            if fileURL.pathExtension == "png" {
                let filename = fileURL.deletingPathExtension().lastPathComponent
                // Extract story ID from filename (strip .light/.dark suffix)
                if filename.hasSuffix(".light") || filename.hasSuffix(".dark") {
                    let storyId = filename.components(separatedBy: ".").dropLast().joined(separator: ".")
                    snapshotFiles.insert(storyId)
                }
            }
        }

        // Filter to Sprint 04 template stories
        let sprint04Stories = allStories.filter { story in
            Self.sprint04TemplateScreens.contains { screen in
                story.id.hasPrefix("templates.\(screen)")
            }
        }

        // Collect missing snapshot files
        var missingSnapshots: [String] = []
        for story in sprint04Stories {
            if !snapshotFiles.contains(story.id) {
                missingSnapshots.append(story.id)
            }
        }

        // Every Sprint 04 template story must have at least one snapshot file
        #expect(
            missingSnapshots.isEmpty,
            "Found story IDs without snapshot files: \(missingSnapshots.joined(separator: ", "))"
        )
    }
}

struct TestError: Error {
    let message: String
    init(_ message: String) {
        self.message = message
    }
}
