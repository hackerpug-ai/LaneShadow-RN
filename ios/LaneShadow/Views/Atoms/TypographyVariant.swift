import LaneShadowTheme
import NativeTheme

public struct TypographyVariant: Equatable, Sendable {
    public enum Category: String, Sendable {
        case label
        case body
        case title
        case heading
        case display
        case opinion
    }

    public enum Size: String, Sendable {
        case sm
        case md
        case lg
        case xl
    }

    public let category: Category
    public let size: Size
    private let themeStyle: @Sendable (Theme) -> TypographyStyle

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
    public static let opinion = OpinionVariants()

    public struct LabelVariants: Sendable {
        public let sm = TypographyVariant(category: .label, size: .sm) { $0.type.label.sm }
        public let md = TypographyVariant(category: .label, size: .md) { $0.type.label.md }
        public let lg = TypographyVariant(category: .label, size: .lg) { $0.type.label.lg }
        public let xl = TypographyVariant(category: .label, size: .xl) { $0.type.label.xl }
    }

    public struct BodyVariants: Sendable {
        public let sm = TypographyVariant(category: .body, size: .sm) { $0.type.body.sm }
        public let md = TypographyVariant(category: .body, size: .md) { $0.type.body.md }
        public let lg = TypographyVariant(category: .body, size: .lg) { $0.type.body.lg }
        public let xl = TypographyVariant(category: .body, size: .xl) { $0.type.body.xl }
    }

    public struct TitleVariants: Sendable {
        public let sm = TypographyVariant(category: .title, size: .sm) { $0.type.title.sm }
        public let md = TypographyVariant(category: .title, size: .md) { $0.type.title.md }
        public let lg = TypographyVariant(category: .title, size: .lg) { $0.type.title.lg }
        public let xl = TypographyVariant(category: .title, size: .xl) { $0.type.title.xl }
    }

    public struct HeadingVariants: Sendable {
        public let sm = TypographyVariant(category: .heading, size: .sm) { $0.type.heading.sm }
        public let md = TypographyVariant(category: .heading, size: .md) { $0.type.heading.md }
        public let lg = TypographyVariant(category: .heading, size: .lg) { $0.type.heading.lg }
        public let xl = TypographyVariant(category: .heading, size: .xl) { $0.type.heading.xl }
    }

    public struct DisplayVariants: Sendable {
        public let sm = TypographyVariant(category: .display, size: .sm) { $0.type.display.sm }
        public let md = TypographyVariant(category: .display, size: .md) { $0.type.display.md }
        public let lg = TypographyVariant(category: .display, size: .lg) { $0.type.display.lg }
        public let xl = TypographyVariant(category: .display, size: .xl) { $0.type.display.xl }
    }

    public struct OpinionVariants: Sendable {
        public let sm = TypographyVariant(category: .opinion, size: .sm) { $0.type.opinion.sm }
        public let md = TypographyVariant(category: .opinion, size: .md) { $0.type.opinion.md }
        public let lg = TypographyVariant(category: .opinion, size: .lg) { $0.type.opinion.lg }
        public let xl = TypographyVariant(category: .opinion, size: .xl) { $0.type.opinion.xl }
    }

    public static let allLabel: [TypographyVariant] = [
        .label.xl,
        .label.lg,
        .label.md,
        .label.sm,
    ]

    public static let allBody: [TypographyVariant] = [
        .body.xl,
        .body.lg,
        .body.md,
        .body.sm,
    ]

    public static let allTitle: [TypographyVariant] = [
        .title.xl,
        .title.lg,
        .title.md,
        .title.sm,
    ]

    public static let allHeading: [TypographyVariant] = [
        .heading.xl,
        .heading.lg,
        .heading.md,
        .heading.sm,
    ]

    public static let allDisplay: [TypographyVariant] = [
        .display.xl,
        .display.lg,
        .display.md,
        .display.sm,
    ]

    public static let allOpinion: [TypographyVariant] = [
        .opinion.xl,
        .opinion.lg,
        .opinion.md,
        .opinion.sm,
    ]

    public static let all: [TypographyVariant] = [
        // Display (largest)
        .display.xl,
        .display.lg,
        .display.md,
        .display.sm,
        // Heading
        .heading.xl,
        .heading.lg,
        .heading.md,
        .heading.sm,
        // Opinion
        .opinion.xl,
        .opinion.lg,
        .opinion.md,
        .opinion.sm,
        // Title
        .title.xl,
        .title.lg,
        .title.md,
        .title.sm,
        // Body
        .body.xl,
        .body.lg,
        .body.md,
        .body.sm,
        // Label (smallest)
        .label.xl,
        .label.lg,
        .label.md,
        .label.sm,
    ]

    public var tokenPath: String {
        "type.\(category.rawValue).\(size.rawValue)"
    }
}
