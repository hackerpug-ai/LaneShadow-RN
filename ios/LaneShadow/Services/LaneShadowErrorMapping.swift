import ConvexMobile
import Foundation

extension LaneShadowError {
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
            return mapStructuredMessage(msg)
        case let .InternalError(msg):
            return mapStructuredMessage(msg)
        }
    }

    static func map(rawMessage message: String) -> LaneShadowError {
        mapStructuredMessage(message)
    }

    private static func mapConvexPayload(_ payload: String) -> LaneShadowError {
        if let code = jsonCodeToken(in: payload) {
            return mapCodeToken(code, rawMessage: code) ?? .unknown(payload)
        }

        return mapStructuredMessage(payload)
    }

    private static func mapStructuredMessage(_ message: String) -> LaneShadowError {
        let trimmed = message.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            return .unknown(message)
        }

        if let phraseMatch = mapCanonicalPhrase(trimmed) {
            return phraseMatch
        }

        guard let code = leadingCodeToken(in: trimmed) else {
            return .unknown(message)
        }

        return mapCodeToken(code, rawMessage: code) ?? .unknown(message)
    }

    private static func mapCodeToken(_ code: String, rawMessage: String) -> LaneShadowError? {
        let codeMap: [String: LaneShadowError] = [
            "AUTH_REQUIRED": .authRequired,
            "SESSION_REQUIRED": .sessionRequired,
            "USER_NOT_FOUND": .userNotFound,
            "NO_FIELDS_TO_UPDATE": .noFieldsToUpdate,
            "NOT_FOUND": .notFound,
            "INVALID_INPUT": .invalidInput,
            "LLM_SKETCH_INVALID": .llmSketchInvalid,
            "LLM_SKETCH_AMBIGUOUS": .llmSketchAmbiguous,
            "ROUTING_COMPILE_FAILED": .routingCompileFailed,
            "CONDITIONS_LOOKUP_FAILED": .conditionsLookupFailed,
            "AGENT_RESPONSE_INVALID": .agentResponseInvalid,
            "INVALID_AGENT_RESPONSE_STRUCTURE": .invalidAgentResponseStructure,
            "SESSION_NOT_FOUND": .sessionNotFound,
            "INVALID_CONTENT": .invalidContent,
            "RATE_LIMIT_EXCEEDED": .rateLimitExceeded,
            "PLAN_LIMIT_EXCEEDED": .planLimitExceeded,
            "PLAN_ALREADY_ACTIVE": .planAlreadyActive,
            "PLAN_NOT_FOUND": .planNotFound,
            "AGENT_BUDGET_EXCEEDED": .agentBudgetExceeded,
            "AGENT_LOOP_DETECTED": .agentLoopDetected,
            "AGENTIC_PARSE_FAILED": .agenticParseFailed,
            "LOW_CONFIDENCE_PARSE": .lowConfidenceParse,
            "GENERATION_FAILED": .generationFailed,
            "NO_ROUTES_GENERATED": .noRoutesGenerated,
            "AGENT_TIMEOUT": .agentTimeout,
            "NETWORK_TIMEOUT": .networkTimeout,
            "WEATHER_UNAVAILABLE": .weatherUnavailable,
            "UNAUTHENTICATED": .unauthenticated,
        ]
        return codeMap[code]
    }

    private static func mapCanonicalPhrase(_ message: String) -> LaneShadowError? {
        let normalized = message.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()

        let phraseMap: [(phrase: String, error: LaneShadowError)] = [
            ("authentication required", .authRequired),
            ("active session is required", .sessionRequired),
            ("user record could not be found", .userNotFound),
            ("provide at least one field to update", .noFieldsToUpdate),
            ("requested resource was not found or not accessible", .notFound),
            ("provided input is invalid for this operation", .invalidInput),
            ("generated route sketch is invalid", .llmSketchInvalid),
            ("generated route sketch is ambiguous", .llmSketchAmbiguous),
            ("failed to compile the route sketch with the provider", .routingCompileFailed),
            ("failed to fetch or map conditions data", .conditionsLookupFailed),
            ("not found", .notFound),
        ]

        for (phrase, error) in phraseMap where normalized.contains(phrase) {
            return error
        }

        return nil
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
