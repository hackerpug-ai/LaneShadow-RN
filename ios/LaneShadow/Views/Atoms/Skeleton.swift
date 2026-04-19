import LaneShadowTheme
import SwiftUI

struct LSSkeleton: View {
    let width: CGFloat
    let height: CGFloat
    let cornerRadius: CGFloat

    @Environment(\.theme) private var theme
    @State private var isPulsing = false

    init(
        width: CGFloat,
        height: CGFloat,
        cornerRadius: CGFloat = 8
    ) {
        self.width = width
        self.height = height
        self.cornerRadius = cornerRadius
    }

    var body: some View {
        RoundedRectangle(cornerRadius: cornerRadius)
            .fill(theme.colors.surface.default)
            .frame(width: width, height: height)
            .opacity(isPulsing ? 0.4 : 1.0)
            .animation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true), value: isPulsing)
            .onAppear { isPulsing = true }
    }
}

#Preview {
    VStack(spacing: 16) {
        LSSkeleton(width: 200, height: 20)
        LSSkeleton(width: 150, height: 16, cornerRadius: 4)
        LSSkeleton(width: 100, height: 100, cornerRadius: 12)
    }
    .padding()
}
