import Foundation
@testable import LaneShadow

@MainActor
final class StubLaneShadowConvexClient: @unchecked Sendable, @preconcurrency LaneShadowPlanningDataProviding {
    private var currentUserContinuation: AsyncStream<LaneShadowCurrentUser?>.Continuation?
    private var sessionsContinuation: AsyncStream<[Session]>.Continuation?
    private var sessionMessagesContinuations: [String: AsyncStream<[LaneShadowSessionMessage]>.Continuation] = [:]
    private var routePlanContinuations: [String: AsyncThrowingStream<LaneShadowRoutePlanSnapshot, Error>.Continuation] =
        [:]
    private var activeRoutePlanContinuations: [String: AsyncStream<[LaneShadowRoutePlanSnapshot]>.Continuation] = [:]
    private var latestCurrentUser: LaneShadowCurrentUser?
    private var latestSessions: [Session] = []
    private var latestSessionMessages: [String: [LaneShadowSessionMessage]] = [:]
    private var latestRoutePlans: [String: LaneShadowRoutePlanSnapshot] = [:]
    private var latestActiveRoutePlans: [String: [LaneShadowRoutePlanSnapshot]] = [:]

    var stubCreatePlanningSessionResult = LaneShadowPlanningSessionCreationResult(sessionId: "session-123")
    var stubCreatePlanningSessionError: Error?
    var stubSendPlanningMessageResult = LaneShadowSendMessageResult(
        response: "",
        messageId: "message-123",
        attachments: nil
    )
    var stubSendPlanningMessageError: Error?
    var stubFetchRoutePlanError: Error?
    var stubCancelRoutePlanError: Error?

    private(set) var createPlanningSessionCalls: [String] = []
    private(set) var sendPlanningMessageCalls: [LaneShadowPlanningMessageCall] = []
    private(set) var fetchRoutePlanCalls: [String] = []
    private(set) var routePlanSubscriptionCalls: [String] = []
    private(set) var cancelRoutePlanCalls: [String] = []

    func subscribeToCurrentUser() -> AsyncStream<LaneShadowCurrentUser?> {
        AsyncStream { continuation in
            currentUserContinuation = continuation
            if let latestCurrentUser {
                continuation.yield(latestCurrentUser)
            }
        }
    }

    func subscribeToSessions() -> AsyncStream<[Session]> {
        AsyncStream { continuation in
            sessionsContinuation = continuation
            if !latestSessions.isEmpty {
                continuation.yield(latestSessions)
            }
        }
    }

    func subscribeToSessionMessages(sessionId: String, limit _: Int) -> AsyncStream<[LaneShadowSessionMessage]> {
        AsyncStream { continuation in
            sessionMessagesContinuations[sessionId] = continuation
            if let currentMessages = latestSessionMessages[sessionId] {
                continuation.yield(currentMessages)
            }
        }
    }

    func subscribeToRoutePlan(routePlanId: String) -> AsyncThrowingStream<LaneShadowRoutePlanSnapshot, Error> {
        AsyncThrowingStream { continuation in
            routePlanSubscriptionCalls.append(routePlanId)
            routePlanContinuations[routePlanId] = continuation
            if let currentPlan = latestRoutePlans[routePlanId] {
                continuation.yield(currentPlan)
            }
        }
    }

    func subscribeToActiveRoutePlans(sessionId: String) -> AsyncStream<[LaneShadowRoutePlanSnapshot]> {
        AsyncStream { continuation in
            activeRoutePlanContinuations[sessionId] = continuation
            if let currentPlans = latestActiveRoutePlans[sessionId] {
                continuation.yield(currentPlans)
            }
        }
    }

    func fetchRoutePlan(routePlanId: String) async throws -> LaneShadowRoutePlanSnapshot {
        fetchRoutePlanCalls.append(routePlanId)

        if let stubFetchRoutePlanError {
            throw stubFetchRoutePlanError
        }

        if let currentPlan = latestRoutePlans[routePlanId] {
            return currentPlan
        }

        throw LaneShadowError.server("Route plan not found")
    }

    func sendCurrentUser(_ currentUser: LaneShadowCurrentUser?) {
        latestCurrentUser = currentUser
        currentUserContinuation?.yield(currentUser)
    }

    func sendSessions(_ sessions: [Session]) {
        latestSessions = sessions
        sessionsContinuation?.yield(sessions)
    }

    func sendSessionMessages(_ messages: [LaneShadowSessionMessage], sessionId: String) {
        latestSessionMessages[sessionId] = messages
        sessionMessagesContinuations[sessionId]?.yield(messages)
    }

    func sendRoutePlan(_ routePlan: LaneShadowRoutePlanSnapshot) {
        latestRoutePlans[routePlan.id] = routePlan
        routePlanContinuations[routePlan.id]?.yield(routePlan)
    }

    func failRoutePlanObservation(routePlanId: String, error: Error) {
        routePlanContinuations[routePlanId]?.finish(throwing: error)
    }

    func sendActiveRoutePlans(_ plans: [LaneShadowRoutePlanSnapshot], sessionId: String) {
        latestActiveRoutePlans[sessionId] = plans
        activeRoutePlanContinuations[sessionId]?.yield(plans)
    }

    func finishObservationStreams() {
        currentUserContinuation?.finish()
        currentUserContinuation = nil

        sessionsContinuation?.finish()
        sessionsContinuation = nil

        for continuation in sessionMessagesContinuations.values {
            continuation.finish()
        }
        sessionMessagesContinuations.removeAll()

        for continuation in routePlanContinuations.values {
            continuation.finish()
        }
        routePlanContinuations.removeAll()

        for continuation in activeRoutePlanContinuations.values {
            continuation.finish()
        }
        activeRoutePlanContinuations.removeAll()
    }

    func createPlanningSession(firstMessage: String) async throws -> LaneShadowPlanningSessionCreationResult {
        createPlanningSessionCalls.append(firstMessage)
        if let stubCreatePlanningSessionError {
            throw stubCreatePlanningSessionError
        }
        return stubCreatePlanningSessionResult
    }

    func sendPlanningMessage(
        sessionId: String,
        content: String,
        currentLocation: LaneShadowCurrentLocation?
    ) async throws -> LaneShadowSendMessageResult {
        sendPlanningMessageCalls.append(
            LaneShadowPlanningMessageCall(
                sessionId: sessionId,
                content: content,
                currentLocation: currentLocation
            )
        )

        if let stubSendPlanningMessageError {
            throw stubSendPlanningMessageError
        }

        return stubSendPlanningMessageResult
    }

    func cancelRoutePlan(routePlanId: String) async throws {
        cancelRoutePlanCalls.append(routePlanId)
        if let stubCancelRoutePlanError {
            throw stubCancelRoutePlanError
        }
    }
}

struct LaneShadowPlanningMessageCall: Equatable {
    let sessionId: String
    let content: String
    let currentLocation: LaneShadowCurrentLocation?
}
