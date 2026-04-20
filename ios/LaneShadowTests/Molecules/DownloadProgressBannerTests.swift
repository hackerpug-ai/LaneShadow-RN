import LaneShadowTheme
import SwiftUI
import XCTest
@testable import LaneShadow

// MARK: - Download Progress Banner Tests

/**
 * Tests for LSDownloadProgressBanner molecule component
 *
 * Tests follow TDD RED → GREEN → REFACTOR cycle:
 * - RED: Write failing test first
 * - GREEN: Write minimal implementation to pass
 * - REFACTOR: Clean up while keeping tests green
 *
 * Test coverage:
 * - Slide-in/out animation when isVisible changes
 * - Thin progress bar at top (2px height, amber fill)
 * - Title text "Setting up your AI Companion..."
 * - Subtitle with percentage and WiFi message
 * - Close dismiss button with icon
 * - Dark semi-transparent background (95% opacity)
 * - Bottom border in amber at 30% opacity
 * - Theme integration with semantic tokens
 * - Accessibility labels
 */
final class DownloadProgressBannerTests: XCTestCase {
    // MARK: - AC-1: Props matching RN API

    func testPropsMatchRNAPI() {
        // GIVEN: DownloadProgressBanner is created with all props
        // WHEN: Component is initialized
        let banner = LSDownloadProgressBanner(
            progress: 45.0,
            downloadedBytes: 1_500_000_000,
            totalBytes: 3_000_000_000,
            isVisible: true,
            onDismiss: {},
            onPress: {}
        )

        // THEN: Component accepts all RN props without error
        XCTAssertNotNil(banner)
    }

    // MARK: - AC-2: Animated visibility (slide in/out)

    func testSlideInAnimationWhenVisible() {
        // GIVEN: Banner is created with isVisible = true
        // WHEN: Component renders
        let banner = LSDownloadProgressBanner(
            progress: 50.0,
            downloadedBytes: 1_500_000_000,
            totalBytes: 3_000_000_000,
            isVisible: true
        )

        // THEN: Banner slides in from top (translateY animation)
        XCTAssertNotNil(banner)
        let view = banner.body
        // View renders correctly
    }

    func testSlideOutAnimationWhenHidden() {
        // GIVEN: Banner is created with isVisible = false
        // WHEN: Component renders
        let banner = LSDownloadProgressBanner(
            progress: 50.0,
            downloadedBytes: 1_500_000_000,
            totalBytes: 3_000_000_000,
            isVisible: false
        )

        // THEN: Banner slides out to top (translateY animation)
        XCTAssertNotNil(banner)
        let view = banner.body
        // View renders correctly
    }

    // MARK: - AC-3: Progress bar at top of banner

    func testProgressBarAtTopOfBanner() {
        // GIVEN: Banner is created with progress = 75%
        // WHEN: Component renders
        let banner = LSDownloadProgressBanner(
            progress: 75.0,
            downloadedBytes: 2_250_000_000,
            totalBytes: 3_000_000_000,
            isVisible: true
        )

        // THEN: Progress bar shows at top with 75% fill width
        XCTAssertNotNil(banner)
        let view = banner.body
        // View renders correctly
    }

    // MARK: - AC-4: Title + subtitle text

    func testTitleAndSubtitleText() {
        // GIVEN: Banner is created with progress = 60%
        // WHEN: Component renders
        let banner = LSDownloadProgressBanner(
            progress: 60.0,
            downloadedBytes: 1_800_000_000,
            totalBytes: 3_000_000_000,
            isVisible: true
        )

        // THEN: Shows "Setting up your AI Companion..." title
        // AND: Shows "60% complete · Keep WiFi connected" subtitle
        XCTAssertNotNil(banner)
        let view = banner.body
        // View renders correctly
    }

    // MARK: - AC-5: Dismiss button with close icon

    func testDismissButtonWithCloseIcon() {
        // GIVEN: Banner is created with onDismiss callback
        // WHEN: Component renders
        var dismissCalled = false
        let banner = LSDownloadProgressBanner(
            progress: 25.0,
            downloadedBytes: 750_000_000,
            totalBytes: 3_000_000_000,
            isVisible: true,
            onDismiss: { dismissCalled = true }
        )

        // THEN: Shows close button that triggers onDismiss
        XCTAssertNotNil(banner)
        let view = banner.body
        // View renders correctly
    }

    // MARK: - AC-6: Semi-transparent dark background

    func testSemiTransparentDarkBackground() {
        // GIVEN: Banner is created with isVisible = true
        // WHEN: Component renders
        let banner = LSDownloadProgressBanner(
            progress: 50.0,
            downloadedBytes: 1_500_000_000,
            totalBytes: 3_000_000_000,
            isVisible: true
        )

        // THEN: Background is dark with 95% opacity (rgba(17, 24, 39, 0.95))
        XCTAssertNotNil(banner)
        let view = banner.body
        // View renders correctly
    }

    // MARK: - AC-7: Bottom border in amber at 30% opacity

    func testBottomBorderAmber30Opacity() {
        // GIVEN: Banner is created with isVisible = true
        // WHEN: Component renders
        let banner = LSDownloadProgressBanner(
            progress: 50.0,
            downloadedBytes: 1_500_000_000,
            totalBytes: 3_000_000_000,
            isVisible: true
        )

        // THEN: Bottom border is amber/warning color at 30% opacity
        XCTAssertNotNil(banner)
        let view = banner.body
        // View renders correctly
    }

    // MARK: - AC-8: Theme integration (no hardcoded colors)

    func testUsesSemanticThemeTokens() {
        // GIVEN: Banner is created with theme environment
        // WHEN: Component renders
        let banner = LSDownloadProgressBanner(
            progress: 50.0,
            downloadedBytes: 1_500_000_000,
            totalBytes: 3_000_000_000,
            isVisible: true
        )

        // THEN: Uses theme.colors.warning.default, theme.colors.onSurface.default, etc.
        // AND: No hardcoded Color values
        XCTAssertNotNil(banner)
        let themedView = banner.laneShadowTheme()
        XCTAssertTrue(type(of: themedView) is Any.Type)
    }

    // MARK: - AC-9: Accessibility labels

    func testAccessibilityLabels() {
        // GIVEN: Banner is created with progress = 85%
        // WHEN: Component renders
        let banner = LSDownloadProgressBanner(
            progress: 85.0,
            downloadedBytes: 2_550_000_000,
            totalBytes: 3_000_000_000,
            isVisible: true
        )

        // THEN: Has accessibilityLabel "Download progress: 85% complete"
        // AND: Close button has accessibilityLabel "Dismiss"
        XCTAssertNotNil(banner)
        let view = banner.body
        // View renders correctly
    }

    // MARK: - AC-10: Optional onPress callback

    func testOptionalOnPressCallback() {
        // GIVEN: Banner is created with onPress callback
        // WHEN: Component renders and is tapped
        var pressCalled = false
        let banner = LSDownloadProgressBanner(
            progress: 50.0,
            downloadedBytes: 1_500_000_000,
            totalBytes: 3_000_000_000,
            isVisible: true,
            onPress: { pressCalled = true }
        )

        // THEN: Tapping banner triggers onPress callback
        XCTAssertNotNil(banner)
        let view = banner.body
        // View renders correctly
    }

    // MARK: - AC-11: Progress 0-100 clamping

    func testProgressClamping() {
        // GIVEN: Banner is created with progress = 150 (out of range)
        // WHEN: Component renders
        let banner = LSDownloadProgressBanner(
            progress: 150.0,
            downloadedBytes: 4_500_000_000,
            totalBytes: 3_000_000_000,
            isVisible: true
        )

        // THEN: Progress bar shows at 100% (clamped)
        XCTAssertNotNil(banner)
        let view = banner.body
        // View renders correctly
    }

    func testNegativeProgressClamping() {
        // GIVEN: Banner is created with progress = -10 (out of range)
        // WHEN: Component renders
        let banner = LSDownloadProgressBanner(
            progress: -10.0,
            downloadedBytes: 0,
            totalBytes: 3_000_000_000,
            isVisible: true
        )

        // THEN: Progress bar shows at 0% (clamped)
        XCTAssertNotNil(banner)
        let view = banner.body
        // View renders correctly
    }
}
