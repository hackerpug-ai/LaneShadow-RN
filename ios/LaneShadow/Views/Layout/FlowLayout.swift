import SwiftUI

/// A layout that arranges its children in a flow, wrapping to multiple lines as needed.
///
/// This implementation uses the SwiftUI `Layout` protocol to create a flexible
/// flow layout that automatically wraps children to new rows when they exceed
/// the available width.
public struct FlowLayout: Layout {
    private let spacing: CGFloat
    private let alignment: HorizontalAlignment

    public init(
        spacing: CGFloat = 8,
        alignment: HorizontalAlignment = .leading
    ) {
        self.spacing = spacing
        self.alignment = alignment
    }

    public func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = FlowResult(
            in: proposal.replacingUnspecifiedDimensions().width,
            subviews: subviews,
            spacing: spacing
        )
        return result.size
    }

    public func placeSubviews(
        in bounds: CGRect,
        proposal: ProposedViewSize,
        subviews: Subviews,
        cache: inout ()
    ) {
        let result = FlowResult(
            in: bounds.width,
            subviews: subviews,
            spacing: spacing
        )

        for (index, subview) in subviews.enumerated() {
            let position = result.positions[index]
            let x = bounds.minX + position.x
            let y = bounds.minY + position.y

            subview.place(
                at: CGPoint(x: x, y: y),
                proposal: .unspecified
            )
        }
    }

    // MARK: - Flow Result

    private struct FlowResult {
        let size: CGSize
        let positions: [CGPoint]

        init(in maxWidth: CGFloat, subviews: Subviews, spacing: CGFloat) {
            var positions: [CGPoint] = []
            var currentX: CGFloat = 0
            var currentY: CGFloat = 0
            var rowHeight: CGFloat = 0

            let sizes = subviews.map { $0.sizeThatFits(.unspecified) }

            for size in sizes {
                // Check if we need to wrap to next line
                if currentX + size.width > maxWidth && currentX > 0 {
                    currentX = 0
                    currentY += rowHeight + spacing
                    rowHeight = 0
                }

                positions.append(CGPoint(x: currentX, y: currentY))

                currentX += size.width + spacing
                rowHeight = max(rowHeight, size.height)
            }

            self.positions = positions
            self.size = CGSize(width: maxWidth, height: currentY + rowHeight)
        }
    }
}
