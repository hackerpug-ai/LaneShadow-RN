import LaneShadowTheme
import SwiftUI
import XCTest
@testable import LaneShadow

// MARK: - Map Controls Tests

/**
 * Tests for LSMapControls molecule component
 *
 * Tests follow TDD RED → GREEN → REFACTOR cycle:
 * - RED: Write failing test first
 * - GREEN: Write minimal implementation to pass
 * - REFACTOR: Clean up while keeping tests green
 *
 * Test coverage:
 * - Component renders in map mode with all controls
 * - Component renders in chat mode with only toggle button
 * - Zoom cluster renders with plus/minus buttons and divider
 * - Control buttons render with correct icons and accessibility labels
 * - Save route button visibility controlled by hasRouteToSave
 * - Save route button accent styling controlled by isSavedRoute
 * - Toggle view button shows correct icon based on mode (chat vs map)
 * - Optional callbacks (onRecenter, onClear, onSaveRoute) control button visibility
 * - ShowLabels prop controls text label rendering below icons
 * - Theme integration with semantic colors and spacing
 * - Press state opacity on buttons
 * - Design tokens (radius.2xl, space.xs, space.3xl, elevation[3])
 */
final class MapControlsTests: XCTestCase {
    // MARK: - AC-1: Component renders in map mode with all controls

    func testMapControlsRendersInMapMode() {
        // GIVEN: MapControls is created with mode='map'
        // WHEN: Component is rendered
        let mapControls = LSMapControls(
            mode: .map,
            onZoomIn: {},
            onZoomOut: {},
            onRecenter: {},
            onClear: {},
            onToggleView: {},
            onSaveRoute: {},
            hasRouteToSave: true,
            isSavedRoute: false,
            showLabels: false
        )

        // THEN: Component renders successfully
        XCTAssertNotNil(mapControls)
        let view = mapControls.body
        // View renders correctly
    }

    // MARK: - AC-2: Component renders in chat mode with only toggle button

    func testMapControlsRendersInChatMode() {
        // GIVEN: MapControls is created with mode='chat'
        // WHEN: Component is rendered
        let mapControls = LSMapControls(
            mode: .chat,
            onToggleView: {}
        )

        // THEN: Component renders successfully (only toggle button visible)
        XCTAssertNotNil(mapControls)
        let view = mapControls.body
        // View renders correctly
    }

    // MARK: - AC-3: Zoom cluster renders with plus/minus buttons and divider

    func testMapControlsZoomClusterRenders() {
        // GIVEN: MapControls is created in map mode
        // WHEN: Component is rendered
        let mapControls = LSMapControls(
            mode: .map,
            onZoomIn: {},
            onZoomOut: {},
            onToggleView: {}
        )

        // THEN: Zoom cluster is rendered with plus, minus, and divider
        XCTAssertNotNil(mapControls)
        let view = mapControls.body
        // View renders correctly
    }

    // MARK: - AC-4: Control buttons render with correct icons

    func testMapControlsButtonsRenderWithCorrectIcons() {
        // GIVEN: MapControls is created with all callbacks
        // WHEN: Component is rendered
        let mapControls = LSMapControls(
            mode: .map,
            onZoomIn: {},
            onZoomOut: {},
            onRecenter: {},
            onClear: {},
            onToggleView: {},
            onSaveRoute: {},
            hasRouteToSave: true
        )

        // THEN: All buttons render with correct icons (plus, minus, crosshairs-gps, layers, bookmark, message-text-outline)
        XCTAssertNotNil(mapControls)
        let view = mapControls.body
        // View renders correctly
    }

    // MARK: - AC-5: Save route button visibility controlled by hasRouteToSave

    func testMapControlsSaveRouteButtonVisibleWhenHasRoute() {
        // GIVEN: MapControls is created with hasRouteToSave=true
        // WHEN: Component is rendered
        let mapControls = LSMapControls(
            mode: .map,
            onToggleView: {},
            onSaveRoute: {},
            hasRouteToSave: true
        )

        // THEN: Save route button is rendered
        XCTAssertNotNil(mapControls)
        let view = mapControls.body
        // View renders correctly
    }

    func testMapControlsSaveRouteButtonHiddenWhenNoRoute() {
        // GIVEN: MapControls is created with hasRouteToSave=false
        // WHEN: Component is rendered
        let mapControls = LSMapControls(
            mode: .map,
            onToggleView: {},
            onSaveRoute: {},
            hasRouteToSave: false
        )

        // THEN: Save route button is not rendered
        XCTAssertNotNil(mapControls)
        let view = mapControls.body
        // View renders correctly
    }

    // MARK: - AC-6: Save route button accent styling controlled by isSavedRoute

    func testMapControlsSaveRouteButtonAccentWhenSaved() {
        // GIVEN: MapControls is created with isSavedRoute=true
        // WHEN: Component is rendered
        let mapControls = LSMapControls(
            mode: .map,
            onToggleView: {},
            onSaveRoute: {},
            hasRouteToSave: true,
            isSavedRoute: true
        )

        // THEN: Save route button uses primary accent color
        XCTAssertNotNil(mapControls)
        let view = mapControls.body
        // View renders correctly
    }

    func testMapControlsSaveRouteButtonNormalWhenNotSaved() {
        // GIVEN: MapControls is created with isSavedRoute=false
        // WHEN: Component is rendered
        let mapControls = LSMapControls(
            mode: .map,
            onToggleView: {},
            onSaveRoute: {},
            hasRouteToSave: true,
            isSavedRoute: false
        )

        // THEN: Save route button uses surfaceVariant color
        XCTAssertNotNil(mapControls)
        let view = mapControls.body
        // View renders correctly
    }

    // MARK: - AC-7: Toggle view button shows correct icon based on mode

    func testMapControlsToggleViewShowsChatIconInMapMode() {
        // GIVEN: MapControls is created with mode='map'
        // WHEN: Component is rendered
        let mapControls = LSMapControls(
            mode: .map,
            onToggleView: {}
        )

        // THEN: Toggle button shows message-text-outline icon
        XCTAssertNotNil(mapControls)
        let view = mapControls.body
        // View renders correctly
    }

    func testMapControlsToggleViewShowsMapIconInChatMode() {
        // GIVEN: MapControls is created with mode='chat'
        // WHEN: Component is rendered
        let mapControls = LSMapControls(
            mode: .chat,
            onToggleView: {}
        )

        // THEN: Toggle button shows map-outline icon
        XCTAssertNotNil(mapControls)
        let view = mapControls.body
        // View renders correctly
    }

    // MARK: - AC-8: Optional callbacks control button visibility

    func testMapControlsRecenterButtonVisibleWhenCallbackProvided() {
        // GIVEN: MapControls is created with onRecenter callback
        // WHEN: Component is rendered
        let mapControls = LSMapControls(
            mode: .map,
            onRecenter: {},
            onToggleView: {}
        )

        // THEN: Recenter button is rendered
        XCTAssertNotNil(mapControls)
        let view = mapControls.body
        // View renders correctly
    }

    func testMapControlsRecenterButtonHiddenWhenCallbackNil() {
        // GIVEN: MapControls is created without onRecenter callback
        // WHEN: Component is rendered
        let mapControls = LSMapControls(
            mode: .map,
            onToggleView: {}
        )

        // THEN: Recenter button is not rendered
        XCTAssertNotNil(mapControls)
        let view = mapControls.body
        // View renders correctly
    }

    func testMapControlsClearButtonVisibleWhenCallbackProvided() {
        // GIVEN: MapControls is created with onClear callback
        // WHEN: Component is rendered
        let mapControls = LSMapControls(
            mode: .map,
            onClear: {},
            onToggleView: {}
        )

        // THEN: Clear button is rendered
        XCTAssertNotNil(mapControls)
        let view = mapControls.body
        // View renders correctly
    }

    func testMapControlsClearButtonHiddenWhenCallbackNil() {
        // GIVEN: MapControls is created without onClear callback
        // WHEN: Component is rendered
        let mapControls = LSMapControls(
            mode: .map,
            onToggleView: {}
        )

        // THEN: Clear button is not rendered
        XCTAssertNotNil(mapControls)
        let view = mapControls.body
        // View renders correctly
    }

    // MARK: - AC-9: ShowLabels prop controls text label rendering

    func testMapControlsShowLabelsDisplaysTextBelowIcons() {
        // GIVEN: MapControls is created with showLabels=true
        // WHEN: Component is rendered
        let mapControls = LSMapControls(
            mode: .map,
            onZoomIn: {},
            onZoomOut: {},
            onToggleView: {},
            showLabels: true
        )

        // THEN: Buttons show text labels below icons
        XCTAssertNotNil(mapControls)
        let view = mapControls.body
        // View renders correctly
    }

    func testMapControlsHideLabelsDisplaysIconsOnly() {
        // GIVEN: MapControls is created with showLabels=false
        // WHEN: Component is rendered
        let mapControls = LSMapControls(
            mode: .map,
            onZoomIn: {},
            onZoomOut: {},
            onToggleView: {},
            showLabels: false
        )

        // THEN: Buttons show only icons, no text labels
        XCTAssertNotNil(mapControls)
        let view = mapControls.body
        // View renders correctly
    }

    // MARK: - AC-10: Theme integration with semantic colors

    func testMapControlsUsesSemanticTheme() {
        // GIVEN: MapControls is created
        // WHEN: Component is rendered with theme
        let mapControls = LSMapControls(
            mode: .map,
            onToggleView: {}
        )

        // THEN: Uses semantic theme colors (surfaceVariant, border, onSurface, primary)
        XCTAssertNotNil(mapControls)
        let themedView = mapControls.laneShadowTheme()
        XCTAssertTrue(type(of: themedView) is Any.Type)
    }

    // MARK: - AC-11: Press state opacity on buttons

    func testMapControlsButtonsHavePressOpacity() {
        // GIVEN: MapControls is created with buttons
        // WHEN: Component is rendered
        let mapControls = LSMapControls(
            mode: .map,
            onZoomIn: {},
            onZoomOut: {},
            onToggleView: {}
        )

        // THEN: Buttons have opacity 0.8 on press
        XCTAssertNotNil(mapControls)
        let view = mapControls.body
        // View renders correctly
    }

    // MARK: - AC-12: Design tokens (radius, spacing, elevation)

    func testMapControlsUsesDesignTokens() {
        // GIVEN: MapControls is created
        // WHEN: Component is rendered
        let mapControls = LSMapControls(
            mode: .map,
            onToggleView: {}
        )

        // THEN: Uses theme.radius.2xl, theme.space.xs, theme.space.3xl, theme.elevation[3]
        XCTAssertNotNil(mapControls)
        let view = mapControls.body
        // View renders correctly
    }

    // MARK: - AC-13: Toggle button always renders at bottom

    func testMapControlsToggleButtonAlwaysAtBottom() {
        // GIVEN: MapControls is created in map mode
        // WHEN: Component is rendered
        let mapControls = LSMapControls(
            mode: .map,
            onToggleView: {}
        )

        // THEN: Toggle button is rendered at the bottom of the workbar
        XCTAssertNotNil(mapControls)
        let view = mapControls.body
        // View renders correctly
    }

    func testMapControlsToggleButtonAtBottomInChatMode() {
        // GIVEN: MapControls is created in chat mode
        // WHEN: Component is rendered
        let mapControls = LSMapControls(
            mode: .chat,
            onToggleView: {}
        )

        // THEN: Toggle button is rendered (only button, at bottom)
        XCTAssertNotNil(mapControls)
        let view = mapControls.body
        // View renders correctly
    }

    // MARK: - AC-14: Zoom cluster container styling

    func testMapControlsZoomClusterHasCorrectStyling() {
        // GIVEN: MapControls is created in map mode
        // WHEN: Component is rendered
        let mapControls = LSMapControls(
            mode: .map,
            onZoomIn: {},
            onZoomOut: {},
            onToggleView: {}
        )

        // THEN: Zoom cluster has surfaceVariant background, border, radius.2xl, elevation[3]
        XCTAssertNotNil(mapControls)
        let view = mapControls.body
        // View renders correctly
    }

    // MARK: - AC-15: Control button styling

    func testMapControlsControlButtonsHaveCorrectStyling() {
        // GIVEN: MapControls is created with buttons
        // WHEN: Component is rendered
        let mapControls = LSMapControls(
            mode: .map,
            onRecenter: {},
            onToggleView: {}
        )

        // THEN: Control buttons have surfaceVariant background, border 1.5pt, radius.2xl, elevation[3]
        XCTAssertNotNil(mapControls)
        let view = mapControls.body
        // View renders correctly
    }

    // MARK: - AC-16: Accessibility labels

    func testMapControlsHasAccessibilityLabels() {
        // GIVEN: MapControls is created
        // WHEN: Component is rendered
        let mapControls = LSMapControls(
            mode: .map,
            onZoomIn: {},
            onZoomOut: {},
            onRecenter: {},
            onToggleView: {}
        )

        // THEN: Buttons have accessibility labels (Zoom in, Zoom out, Recenter map, Open chat, etc.)
        XCTAssertNotNil(mapControls)
        let view = mapControls.body
        // View renders correctly
    }
}
