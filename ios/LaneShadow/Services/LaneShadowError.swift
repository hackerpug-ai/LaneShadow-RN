import ConvexMobile
import Foundation

enum LaneShadowError: Equatable, Sendable, LocalizedError {
    case sessionNotFound
    case invalidContent
    case rateLimitExceeded
    case planLimitExceeded
    case planAlreadyActive
    case planNotFound
    case agenticParseFailed
    case lowConfidenceParse
    case generationFailed
    case noRoutesGenerated
    case agentTimeout
    case networkTimeout
    case weatherUnavailable
    case unauthenticated
    case convex(String)
    case server(String)
    case internalError(String)
    case unknown(String)

    var errorDescription: String? {
        bodyText
    }

    var bodyText: String {
        switch self {
        case .sessionNotFound:
            "I couldn't find that session."
        case .invalidContent:
            "That message doesn't look valid."
        case .rateLimitExceeded:
            "You've reached your monthly limit of 5 route plans. 🔒"
        case .planLimitExceeded:
            "You've used all 5 monthly plans. Upgrade to Premium for unlimited planning!"
        case .planAlreadyActive:
            "You already have an active plan in progress. 🔄"
        case .planNotFound:
            "I couldn't find that plan. 📋"
        case .agenticParseFailed:
            "I couldn't understand that request."
        case .lowConfidenceParse:
            "I'm having trouble understanding your request. 🤔"
        case .generationFailed:
            "I couldn't generate a route plan. Sorry about that! 😔"
        case .noRoutesGenerated:
            "I couldn't find any routes matching your criteria. 🛣️"
        case .agentTimeout:
            "Planning is taking longer than expected. ⏳"
        case .networkTimeout:
            "The request took too long to complete. ⏱️"
        case .weatherUnavailable:
            "Weather information is currently unavailable. 🌤️"
        case .unauthenticated:
            "Your session expired. Please sign in again."
        case let .convex(message), let .server(message), let .internalError(message), let .unknown(message):
            message
        }
    }

    var detailText: String? {
        switch self {
        case .sessionNotFound:
            "Please sign in again or start over."
        case .invalidContent:
            "Check the text and send a revised message."
        case .rateLimitExceeded:
            "Upgrade to Premium for unlimited plans and advanced features!"
        case .planLimitExceeded:
            nil
        case .planAlreadyActive:
            "Wait for the current plan to finish, or start over."
        case .planNotFound:
            "It may have been deleted or you might not have access to it."
        case .agenticParseFailed:
            "Try rephrasing your request."
        case .lowConfidenceParse:
            "Could you provide more details? For example: \"Plan a ride from San Francisco to Santa Cruz along scenic roads.\""
        case .generationFailed:
            "Let's try a different approach. Could you specify your start and end points more clearly?"
        case .noRoutesGenerated:
            "Try adjusting your preferences or check if the locations are accessible by road."
        case .agentTimeout:
            "Please try again. Complex routes may take a moment to process."
        case .networkTimeout:
            "Please try again. If this persists, check your connection or contact support."
        case .weatherUnavailable:
            "You can still plan your route, but weather data won't be included. Try again later for weather updates."
        case .unauthenticated:
            nil
        case .convex, .server, .internalError, .unknown:
            nil
        }
    }

    var allowsRetry: Bool {
        switch self {
        case .sessionNotFound,
             .invalidContent,
             .rateLimitExceeded,
             .planLimitExceeded,
             .planAlreadyActive,
             .planNotFound,
             .unauthenticated:
            false
        case .convex, .server, .internalError, .unknown:
            true
        case .agenticParseFailed,
             .lowConfidenceParse,
             .generationFailed,
             .noRoutesGenerated,
             .agentTimeout,
             .networkTimeout,
             .weatherUnavailable:
            true
        }
    }

    var isUnauthenticated: Bool {
        self == .unauthenticated
    }

    var rawMessage: String {
        switch self {
        case .sessionNotFound:
            "SESSION_NOT_FOUND"
        case .invalidContent:
            "INVALID_CONTENT"
        case .rateLimitExceeded:
            "RATE_LIMIT_EXCEEDED"
        case .planLimitExceeded:
            "PLAN_LIMIT_EXCEEDED"
        case .planAlreadyActive:
            "PLAN_ALREADY_ACTIVE"
        case .planNotFound:
            "PLAN_NOT_FOUND"
        case .agenticParseFailed:
            "AGENTIC_PARSE_FAILED"
        case .lowConfidenceParse:
            "LOW_CONFIDENCE_PARSE"
        case .generationFailed:
            "GENERATION_FAILED"
        case .noRoutesGenerated:
            "NO_ROUTES_GENERATED"
        case .agentTimeout:
            "AGENT_TIMEOUT"
        case .networkTimeout:
            "NETWORK_TIMEOUT"
        case .weatherUnavailable:
            "WEATHER_UNAVAILABLE"
        case .unauthenticated:
            "UNAUTHENTICATED"
        case let .convex(message), let .server(message), let .internalError(message), let .unknown(message):
            message
        }
    }

    static func map(_ error: Error) -> LaneShadowError {
        if let laneShadowError = error as? LaneShadowError {
            return laneShadowError
        }

        guard let clientError = error as? ClientError else {
            return .unknown(error.localizedDescription)
        }

        switch clientError {
        case let .ConvexError(data):
            return mapConvexPayload(data)
        case let .ServerError(msg):
            return mapStructuredMessage(msg, source: .server)
        case let .InternalError(msg):
            return mapStructuredMessage(msg, source: .internalError)
        }
    }

    private enum Source {
        case convex
        case server
        case internalError
        case generic
    }

    private static func mapConvexPayload(_ payload: String) -> LaneShadowError {
        if let code = jsonCodeToken(in: payload) {
            return mapCodeToken(code, rawMessage: code, source: .convex)
        }

        return mapStructuredMessage(payload, source: .convex)
    }

    private static func mapStructuredMessage(_ message: String, source: Source) -> LaneShadowError {
        let trimmed = message.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            return .unknown(message)
        }

        guard let code = leadingCodeToken(in: trimmed) else {
            return .unknown(message)
        }

        return mapCodeToken(code, rawMessage: message, source: source)
    }

    private static func mapCodeToken(_ code: String, rawMessage: String, source: Source) -> LaneShadowError {
        switch code {
        case "SESSION_NOT_FOUND":
            .sessionNotFound
        case "INVALID_CONTENT":
            .invalidContent
        case "RATE_LIMIT_EXCEEDED":
            .rateLimitExceeded
        case "PLAN_LIMIT_EXCEEDED":
            .planLimitExceeded
        case "PLAN_ALREADY_ACTIVE":
            .planAlreadyActive
        case "PLAN_NOT_FOUND":
            .planNotFound
        case "AGENTIC_PARSE_FAILED":
            .agenticParseFailed
        case "LOW_CONFIDENCE_PARSE":
            .lowConfidenceParse
        case "GENERATION_FAILED":
            .generationFailed
        case "NO_ROUTES_GENERATED":
            .noRoutesGenerated
        case "AGENT_TIMEOUT":
            .agentTimeout
        case "NETWORK_TIMEOUT":
            .networkTimeout
        case "WEATHER_UNAVAILABLE":
            .weatherUnavailable
        case "UNAUTHENTICATED":
            .unauthenticated
        default:
            switch source {
            case .convex:
                .convex(code)
            case .server:
                .server(code)
            case .internalError:
                .internalError(code)
            case .generic:
                .unknown(rawMessage)
            }
        }
    }

    private static func jsonCodeToken(in payload: String) -> String? {
        guard let data = payload.trimmingCharacters(in: .whitespacesAndNewlines).data(using: .utf8) else {
            return nil
        }

        guard let object = try? JSONSerialization.jsonObject(with: data),
              let dictionary = object as? [String: Any],
              let code = dictionary["code"] as? String
        else {
            return nil
        }

        return normalizedToken(code)
    }

    private static func leadingCodeToken(in message: String) -> String? {
        let trimmed = message.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let firstCharacter = trimmed.first,
              firstCharacter.isUppercase || firstCharacter.isNumber || firstCharacter == "_"
        else {
            return nil
        }

        let token = trimmed.prefix { character in
            character.isUppercase || character.isNumber || character == "_"
        }
        let tokenString = String(token)
        return tokenString.isEmpty ? nil : tokenString
    }

    private static func normalizedToken(_ token: String) -> String? {
        let uppercased = token.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        return leadingCodeToken(in: uppercased)
    }
}
