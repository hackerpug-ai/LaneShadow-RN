import LaneShadowTheme
import NativeTheme

public struct TypographyVariant: Equatable, Sendable {
    public enum Category: String, Sendable {
        case label
        case body
        case title
        case heading
        case display
    }

    public enum Size: String, Sendable {
        case sm
        case md
        case lg
    }

    public let category: Category
    public let size: Size
    private let themeStyle: @Sendable (Theme) -> TypographyStyle

    private init(
        category: Category,
        size: Size,
        themeStyle: @escaping @Sendable (Theme) -> TypographyStyle
    ) {
        self.category = category
        self.size = size
        self.themeStyle = themeStyle
    }

    public var style: TypographyStyle {
        style(in: .shared)
    }

    public func style(in theme: Theme) -> TypographyStyle {
        themeStyle(theme)
    }

    public static func == (lhs: TypographyVariant, rhs: TypographyVariant) -> Bool {
        lhs.category == rhs.category && lhs.size == rhs.size
    }

    public static let label = LabelVariants()
    public static let body = BodyVariants()
    public static let title = TitleVariants()
    public static let heading = HeadingVariants()
    public static let display = DisplayVariants()

    public struct LabelVariants: Sendable {
        public let sm = TypographyVariant(category: .label, size: .sm) { $0.type.label.sm }
        public let md = TypographyVariant(category: .label, size: .md) { $0.type.label.md }
        public let lg = TypographyVariant(category: .label, size: .lg) { $0.type.label.lg }
    }

    public struct BodyVariants: Sendable {
        public let sm = TypographyVariant(category: .body, size: .sm) { $0.type.body.sm }
        public let md = TypographyVariant(category: .body, size: .md) { $0.type.body.md }
        public let lg = TypographyVariant(category: .body, size: .lg) { $0.type.body.lg }
    }

    public struct TitleVariants: Sendable {
        public let sm = TypographyVariant(category: .title, size: .sm) { $0.type.title.sm }
        public let md = TypographyVariant(category: .title, size: .md) { $0.type.title.md }
        public let lg = TypographyVariant(category: .title, size: .lg) { $0.type.title.lg }
    }

    public struct HeadingVariants: Sendable {
        public let sm = TypographyVariant(category: .heading, size: .sm) { $0.type.heading.sm }
        public let md = TypographyVariant(category: .heading, size: .md) { $0.type.heading.md }
        public let lg = TypographyVariant(category: .heading, size: .lg) { $0.type.heading.lg }
    }

    public struct DisplayVariants: Sendable {
        public let sm = TypographyVariant(category: .display, size: .sm) { $0.type.display.sm }
        public let md = TypographyVariant(category: .display, size: .md) { $0.type.display.md }
        public let lg = TypographyVariant(category: .display, size: .lg) { $0.type.display.lg }
    }

    public static let allLabel: [TypographyVariant] = [
        .label.lg,
        .label.md,
        .label.sm,
    ]

    public static let allBody: [TypographyVariant] = [
        .body.lg,
        .body.md,
        .body.sm,
    ]

    public static let allTitle: [TypographyVariant] = [
        .title.lg,
        .title.md,
        .title.sm,
    ]

    public static let allHeading: [TypographyVariant] = [
        .heading.lg,
        .heading.md,
        .heading.sm,
    ]

    public static let allDisplay: [TypographyVariant] = [
        .display.lg,
        .display.md,
        .display.sm,
    ]

    public static let all: [TypographyVariant] = [
        // Display (largest)
        .display.lg,
        .display.md,
        .display.sm,
        // Heading
        .heading.lg,
        .heading.md,
        .heading.sm,
        // Title
        .title.lg,
        .title.md,
        .title.sm,
        // Body
        .body.lg,
        .body.md,
        .body.sm,
        // Label (smallest)
        .label.lg,
        .label.md,
        .label.sm,
    ]

    public var tokenPath: String {
        "type.\(category.rawValue).\(size.rawValue)"
    }
}
