import Foundation

// MARK: - Leaf tokens (DTCG {$type, $value} — we keep only $value)

public struct ColorToken: Decodable, Sendable {
    public let value: String
    private enum CodingKeys: String, CodingKey { case value = "$value" }
}

public struct DimensionToken: Decodable, Sendable {
    public let value: Double
    private enum CodingKeys: String, CodingKey { case value = "$value" }
}

public struct StringToken: Decodable, Sendable {
    public let value: String
    private enum CodingKeys: String, CodingKey { case value = "$value" }
}

public struct NumberToken: Decodable, Sendable {
    public let value: Double
    private enum CodingKeys: String, CodingKey { case value = "$value" }
}

public struct EasingToken: Decodable, Sendable {
    public let value: [Double]
    private enum CodingKeys: String, CodingKey { case value = "$value" }
}

public struct MotionRecipeDto: Decodable, Sendable {
    public let duration: DurationValue?
    public let easing: EasingValue?
    public let iteration: String?

    /// Duration can be either a number (ms) or a string reference like "{motion.duration.standard}"
    public enum DurationValue: Decodable, Sendable {
        case number(Double)
        case string(String)

        public init(from decoder: Decoder) throws {
            let container = try decoder.singleValueContainer()

            if let number = try? container.decode(Double.self) {
                self = .number(number)
            } else if let string = try? container.decode(String.self) {
                self = .string(string)
            } else {
                throw DecodingError.typeMismatch(DurationValue.self, DecodingError.Context(
                    codingPath: container.codingPath,
                    debugDescription: "Expected duration to be either Double or String"
                ))
            }
        }

        /// Helper to get the raw number value if it's a number, or nil otherwise
        public var numberValue: Double? {
            if case let .number(num) = self { return num }
            return nil
        }

        /// Helper to get the string value
        public var stringValue: String? {
            if case let .string(str) = self { return str }
            return nil
        }
    }

    /// Easing can be either a string reference ("{motion.easing.linear}") or "spring"
    public enum EasingValue: Decodable, Sendable {
        case array([Double])
        case string(String)

        public init(from decoder: Decoder) throws {
            let container = try decoder.singleValueContainer()

            if let array = try? container.decode([Double].self) {
                self = .array(array)
            } else if let string = try? container.decode(String.self) {
                self = .string(string)
            } else {
                throw DecodingError.typeMismatch(EasingValue.self, DecodingError.Context(
                    codingPath: container.codingPath,
                    debugDescription: "Expected easing to be either [Double] or String"
                ))
            }
        }

        /// Helper to get the raw array value if it's an array, or nil otherwise
        public var arrayValue: [Double]? {
            if case let .array(arr) = self { return arr }
            return nil
        }

        /// Helper to get the string value
        public var stringValue: String? {
            if case let .string(str) = self { return str }
            return nil
        }
    }
}

// MARK: - Color group (states per group — default required, others optional)

public struct ColorStatesDef: Decodable, Sendable {
    public let defaultColor: ColorToken
    public let hover: ColorToken?
    public let pressed: ColorToken?
    public let disabled: ColorToken?
    public let focus: ColorToken?
    public let muted: ColorToken?
    public let subtle: ColorToken?

    private enum CodingKeys: String, CodingKey {
        case defaultColor = "default"
        case hover, pressed, disabled, focus, muted, subtle
    }
}

public struct ColorModes: Decodable, Sendable {
    public let light: [String: ColorStatesDef]
    public let dark: [String: ColorStatesDef]
}

// MARK: - Typography

public struct TypeStyleDef: Decodable, Sendable {
    public let fontSize: DimensionToken
    public let lineHeight: DimensionToken
    public let fontWeight: StringToken
}

public struct TypeVariantsDef: Decodable, Sendable {
    public let sm: TypeStyleDef
    public let md: TypeStyleDef
    public let lg: TypeStyleDef
}

public struct TypeScaleDef: Decodable, Sendable {
    public let label: TypeVariantsDef
    public let body: TypeVariantsDef
    public let title: TypeVariantsDef
    public let heading: TypeVariantsDef
    public let display: TypeVariantsDef
}

// MARK: - Elevation (shadowColor may be "transparent" or a hex; treat as string)

public struct ShadowOffsetDef: Decodable, Sendable {
    public let width: DimensionToken
    public let height: DimensionToken
}

public struct ElevationDef: Decodable, Sendable {
    public let shadowColor: StringToken
    public let shadowOffset: ShadowOffsetDef
    public let shadowOpacity: DimensionToken
    public let shadowRadius: DimensionToken
    public let elevation: DimensionToken
}

public struct ElevationModes: Decodable, Sendable {
    public let light: [String: ElevationDef]
    public let dark: [String: ElevationDef]
}

// MARK: - Motion

public struct MotionDef: Decodable, Sendable {
    public let duration: [String: DimensionToken]
    public let easing: [String: EasingToken]
    public let recipes: [String: MotionRecipeDto]?
}

// MARK: - Root

public struct SemanticTokens: Decodable, Sendable {
    public let color: ColorModes
    public let space: [String: DimensionToken]
    public let radius: [String: DimensionToken]
    public let type: TypeScaleDef
    public let elevation: ElevationModes
    public let motion: MotionDef
    public let opacity: [String: NumberToken]
    public let borderWidth: [String: DimensionToken]
    public let control: [String: DimensionToken]
    public let hitSlop: [String: DimensionToken]
    public let iconSize: [String: DimensionToken]
    public let shadow: [String: DimensionToken]
    public let size: [String: DimensionToken]
    public let strokeWidth: [String: DimensionToken]
    public let touchTarget: [String: DimensionToken]
}

public struct ThemeTokensFile: Decodable, Sendable {
    public let semantic: SemanticTokens
}
