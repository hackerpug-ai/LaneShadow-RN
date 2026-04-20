import LaneShadowTheme
import SwiftUI

// MARK: - Map Planning Indicator Component

/**
 * Map planning indicator molecule component
 *
 * Lightweight pill shown on the map while the agent is planning a route.
 * Following React Native component from react-native/components/map/map-planning-indicator.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Pill background: `theme.colors.surface.default`
 *   - Border: `theme.colors.border.default` (hairline)
 *   - Text: `theme.colors.onSurface.muted`
 *   - Dots: `theme.colors.onSurface.subtle` (or `.default` as fallback)
 * - Layout:
 *   - Pill corner radius: 20pt
 *   - Pill padding: horizontal `theme.space.md`, vertical 10pt
 *   - Gap between text and dots: `theme.space.sm`
 *   - Bottom offset: 100pt (default) + extraInputOffset
 * - Typography:
 *   - Text: `theme.type.body.sm`
 * - Shadow:
 *   - Elevation level 4
 * - Animation:
 *   - Fade in/out: 200ms
 *
 * ## Parameters
 * - visible: Controls visibility of the indicator
 * - bottomOffset: Distance from screen bottom (default 100)
 * - extraInputOffset: Extra offset from ChatInput (default 0)
 * - testID: Optional testing identifier
 */
public struct LSMapPlanningIndicator: View {
    @Environment(\.theme) private var theme
    @State private var isVisible: Bool = false

    private let visible: Bool
    private let bottomOffset: CGFloat
    private let extraInputOffset: CGFloat
    private let testID: String?

    public init(
        visible: Bool,
        bottomOffset: CGFloat = 100,
        extraInputOffset: CGFloat = 0,
        testID: String? = nil
    ) {
        self.visible = visible
        self.bottomOffset = bottomOffset
        self.extraInputOffset = extraInputOffset
        self.testID = testID
    }

    public var body: some View {
        if visible {
            pillContent
                .opacity(isVisible ? 1 : 0)
                .onAppear {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        isVisible = true
                    }
                }
                .onDisappear {
                    isVisible = false
                }
        }
    }

    // MARK: - Private Views

    @ViewBuilder
    private var pillContent: some View {
        let calculatedBottom = bottomOffset + extraInputOffset

        HStack(spacing: theme.space.sm) {
            Text("Planning route")
                .font(.system(size: theme.type.body.sm.fontSize, weight: .regular))
                .foregroundStyle(theme.colors.onSurface.muted)

            TypingIndicator(theme: theme)
        }
        .padding(.horizontal, theme.space.md)
        .padding(.vertical, 10)
        .background(theme.colors.surface.default)
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .overlay {
            RoundedRectangle(cornerRadius: 20)
                .stroke(theme.colors.border.default, lineWidth: theme.borderWidth.hairline)
        }
        .shadow(
            color: theme.colors.scrim.opacity(0.15),
            radius: theme.elevation.level4.radius,
            x: theme.elevation.level4.offsetX,
            y: theme.elevation.level4.offsetY
        )
        .frame(maxWidth: .infinity)
        .padding(.bottom, calculatedBottom)
        .accessibilityIdentifier(testID ?? "map-planning-indicator")
    }
}

// MARK: - Typing Indicator Component

/**
 * Typing indicator component
 *
 * Three animated dots shown inline in the planning pill.
 * Following React Native component from react-native/components/chat/typing-indicator.tsx
 *
 * ## Animation
 * - Each dot: scale 0.6 → 1.0 → 0.6, 900 ms loop
 * - Staggered: 150ms delay per dot
 * - sm variant: 4pt diameter, 3pt gap
 *
 * ## Parameters
 * - theme: Theme instance for semantic tokens
 */
private struct TypingIndicator: View {
    let theme: Theme

    // Animation state
    @State private var dot1Scale: CGFloat = 0.6
    @State private var dot2Scale: CGFloat = 0.6
    @State private var dot3Scale: CGFloat = 0.6

    private let dotSize: CGFloat = 4
    private let dotGap: CGFloat = 3

    var body: some View {
        HStack(spacing: dotGap) {
            TypingDot(scale: dot1Scale, theme: theme)
            TypingDot(scale: dot2Scale, theme: theme)
            TypingDot(scale: dot3Scale, theme: theme)
        }
        .onAppear {
            animateDots()
        }
    }

    private func animateDots() {
        let animationDuration: Double = 0.3
        let pauseDuration: Double = 0.3
        let staggerDelay: Double = 0.15

        // Dot 1 - starts immediately
        withAnimation(.easeInOut(duration: animationDuration).repeatForever(autoreverses: true)) {
            dot1Scale = 1.0
        }

        // Dot 2 - starts after stagger
        DispatchQueue.main.asyncAfter(deadline: .now() + staggerDelay) {
            withAnimation(.easeInOut(duration: animationDuration).repeatForever(autoreverses: true)) {
                dot2Scale = 1.0
            }
        }

        // Dot 3 - starts after double stagger
        DispatchQueue.main.asyncAfter(deadline: .now() + staggerDelay * 2) {
            withAnimation(.easeInOut(duration: animationDuration).repeatForever(autoreverses: true)) {
                dot3Scale = 1.0
            }
        }
    }
}

// MARK: - Typing Dot Component

/**
 * Single typing dot component
 *
 * ## Parameters
 * - scale: Current scale value (0.6 to 1.0)
 * - theme: Theme instance for semantic tokens
 */
private struct TypingDot: View {
    let scale: CGFloat
    let theme: Theme

    var body: some View {
        let dotColor = theme.colors.onSurface.subtle ?? theme.colors.onSurface.default

        Circle()
            .fill(dotColor)
            .frame(width: 4, height: 4)
            .scaleEffect(scale)
    }
}

// MARK: - Preview

#Preview("Map Planning Indicator - Visible") {
    ZStack {
        Color.gray.opacity(0.3)
            .ignoresSafeArea()

        LSMapPlanningIndicator(
            visible: true,
            bottomOffset: 100,
            extraInputOffset: 0
        )
    }
    .laneShadowTheme()
}

#Preview("Map Planning Indicator - Hidden") {
    ZStack {
        Color.gray.opacity(0.3)
            .ignoresSafeArea()

        LSMapPlanningIndicator(
            visible: false
        )
    }
    .laneShadowTheme()
}

#Preview("Map Planning Indicator - With Extra Offset") {
    ZStack {
        Color.gray.opacity(0.3)
            .ignoresSafeArea()

        VStack {
            Spacer()

            LSMapPlanningIndicator(
                visible: true,
                bottomOffset: 100,
                extraInputOffset: 50
            )

            Rectangle()
                .fill(Color.gray.opacity(0.5))
                .frame(height: 50)
                .overlay {
                    Text("Chat Input (simulated)")
                        .foregroundStyle(.white)
                }
        }
    }
    .laneShadowTheme()
}

#Preview("Dark Theme") {
    ZStack {
        Color.gray.opacity(0.3)
            .ignoresSafeArea()

        LSMapPlanningIndicator(
            visible: true,
            bottomOffset: 100
        )
    }
    .laneShadowTheme()
    .preferredColorScheme(.dark)
}
