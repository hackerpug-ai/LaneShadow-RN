import Foundation

/// Single source of truth for accessibility identifiers that XCUITests query.
/// Scoped to the LSTopBar + LSChatInput migration set surfaced by the 2026-05-10
/// E2E audit — when an id is renamed in the app, update it here in one place
/// instead of grepping five test files.
enum LSIds {
    // LSTopBar (ios/LaneShadow/Views/Organisms/LSTopBar.swift)
    static let topBar = "lstopbar"
    static let topBarMeta = "lstopbar-meta"
    static let topBarHeadline = "lstopbar-headline"
    static let topBarHamburger = "lstopbar-hamburger"
    static let topBarNew = "lstopbar-new"

    // LSChatInput (ios/LaneShadow/Views/Molecules/LSChatInput.swift)
    static let chatInput = "lschatinput"
    static let chatInputSuggestions = "lschatinput-suggestions"
    static let chatInputField = "lschatinput-field"
    static let chatInputSend = "lschatinput-send"

    // IdleScreenContainer (ios/LaneShadow/Features/Idle/IdleScreenContainer.swift)
    static let idleScreen = "idlescreen"
    static let idleScreenMap = "idlescreen-map"
    static let idleScreenChatInput = "idlescreen-chatinput"
    static let idleScreenInlineError = "idlescreen-inline-error"
    static let idleMapControls = "idle-map-controls"

    // PlanningScreen (ios/LaneShadow/Views/Templates/PlanningScreen.swift)
    static let planningScreen = "planningscreen"
    static let planningScreenMap = "planningscreen-map"
    static let planningScreenPhaseIndicator = "planningscreen-phase-indicator"
    static let planningScreenSketchPolyline = "planningscreen-sketch-polyline"
    static let planningScreenChatInput = "planningscreen-chat-input"
    static let planningScreenTranscript = "planningscreen-transcript"
    static let planningScreenInlineError = "planningscreen-inline-error"

    // LSChatInput collapse + spinner (used by the planning state's locked input)
    static let chatInputCollapse = "lschatinput-collapse"
    static let chatInputSpinner = "lschatinput-spinner"
}
