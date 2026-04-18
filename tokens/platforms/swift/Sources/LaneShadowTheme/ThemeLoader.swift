import Foundation

public enum ThemeLoaderError: Error, CustomStringConvertible {
    case resourceMissing
    case decodingFailed(Error)

    public var description: String {
        switch self {
        case .resourceMissing:
            "LaneShadowTheme: semantic.tokens.json not found in module bundle"
        case let .decodingFailed(err):
            "LaneShadowTheme: decoding semantic.tokens.json failed: \(err)"
        }
    }
}

public enum ThemeLoader {
    /// Loads + decodes the bundled semantic.tokens.json.
    /// The JSON is validated against the schema at commit time (pnpm tokens:validate);
    /// we therefore trust it here and fatalError on unexpected shape rather than
    /// propagating optionals through every accessor.
    public static func loadSemanticTokens() -> SemanticTokens {
        guard let url = Bundle.module.url(forResource: "semantic.tokens", withExtension: "json") else {
            fatalError(ThemeLoaderError.resourceMissing.description)
        }
        do {
            let data = try Data(contentsOf: url)
            let file = try JSONDecoder().decode(ThemeTokensFile.self, from: data)
            return file.semantic
        } catch {
            fatalError(ThemeLoaderError.decodingFailed(error).description)
        }
    }
}
