import LaneShadowTheme
import SwiftUI

// MARK: - MotorcyclePlusIcon Component

/**
 * MotorcyclePlusIcon component
 *
 * Motorbike icon with plus badge at bottom-right
 *
 * ## Design Tokens Used
 * - Colors:
 *   - `theme.colors.onSurface.default` - Base motorbike icon
 *   - `theme.colors.primary.default` - Plus badge
 *
 * ## Parameters
 * - Parameters:
 *   - size: Overall icon size (default: 22)
 *   - baseColor: Optional base icon color (default: nil, uses theme.onSurface.default)
 */
public struct LSMotorcyclePlusIcon: View {
    @Environment(\.theme) private var theme

    private let size: CGFloat
    private let baseColor: Color?

    public init(
        size: CGFloat = 22,
        baseColor: Color? = nil
    ) {
        self.size = size
        self.baseColor = baseColor
    }

    // MARK: - Computed Properties

    private var overlaySize: CGFloat {
        (size * 0.55).rounded()
    }

    private var offset: CGFloat {
        overlaySize * 0.2
    }

    // MARK: - Body

    public var body: some View {
        ZStack(alignment: .bottomTrailing) {
            // Base motorbike icon
            Image(systemName: "bicycle")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: size, height: size)
                .foregroundStyle(baseColor ?? theme.colors.onSurface.default)

            // Plus badge overlay
            Image(systemName: "plus.circle.fill")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: overlaySize, height: overlaySize)
                .foregroundStyle(theme.colors.primary.default)
                .offset(x: -offset, y: -offset)
        }
        .frame(width: size, height: size)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Motorcycle with plus badge")
    }
}

// MARK: - Preview

#Preview("Default Size") {
    LSMotorcyclePlusIcon()
        .laneShadowTheme()
        .padding()
        .background(Color.gray.opacity(0.1))
}

#Preview("Small") {
    LSMotorcyclePlusIcon(size: 16)
        .laneShadowTheme()
        .padding()
        .background(Color.gray.opacity(0.1))
}

#Preview("Large") {
    LSMotorcyclePlusIcon(size: 32)
        .laneShadowTheme()
        .padding()
        .background(Color.gray.opacity(0.1))
}

#Preview("Custom Base Color") {
    LSMotorcyclePlusIcon(size: 22, baseColor: .blue)
        .laneShadowTheme()
        .padding()
        .background(Color.gray.opacity(0.1))
}

#Preview("Dark Mode") {
    LSMotorcyclePlusIcon(size: 22)
        .laneShadowTheme()
        .padding()
        .background(Color.black)
        .preferredColorScheme(.dark)
}
