import LaneShadowTheme
import NativeTheme

public struct TypographyVariant: Equatable, Sendable {
    public enum Family: String, Sendable {
        case opinion
        case ui
        case instrument
    }

    public enum Size: String, Sendable {
        case xs
        case sm
        case md
        case lg
        case xl
    }

    public enum UIRole: String, Sendable {
        case title
        case body
        case label
    }

    public let family: Family
    public let size: Size
    public let uiRole: UIRole?
    private let themeStyle: @Sendable (Theme) -> LaneShadowTypographyStyle

    private init(
        family: Family,
        size: Size,
        uiRole: UIRole? = nil,
        themeStyle: @escaping @Sendable (Theme) -> LaneShadowTypographyStyle
    ) {
        self.family = family
        self.size = size
        self.uiRole = uiRole
        self.themeStyle = themeStyle
    }

    public var style: LaneShadowTypographyStyle {
        style(in: .shared)
    }

    public func style(in theme: Theme) -> LaneShadowTypographyStyle {
        themeStyle(theme)
    }

    public static func == (lhs: TypographyVariant, rhs: TypographyVariant) -> Bool {
        lhs.family == rhs.family && lhs.size == rhs.size && lhs.uiRole == rhs.uiRole
    }

    public static let opinion = OpinionVariants()
    public static let ui = UIVariants()
    public static let instrument = InstrumentVariants()

    public struct OpinionVariants: Sendable {
        public let sm = TypographyVariant(family: .opinion, size: .sm) { $0.typography.opinion.sm }
        public let md = TypographyVariant(family: .opinion, size: .md) { $0.typography.opinion.md }
        public let lg = TypographyVariant(family: .opinion, size: .lg) { $0.typography.opinion.lg }
        public let xl = TypographyVariant(family: .opinion, size: .xl) { $0.typography.opinion.xl }
    }

    public struct UIVariants: Sendable {
        public let title = UIScale(role: .title)
        public let body = UIScale(role: .body)
        public let label = UIScale(role: .label)
    }

    public struct UIScale: Sendable {
        private let role: UIRole

        public var sm: TypographyVariant {
            TypographyVariant(family: .ui, size: .sm, uiRole: role) { theme in
                style(for: .sm, in: theme)
            }
        }

        public var md: TypographyVariant {
            TypographyVariant(family: .ui, size: .md, uiRole: role) { theme in
                style(for: .md, in: theme)
            }
        }

        public var lg: TypographyVariant {
            TypographyVariant(family: .ui, size: .lg, uiRole: role) { theme in
                style(for: .lg, in: theme)
            }
        }

        fileprivate init(role: UIRole) {
            self.role = role
        }

        private func style(for size: Size, in theme: Theme) -> TypographyStyle {
            switch (role, size) {
            case (.title, .sm): theme.typography.ui.title.sm
            case (.title, .md): theme.typography.ui.title.md
            case (.title, .lg): theme.typography.ui.title.lg
            case (.body, .sm): theme.typography.ui.body.sm
            case (.body, .md): theme.typography.ui.body.md
            case (.body, .lg): theme.typography.ui.body.lg
            case (.label, .sm): theme.typography.ui.label.sm
            case (.label, .md): theme.typography.ui.label.md
            case (.label, .lg): theme.typography.ui.label.lg
            default: theme.typography.ui.body.md
            }
        }
    }

    public struct InstrumentVariants: Sendable {
        public let xs = TypographyVariant(family: .instrument, size: .xs) { $0.typography.instrument.xs }
        public let sm = TypographyVariant(family: .instrument, size: .sm) { $0.typography.instrument.sm }
        public let md = TypographyVariant(family: .instrument, size: .md) { $0.typography.instrument.md }
        public let lg = TypographyVariant(family: .instrument, size: .lg) { $0.typography.instrument.lg }
    }

    public static let allOpinion: [TypographyVariant] = [
        .opinion.xl,
        .opinion.lg,
        .opinion.md,
        .opinion.sm,
    ]

    public static let allUI: [TypographyVariant] = [
        .ui.title.lg,
        .ui.title.md,
        .ui.title.sm,
        .ui.body.lg,
        .ui.body.md,
        .ui.body.sm,
        .ui.label.lg,
        .ui.label.md,
        .ui.label.sm,
    ]

    public static let allInstrument: [TypographyVariant] = [
        .instrument.lg,
        .instrument.md,
        .instrument.sm,
        .instrument.xs,
    ]

    public var tokenPath: String {
        switch family {
        case .opinion:
            "typography.opinion.\(size.rawValue)"
        case .ui:
            "typography.ui.\(uiRole?.rawValue ?? "body").\(size.rawValue)"
        case .instrument:
            "typography.instrument.\(size.rawValue)"
        }
    }
}
