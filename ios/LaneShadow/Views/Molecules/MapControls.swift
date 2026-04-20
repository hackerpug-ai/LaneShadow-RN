import LaneShadowTheme
import SwiftUI

// MARK: - Map Controls Mode Enum

/**
 * Map controls mode enum
 *
 * Following RN wrapper API from react-native/components/map/map-controls.tsx
 */
public enum LSMapControlsMode {
    case map
    case chat
}

// MARK: - Map Controls Component

/**
 * Map controls molecule component
 *
 * Right-side workbar for the map screen with zoom, recenter, layers, and toggle view buttons.
 * Following React Native component from react-native/components/map/map-controls.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Background: transparent
 *   - Button background: `theme.colors.surfaceVariant.default` (normal), `theme.colors.primary.default` (accent)
 *   - Button background pressed: `theme.colors.surfaceVariant.pressed` (normal), `theme.colors.primary.pressed` (accent)
 *   - Border: `theme.colors.border.default` (1.5pt)
 *   - Icon: `theme.colors.onSurface.default` (normal), `theme.colors.onPrimary.default` (accent)
 * - Layout:
 *   - Corner radius: `theme.radius.2xl`
 *   - Gap between buttons: `theme.space.xs`
 *   - Button size: `theme.space.3xl` × `theme.space.3xl` (no label), auto-width with `theme.space.sm` horizontal padding (with label)
 *   - Icon size: 20pt
 *   - Elevation: `theme.elevation[3]`
 * - Typography:
 *   - Label: `theme.type.body.sm`
 *
 * ## Parameters
 * - mode: Which view this workbar is backing ('map' or 'chat')
 * - onZoomIn: Zoom in button callback
 * - onZoomOut: Zoom out button callback
 * - onRecenter: Recenter map button callback (optional)
 * - onClear: Reset map state button callback (optional, layers icon)
 * - onToggleView: Toggle view button callback (chat-icon in map mode, map-icon in chat mode)
 * - onSaveRoute: Save route button callback (optional, bookmark icon)
 * - hasRouteToSave: Whether a route is available to save (controls bookmark button visibility)
 * - isSavedRoute: Whether we're currently viewing a saved route (controls bookmark button accent styling)
 * - showLabels: Show labels below icons for better discoverability
 * - testID: Optional testing identifier for accessibility
 */
public struct LSMapControls: View {
    @Environment(\.theme) private var theme

    private let mode: LSMapControlsMode
    private let onZoomIn: (() -> Void)?
    private let onZoomOut: (() -> Void)?
    private let onRecenter: (() -> Void)?
    private let onClear: (() -> Void)?
    private let onToggleView: (() -> Void)?
    private let onSaveRoute: (() -> Void)?
    private let hasRouteToSave: Bool
    private let isSavedRoute: Bool
    private let showLabels: Bool
    private let testID: String?

    public init(
        mode: LSMapControlsMode = .map,
        onZoomIn: (() -> Void)? = nil,
        onZoomOut: (() -> Void)? = nil,
        onRecenter: (() -> Void)? = nil,
        onClear: (() -> Void)? = nil,
        onToggleView: (() -> Void)? = nil,
        onSaveRoute: (() -> Void)? = nil,
        hasRouteToSave: Bool = false,
        isSavedRoute: Bool = false,
        showLabels: Bool = false,
        testID: String? = nil
    ) {
        self.mode = mode
        self.onZoomIn = onZoomIn
        self.onZoomOut = onZoomOut
        self.onRecenter = onRecenter
        self.onClear = onClear
        self.onToggleView = onToggleView
        self.onSaveRoute = onSaveRoute
        self.hasRouteToSave = hasRouteToSave
        self.isSavedRoute = isSavedRoute
        self.showLabels = showLabels
        self.testID = testID
    }

    public var body: some View {
        VStack(alignment: .trailing, spacing: theme.space.xs) {
            if mode == .map {
                mapModeControls
            }

            // Mode-toggle lives at the bottom of the workbar in BOTH modes
            toggleButton
        }
        .accessibilityIdentifier(testID ?? "map-controls")
    }

    // MARK: - Private Views

    @ViewBuilder
    private var mapModeControls: some View {
        // Zoom cluster
        if onZoomIn != nil || onZoomOut != nil {
            VStack(spacing: 0) {
                if let onZoomIn {
                    LSMapControlButton(
                        icon: "plus",
                        label: showLabels ? "Zoom" : nil,
                        onPress: onZoomIn,
                        theme: theme,
                        accent: false,
                        accessibilityLabel: "Zoom in",
                        testID: testID.map { "\($0)-zoom-in" }
                    )
                }

                // Divider
                if onZoomIn != nil, onZoomOut != nil {
                    Rectangle()
                        .fill(theme.colors.border.default)
                        .frame(height: 1)
                        .frame(maxWidth: .infinity)
                }

                if let onZoomOut {
                    LSMapControlButton(
                        icon: "minus",
                        label: showLabels ? "Zoom" : nil,
                        onPress: onZoomOut,
                        theme: theme,
                        accent: false,
                        accessibilityLabel: "Zoom out",
                        testID: testID.map { "\($0)-zoom-out" }
                    )
                }
            }
            .background(theme.colors.surfaceVariant.default)
            .clipShape(RoundedRectangle(cornerRadius: theme.radius.xl2))
            .overlay {
                RoundedRectangle(cornerRadius: theme.radius.xl2)
                    .stroke(theme.colors.border.default, lineWidth: 1.5)
            }
            .shadow(
                color: theme.elevation.level1.shadowColor,
                radius: theme.elevation.level1.radius,
                x: theme.elevation.level1.offsetX,
                y: theme.elevation.level1.offsetY
            )
        }

        // Recenter button
        if let onRecenter {
            LSMapControlButton(
                icon: "crosshairs-gps",
                label: showLabels ? "Recenter" : nil,
                onPress: onRecenter,
                theme: theme,
                accent: false,
                accessibilityLabel: "Recenter map",
                testID: testID.map { "\($0)-recenter" }
            )
        }

        // Clear/layers button
        if let onClear {
            LSMapControlButton(
                icon: "layers",
                label: showLabels ? "Layers" : nil,
                onPress: onClear,
                theme: theme,
                accent: false,
                accessibilityLabel: "Reset map state",
                testID: testID.map { "\($0)-clear" }
            )
        }

        // Save route button
        if hasRouteToSave, let onSaveRoute {
            LSMapControlButton(
                icon: "bookmark",
                label: showLabels ? "Save" : nil,
                onPress: onSaveRoute,
                theme: theme,
                accent: isSavedRoute,
                accessibilityLabel: "Save route",
                testID: testID.map { "\($0)-save-route" }
            )
        }
    }

    @ViewBuilder
    private var toggleButton: some View {
        if let onToggleView {
            let iconName = mode == .map ? "message-text-outline" : "map-outline"
            let accessibilityLabel = mode == .map ? "Open chat" : "Back to map"

            LSMapControlButton(
                icon: iconName,
                label: showLabels ? (mode == .map ? "Chat" : "Map") : nil,
                onPress: onToggleView,
                theme: theme,
                accent: false,
                accessibilityLabel: accessibilityLabel,
                testID: testID.map { "\($0)-toggle-view" }
            )
        }
    }
}

// MARK: - Map Control Button Component

/**
 * Map control button component
 *
 * Internal button component used within LSMapControls
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Background: `theme.colors.surfaceVariant.default` (normal), `theme.colors.primary.default` (accent)
 *   - Background pressed: `theme.colors.surfaceVariant.pressed` (normal), `theme.colors.primary.pressed` (accent)
 *   - Border: `theme.colors.border.default` (1.5pt, normal), `theme.colors.primary.default` (1.5pt, accent)
 *   - Icon: `theme.colors.onSurface.default` (normal), `theme.colors.onPrimary.default` (accent)
 * - Layout:
 *   - Corner radius: `theme.radius.2xl`
 *   - Size: `theme.space.3xl` × `theme.space.3xl` (no label), auto-width with `theme.space.sm` horizontal padding (with label)
 *   - Icon size: 20pt
 *   - Elevation: `theme.elevation[3]`
 * - Typography:
 *   - Label: `theme.type.body.sm`
 *
 * ## Parameters
 * - icon: Icon name (MaterialCommunityIcons name)
 * - label: Optional text label to display below icon
 * - onPress: Button press callback
 * - theme: Theme instance for semantic tokens
 * - accent: Use primary color accent for important actions
 * - accessibilityLabel: Accessibility label for screen readers
 * - testID: Testing identifier
 */
private struct LSMapControlButton: View {
    let icon: String
    let label: String?
    let onPress: () -> Void
    let theme: Theme
    let accent: Bool
    let accessibilityLabel: String
    let testID: String?

    @State private var isPressed = false

    var body: some View {
        Button(action: onPress) {
            HStack(spacing: label != nil ? theme.space.xs : 0) {
                LSIconSymbol(
                    name: icon,
                    size: 20,
                    color: accent ? theme.colors.onPrimary.default : theme.colors.onSurface.default
                )

                if let label {
                    Text(label)
                        .font(.system(size: theme.type.body.sm.fontSize, weight: .regular))
                        .foregroundStyle(accent ? theme.colors.onPrimary.default : theme.colors.onSurface.default)
                }
            }
            .frame(width: label != nil ? nil : theme.space.xl3)
            .padding(.horizontal, label != nil ? theme.space.sm : 0)
            .padding(.vertical, theme.space.xs)
            .background(
                isPressed
                    ? (accent ? theme.colors.primary.pressed : theme.colors.surfaceVariant.pressed)
                    : (accent ? theme.colors.primary.default : theme.colors.surfaceVariant.default)
            )
            .clipShape(RoundedRectangle(cornerRadius: theme.radius.xl2))
            .overlay {
                RoundedRectangle(cornerRadius: theme.radius.xl2)
                    .stroke(accent ? theme.colors.primary.default : theme.colors.border.default, lineWidth: 1.5)
            }
            .shadow(
                color: theme.elevation.level1.shadowColor,
                radius: theme.elevation.level1.radius,
                x: theme.elevation.level1.offsetX,
                y: theme.elevation.level1.offsetY
            )
        }
        .buttonStyle(PressOpacityButtonStyle())
        .accessibilityLabel(accessibilityLabel)
        .accessibilityIdentifier(testID)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in
                    if !isPressed {
                        isPressed = true
                    }
                }
                .onEnded { _ in
                    isPressed = false
                }
        )
    }
}

// MARK: - Press Opacity Button Style

private struct PressOpacityButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .opacity(configuration.isPressed ? 0.8 : 1.0)
    }
}

// MARK: - Preview

#Preview("Map Mode - All Controls") {
    LSMapControls(
        mode: .map,
        onZoomIn: { print("Zoom in") },
        onZoomOut: { print("Zoom out") },
        onRecenter: { print("Recenter") },
        onClear: { print("Clear") },
        onToggleView: { print("Toggle to chat") },
        onSaveRoute: { print("Save route") },
        hasRouteToSave: true,
        isSavedRoute: false,
        showLabels: false
    )
    .padding()
    .laneShadowTheme()
}

#Preview("Chat Mode") {
    LSMapControls(
        mode: .chat,
        onToggleView: { print("Toggle to map") }
    )
    .padding()
    .laneShadowTheme()
}

#Preview("Map Mode - Minimal") {
    LSMapControls(
        mode: .map,
        onZoomIn: { print("Zoom in") },
        onZoomOut: { print("Zoom out") },
        onToggleView: { print("Toggle to chat") }
    )
    .padding()
    .laneShadowTheme()
}

#Preview("With Labels") {
    LSMapControls(
        mode: .map,
        onZoomIn: { print("Zoom in") },
        onZoomOut: { print("Zoom out") },
        onRecenter: { print("Recenter") },
        onClear: { print("Clear") },
        onToggleView: { print("Toggle to chat") },
        onSaveRoute: { print("Save route") },
        hasRouteToSave: true,
        isSavedRoute: true,
        showLabels: true
    )
    .padding()
    .laneShadowTheme()
}

#Preview("Dark Theme") {
    LSMapControls(
        mode: .map,
        onZoomIn: { print("Zoom in") },
        onZoomOut: { print("Zoom out") },
        onRecenter: { print("Recenter") },
        onClear: { print("Clear") },
        onToggleView: { print("Toggle to chat") },
        onSaveRoute: { print("Save route") },
        hasRouteToSave: true,
        isSavedRoute: false,
        showLabels: false
    )
    .padding()
    .laneShadowTheme()
    .preferredColorScheme(.dark)
}
