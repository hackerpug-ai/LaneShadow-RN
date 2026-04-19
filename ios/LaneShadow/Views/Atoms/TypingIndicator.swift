import LaneShadowTheme
import SwiftUI

// MARK: - Typing Indicator Size

public enum LSTypingIndicatorSize {
    case small
    case medium

    var dotDiameter: CGFloat {
        switch self {
        case .small: 4
        case .medium: 6
        }
    }

    var gap: CGFloat {
        switch self {
        case .small: 3
        case .medium: 4
        }
    }
}

// MARK: - Typing Indicator Component

/**
 * Typing indicator component
 *
 * Animated dots that scale in sequence to indicate typing activity.
 *
 * ## Design Tokens Used
 * - Colors: `theme.colors.onSurface.default` with opacity 0.6 (or override)
 * - Animation: 0.3s easeInOut scale animation, repeating with autoreverse
 * - Stagger: 0s, 0.15s, 0.3s delays for dots 0, 1, 2
 *
 * ## Parameters
 * - size: LSTypingIndicatorSize (small or medium, default small)
 * - color: Optional color override (default: onSurface with 0.6 opacity)
 * - testID: Optional test identifier for UI testing
 */
public struct LSTypingIndicator: View {
    // MARK: - Properties

    @Environment(\.theme) private var theme

    private let size: LSTypingIndicatorSize
    private let color: Color?
    private let testID: String?

    @State private var isAnimating = false

    // MARK: - Initialization

    /// Creates a TypingIndicator
    /// - Parameters:
    ///   - size: Size variant (small or medium, default .small)
    ///   - color: Optional color override (default: onSurface with 0.6 opacity)
    ///   - testID: Optional test identifier
    public init(
        size: LSTypingIndicatorSize = .small,
        color: Color? = nil,
        testID: String? = nil
    ) {
        self.size = size
        self.color = color
        self.testID = testID
    }

    // MARK: - Body

    public var body: some View {
        HStack(spacing: size.gap) {
            ForEach(0 ..< 3) { index in
                dot(at: index)
            }
        }
        .onAppear {
            isAnimating = true
        }
        .accessibilityElement(children: .ignore)
        .accessibilityRole(.progressIndicator)
        .accessibilityLabel("Assistant is typing")
        .accessibilityIdentifier(testID ?? "typing-indicator")
    }

    // MARK: - Subviews

    @ViewBuilder
    private func dot(at index: Int) -> some View {
        let delay = Double(index) * 0.15

        Circle()
            .fill(dotColor)
            .frame(width: size.dotDiameter, height: size.dotDiameter)
            .scaleEffect(isAnimating ? 0.6 : 1.0)
            .animation(
                .easeInOut(duration: 0.3)
                    .repeatForever(autoreverses: true)
                    .delay(delay),
                value: isAnimating
            )
    }

    // MARK: - Private Helpers

    private var dotColor: Color {
        if let override = color {
            return override
        }
        return theme.colors.onSurface.default.opacity(0.6)
    }
}

// MARK: - Preview

#Preview("TypingIndicator - Small") {
    VStack(spacing: 24) {
        LSTypingIndicator(size: .small)
            .laneShadowTheme()

        LSTypingIndicator(size: .small, color: .blue)
            .laneShadowTheme()

        LSTypingIndicator(size: .small, testID: "custom-test-id")
            .laneShadowTheme()
    }
    .padding()
}

#Preview("TypingIndicator - Medium") {
    VStack(spacing: 24) {
        LSTypingIndicator(size: .medium)
            .laneShadowTheme()

        LSTypingIndicator(size: .medium, color: .purple)
            .laneShadowTheme()

        LSTypingIndicator(size: .medium, testID: "medium-test-id")
            .laneShadowTheme()
    }
    .padding()
}

#Preview("TypingIndicator - All Variants") {
    VStack(spacing: 32) {
        VStack(spacing: 16) {
            Text("Small Size")
                .font(.headline)
            LSTypingIndicator(size: .small)
        }

        VStack(spacing: 16) {
            Text("Medium Size")
                .font(.headline)
            LSTypingIndicator(size: .medium)
        }

        VStack(spacing: 16) {
            Text("Custom Color (Blue)")
                .font(.headline)
            LSTypingIndicator(size: .medium, color: .blue)
        }
    }
    .laneShadowTheme()
    .padding()
}

#Preview("TypingIndicator - In Context") {
    VStack(alignment: .leading, spacing: 16) {
        Text("Conversation")
            .font(.headline)
            .padding(.horizontal)

        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("User message")
                    .padding()
                    .background(Color.blue.opacity(0.1))
                    .cornerRadius(8)
                Spacer()
            }

            HStack {
                LSTypingIndicator(size: .small)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(16)
                Spacer()
            }
        }
        .padding()
    }
    .laneShadowTheme()
}
