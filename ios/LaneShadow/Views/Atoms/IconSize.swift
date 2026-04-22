import CoreGraphics
import LaneShadowTheme

public enum IconSize: CaseIterable, Hashable, Sendable {
    case xs
    case sm
    case md
    case lg
    case xl

    public func value(in theme: Theme) -> CGFloat {
        switch self {
        case .xs:
            theme.iconSize.xsmall
        case .sm:
            theme.iconSize.small
        case .md:
            theme.iconSize.medium
        case .lg:
            theme.iconSize.large
        case .xl:
            theme.iconSize.xlarge
        }
    }
}
