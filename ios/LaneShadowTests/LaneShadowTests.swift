import XCTest

final class LaneShadowTests: XCTestCase {
    func testBootstrapSanity() {
        XCTAssertTrue(true)
    }

    func test_ac1_bootsIntoSandboxWithHelloStoryRegisteredInAtomTier() {
        let storiesSource = try? sandboxSource(named: "LaneShadowStories.swift")

        XCTAssertNotNil(storiesSource)
        XCTAssertTrue(storiesSource?.contains("id: \"atoms/sandbox-host/hello-story\"") == true)
        XCTAssertTrue(storiesSource?.contains("tier: .atom") == true)
        XCTAssertTrue(storiesSource?.contains("component: \"SandboxHost\"") == true)
        XCTAssertTrue(storiesSource?.contains("name: \"HelloStory\"") == true)
    }

    func test_ac2_usesTokenThemeWiringForPreviewAndStoryRendering() {
        let storiesSource = try? sandboxSource(named: "LaneShadowStories.swift")
        let entrySource = try? sandboxSource(named: "LaneShadowSandboxEntry.swift")

        XCTAssertNotNil(storiesSource)
        XCTAssertNotNil(entrySource)
        XCTAssertTrue(entrySource?.contains("previewWrapper: themedPreview { $0.laneShadowTheme() }") == true)
        XCTAssertTrue(storiesSource?.contains("@Environment(\\.theme)") == true)
        XCTAssertFalse(storiesSource?.contains("Color.") == true)
    }

    func test_ac3_registersDeterministicRnLabeledStoriesWithStateVariants() {
        let storiesSource = try? sandboxSource(named: "LaneShadowStories.swift")

        XCTAssertNotNil(storiesSource)
        XCTAssertTrue(storiesSource?.contains("id: \"molecules/catalog-navigation/default\"") == true)
        XCTAssertTrue(storiesSource?.contains("id: \"molecules/catalog-navigation/search-active\"") == true)
        XCTAssertTrue(storiesSource?.contains("id: \"molecules/rn-reference-registry/default\"") == true)
        XCTAssertTrue(storiesSource?.contains("id: \"molecules/rn-reference-registry/empty\"") == true)
        XCTAssertTrue(storiesSource?.contains("summary: \"react-native/") == true)
    }

    func test_ac4_includesAccessibilitySafeAreaAndStateMotionParityHooks() {
        let storiesSource = try? sandboxSource(named: "LaneShadowStories.swift")

        XCTAssertNotNil(storiesSource)
        XCTAssertTrue(storiesSource?.contains(".accessibilityLabel(") == true)
        XCTAssertTrue(storiesSource?.contains(".safeAreaPadding(") == true)
        XCTAssertTrue(storiesSource?.contains(".animation(") == true)
    }

    func test_ac5_registersDeliverableStoriesInLaneShadowStoriesAggregator() {
        let storiesSource = try? sandboxSource(named: "LaneShadowStories.swift")
        let entrySource = try? sandboxSource(named: "LaneShadowSandboxEntry.swift")

        XCTAssertNotNil(storiesSource)
        XCTAssertNotNil(entrySource)
        XCTAssertTrue(storiesSource?.contains("id: \"templates/sandbox-launch/default\"") == true)
        XCTAssertTrue(storiesSource?.contains("id: \"templates/lane-shadow-sandbox-entry/default\"") == true)
        XCTAssertTrue(storiesSource?.contains("id: \"templates/lane-shadow-stories/default\"") == true)
        XCTAssertTrue(entrySource?.contains("previewWrapper: themedPreview { $0.laneShadowTheme() }") == true)
    }

    func test_ui006_ac1_atomComponentFilesExistWithExpectedTypes() {
        let themeText = try? atomsSource(named: "ThemeText.swift")
        let themeBackground = try? atomsSource(named: "ThemeBackground.swift")
        let themeIcon = try? atomsSource(named: "ThemeIcon.swift")
        let themeSeparator = try? atomsSource(named: "ThemeSeparator.swift")

        XCTAssertNotNil(themeText)
        XCTAssertNotNil(themeBackground)
        XCTAssertNotNil(themeIcon)
        XCTAssertNotNil(themeSeparator)
        XCTAssertTrue(themeText?.contains("struct ThemeText: View") == true)
        XCTAssertTrue(themeBackground?.contains("struct ThemeBackground") == true)
        XCTAssertTrue(themeIcon?.contains("struct ThemeIcon: View") == true)
        XCTAssertTrue(themeSeparator?.contains("struct ThemeSeparator: View") == true)
    }

    func test_ui006_ac2_atomSourcesUseThemeTokensWithoutHardcodedPrimitives() {
        let joined = [
            try? atomsSource(named: "ThemeText.swift"),
            try? atomsSource(named: "ThemeBackground.swift"),
            try? atomsSource(named: "ThemeIcon.swift"),
            try? atomsSource(named: "ThemeSeparator.swift"),
        ].compactMap { $0 }.joined(separator: "\n")

        XCTAssertTrue(joined.contains("@Environment(\\.theme)"))
        XCTAssertFalse(joined.contains("Color."))
        XCTAssertFalse(joined.contains(".system(size:"))
    }

    func test_ui006_ac3_registersDeterministicAtomsStoriesWithRnReferenceSummaries() {
        let storiesSource = try? sandboxSource(named: "LaneShadowStories.swift")

        XCTAssertNotNil(storiesSource)
        XCTAssertTrue(storiesSource?.contains("id: \"atoms/theme-text/default\"") == true)
        XCTAssertTrue(storiesSource?.contains("id: \"atoms/theme-background/surface\"") == true)
        XCTAssertTrue(storiesSource?.contains("id: \"atoms/theme-icon/default\"") == true)
        XCTAssertTrue(storiesSource?.contains("id: \"atoms/theme-separator/horizontal\"") == true)
        XCTAssertTrue(storiesSource?.contains("id: \"atoms/theme-drag-handle/default\"") == true)
        XCTAssertTrue(storiesSource?.contains("id: \"atoms/theme-sheet-handle/default\"") == true)
        XCTAssertTrue(storiesSource?.contains("summary: \"react-native/") == true)
    }

    func test_ui006_ac4_storyCoverageIncludesAccessibilitySafeAreaAndStateParityHooks() {
        let storiesSource = try? sandboxSource(named: "LaneShadowStories.swift")

        XCTAssertNotNil(storiesSource)
        XCTAssertTrue(storiesSource?.contains(".accessibilityLabel(") == true)
        XCTAssertTrue(storiesSource?.contains(".safeAreaPadding(") == true)
        XCTAssertTrue(storiesSource?.contains(".animation(") == true)
    }

    func test_ui006_ac5_laneShadowStoriesAggregatorContainsAtomsStoriesCollection() {
        let storiesSource = try? sandboxSource(named: "LaneShadowStories.swift")

        XCTAssertNotNil(storiesSource)
        XCTAssertTrue(storiesSource?.contains("AtomsStories.all") == true)
    }

    private func sandboxSource(named fileName: String) throws -> String {
        let repoRoot = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()

        let fileURL = repoRoot
            .appendingPathComponent("ios")
            .appendingPathComponent("LaneShadow")
            .appendingPathComponent("Sandbox")
            .appendingPathComponent(fileName)

        return try String(contentsOf: fileURL, encoding: .utf8)
    }

    private func atomsSource(named fileName: String) throws -> String {
        let repoRoot = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()

        let fileURL = repoRoot
            .appendingPathComponent("ios")
            .appendingPathComponent("LaneShadow")
            .appendingPathComponent("Views")
            .appendingPathComponent("Atoms")
            .appendingPathComponent(fileName)

        return try String(contentsOf: fileURL, encoding: .utf8)
    }
}
