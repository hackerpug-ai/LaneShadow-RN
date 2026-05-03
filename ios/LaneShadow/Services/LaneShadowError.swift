import ConvexMobile
import Foundation

private let laneShadowUnknownErrorMessage = "Something went wrong. Please try again."

enum LaneShadowError: Equatable, LocalizedError {
    case authRequired
    case sessionRequired
    case userNotFound
    case noFieldsToUpdate
    case notFound
    case invalidInput
    case llmSketchInvalid
    case llmSketchAmbiguous
    case routingCompileFailed
    case conditionsLookupFailed
    case agentResponseInvalid
    case invalidAgentResponseStructure
    case sessionNotFound
    case invalidContent
    case rateLimitExceeded
    case planLimitExceeded
    case planAlreadyActive
    case planNotFound
    case agentBudgetExceeded
    case agentLoopDetected
    case agenticParseFailed
    case lowConfidenceParse
    case generationFailed
    case noRoutesGenerated
    case agentTimeout
    case networkTimeout
    case weatherUnavailable
    case unauthenticated
    case forbidden
    case convex(String)
    case server(String)
    case internalError(String)
    case unknown(String)

    var errorDescription: String? {
        bodyText
    }

    var bodyText: String {
        switch self {
        case .authRequired:
            "User authentication is required to perform this action."
        case .sessionRequired:
            "An active session is required. Please sign in again."
        case .userNotFound:
            "User record could not be found."
        case .noFieldsToUpdate:
            "Provide at least one field to update."
        case .notFound:
            "Requested resource was not found or not accessible."
        case .invalidInput:
            "The provided input is invalid for this operation."
        case .llmSketchInvalid:
            "The generated route sketch is invalid."
        case .llmSketchAmbiguous:
            "The generated route sketch is ambiguous."
        case .routingCompileFailed:
            "Failed to compile the route sketch with the provider."
        case .conditionsLookupFailed:
            "Failed to fetch or map conditions data."
        case .agentResponseInvalid:
            "The planner returned an invalid response."
        case .invalidAgentResponseStructure:
            "The planner returned an invalid response structure."
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
        case .agentBudgetExceeded:
            "The planner hit its budget while building this route."
        case .agentLoopDetected:
            "The planner got stuck in a loop."
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
        case .forbidden:
            "You don't have permission to access this resource."
        case let .convex(message), let .server(message), let .internalError(message):
            message
        case .unknown:
            laneShadowUnknownErrorMessage
        }
    }

    var detailText: String? {
        switch self {
        case .authRequired, .sessionRequired, .userNotFound, .unauthenticated:
            nil
        case .noFieldsToUpdate:
            "Add at least one value and try again."
        case .notFound:
            "Try starting over or refreshing the session."
        case .invalidInput, .invalidContent:
            "Check the text and send a revised message."
        case .llmSketchInvalid:
            "Try rephrasing your request."
        case .llmSketchAmbiguous:
            "Try being more specific about your route."
        case .routingCompileFailed:
            "Try again in a moment."
        case .conditionsLookupFailed:
            "Weather data may be temporarily unavailable. Try again later."
        case .agentResponseInvalid, .invalidAgentResponseStructure:
            "Please try again."
        case .sessionNotFound:
            "Please sign in again or start over."
        case .rateLimitExceeded:
            "Upgrade to Premium for unlimited plans and advanced features!"
        case .planLimitExceeded:
            nil
        case .planAlreadyActive:
            "Wait for the current plan to finish, or start over."
        case .planNotFound:
            "It may have been deleted or you might not have access to it."
        case .agentBudgetExceeded:
            "Try a smaller request or start over."
        case .agentLoopDetected:
            "Try rephrasing your request or start over."
        case .agenticParseFailed:
            "Try rephrasing your request."
        case .lowConfidenceParse:
            "Could you provide more details? For example: " +
                "\"Plan a ride from San Francisco to Santa Cruz along scenic roads.\""
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
        case .forbidden:
            "Please sign in with an account that has access to this resource."
        case .convex, .server, .internalError, .unknown:
            nil
        }
    }

    var allowsRetry: Bool {
        switch self {
        case .authRequired,
             .sessionRequired,
             .userNotFound,
             .noFieldsToUpdate,
             .notFound,
             .invalidInput,
             .sessionNotFound,
             .invalidContent,
             .rateLimitExceeded,
             .planLimitExceeded,
             .planAlreadyActive,
             .planNotFound,
             .unauthenticated,
             .forbidden:
            false
        case .agentBudgetExceeded,
             .agentLoopDetected,
             .agentResponseInvalid,
             .invalidAgentResponseStructure,
             .llmSketchInvalid,
             .llmSketchAmbiguous,
             .routingCompileFailed,
             .conditionsLookupFailed,
             .agenticParseFailed,
             .lowConfidenceParse,
             .generationFailed,
             .noRoutesGenerated,
             .agentTimeout,
             .networkTimeout,
             .weatherUnavailable:
            true
        case .convex, .server, .internalError, .unknown:
            true
        }
    }

    var isUnauthenticated: Bool {
        requiresAuthenticationRecovery
    }

    var requiresAuthenticationRecovery: Bool {
        switch self {
        case .authRequired,
             .sessionRequired,
             .userNotFound,
             .unauthenticated,
             .forbidden:
            true
        default:
            false
        }
    }

    var rawMessage: String {
        switch self {
        case .authRequired:
            "AUTH_REQUIRED"
        case .sessionRequired:
            "SESSION_REQUIRED"
        case .userNotFound:
            "USER_NOT_FOUND"
        case .noFieldsToUpdate:
            "NO_FIELDS_TO_UPDATE"
        case .notFound:
            "NOT_FOUND"
        case .invalidInput:
            "INVALID_INPUT"
        case .llmSketchInvalid:
            "LLM_SKETCH_INVALID"
        case .llmSketchAmbiguous:
            "LLM_SKETCH_AMBIGUOUS"
        case .routingCompileFailed:
            "ROUTING_COMPILE_FAILED"
        case .conditionsLookupFailed:
            "CONDITIONS_LOOKUP_FAILED"
        case .agentResponseInvalid:
            "AGENT_RESPONSE_INVALID"
        case .invalidAgentResponseStructure:
            "INVALID_AGENT_RESPONSE_STRUCTURE"
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
        case .agentBudgetExceeded:
            "AGENT_BUDGET_EXCEEDED"
        case .agentLoopDetected:
            "AGENT_LOOP_DETECTED"
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
        case .forbidden:
            "FORBIDDEN"
        case let .convex(message), let .server(message), let .internalError(message), let .unknown(message):
            message
        }
    }
}
