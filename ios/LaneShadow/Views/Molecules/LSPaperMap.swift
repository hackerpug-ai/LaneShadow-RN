import LaneShadowTheme
import SwiftUI

/// LSPaperMap — Paper substrate map with contour grid overlay.
///
/// Replaces LinearGradient placeholder with warm copper-tinted paper
/// canvas and SVG contour grid lines for sandbox map slots.
public struct LSPaperMap: View {
    @Environment(\.theme) private var theme

    public enum OverlayStyle {
        case none
        case contours
        case brokenPolyline
    }

    private let overlayStyle: OverlayStyle
    private let showPins: Bool

    public init(
        overlayStyle: OverlayStyle = .contours,
        showPins: Bool = false
    ) {
        self.overlayStyle = overlayStyle
        self.showPins = showPins
    }

    public var body: some View {
        ZStack {
            // Paper substrate background
            paperSubstrate

            // Contour grid overlay
            if overlayStyle == .contours || overlayStyle == .brokenPolyline {
                contourGrid
            }

            // Broken polyline for error state
            if overlayStyle == .brokenPolyline {
                brokenPolyline
            }

            // Favorite pins
            if showPins {
                favoritePins
            }
        }
        .accessibilityIdentifier("paper-map")
    }

    // MARK: - Paper Substrate

    private var paperSubstrate: some View {
        // Use card.default as paper substrate (closest semantic equivalent to map.paper token)
        // TODO: Add theme.colors.map.paper token for map-specific paper substrate color (#1B140E)
        theme.colors.card.default
            .accessibilityIdentifier("paper-substrate")
    }

    // MARK: - Contour Grid

    private var contourGrid: some View {
        ZStack {
            // Horizontal contour lines
            ForEach(0 ..< 20, id: \.self) { i in
                Rectangle()
                    .fill(theme.colors.divider.default)
                    .frame(height: contourFaintStroke)
                    .position(y: CGFloat(i) * contourSpacing)
            }

            // Vertical contour lines
            ForEach(0 ..< 20, id: \.self) { i in
                Rectangle()
                    .fill(theme.colors.divider.default)
                    .frame(width: contourFaintStroke)
                    .position(x: CGFloat(i) * contourSpacing)
            }
        }
        .accessibilityIdentifier("contour-grid")
    }

    // MARK: - Broken Polyline

    private var brokenPolyline: some View {
        Path { path in
            // Create a broken polyline pattern
            let startPoint = CGPoint(x: 100, y: 200)
            var currentPoint = startPoint

            path.move(to: currentPoint)

            // Add segments with gaps
            for i in 0 ..< 5 {
                let nextPoint = CGPoint(
                    x: currentPoint.x + 60,
                    y: currentPoint.y + CGFloat(i % 2 == 0 ? 40 : -40)
                )
                path.addLine(to: nextPoint)
                currentPoint = nextPoint

                // Skip to next segment (gap)
                if i < 4 {
                    let gapPoint = CGPoint(
                        x: currentPoint.x + 20,
                        y: currentPoint.y
                    )
                    path.move(to: gapPoint)
                    currentPoint = gapPoint
                }
            }
        }
        .stroke(
            theme.colors.danger.default,
            style: StrokeStyle(
                lineWidth: theme.borderWidth.thick,
                lineCap: .round,
                dash: [20, 10]
            )
        )
        .accessibilityIdentifier("broken-polyline")
    }

    // MARK: - Favorite Pins

    private var favoritePins: some View {
        ZStack {
            // Sample favorite pin positions
            LSFavoritePinDot()
                .position(x: 120, y: 180)

            LSFavoritePinDot()
                .position(x: 240, y: 320)

            LSFavoritePinDot()
                .position(x: 180, y: 450)
        }
        .accessibilityIdentifier("favorite-pins")
    }

    // MARK: - Theme Token Values

    private var contourStroke: CGFloat {
        // map.contour = 0.9pt
        0.9
    }

    private var contourFaintStroke: CGFloat {
        // map.contourFaint = 0.7pt
        0.7
    }

    private var contourSpacing: CGFloat {
        // Space between contour lines
        theme.space.md * 2
    }
}

// MARK: - Preview

#Preview {
    LSPaperMap(overlayStyle: .contours, showPins: true)
}
