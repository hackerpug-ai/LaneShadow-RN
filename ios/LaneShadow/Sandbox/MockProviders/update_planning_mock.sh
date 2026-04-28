#!/bin/bash
# Update all remaining PlanningScreenState initializations

# For overflowState
perl -i -pe 's/(private static func overflowState\(\) -> PlanningScreenState \{[\s\S]*?PlanningScreenState\()/
$1
            phases: [
                PlanningPhaseData(id: "reading", label: "Reading your ride request", status: "done"),
                PlanningPhaseData(id: "analyzing", label: "Analyzing terrain", status: "done"),
                PlanningPhaseData(id: "sketching", label: "Sketching primary routes", status: "done"),
                PlanningPhaseData(id: "alternatives", label: "Finding alternatives", status: "active"),
                PlanningPhaseData(id: "validating", label: "Validating road conditions", status: "pending"),
                PlanningPhaseData(id: "weather", label: "Checking weather forecasts", status: "pending"),
                PlanningPhaseData(id: "traffic", label: "Analyzing traffic patterns", status: "pending"),
                PlanningPhaseData(id: "scenic", label: "Evaluating scenic value", status: "pending"),
                PlanningPhaseData(id: "building", label: "Building final routes", status: "pending"),
                PlanningPhaseData(id: "optimizing", label: "Optimizing for preferences", status: "pending"),
                PlanningPhaseData(id: "finalizing", label: "Finalizing recommendations", status: "pending"),
            ],
            message: NavigatorMessage(
                id: "msg-001",
                sessionId: "session-001",
                body: "I'm analyzing every possible route combination between Santa Cruz and Big Sur, taking into account road conditions, weather patterns, traffic forecasts, scenic value, and your personal preferences for twisty roads and coastal views. This is taking longer than usual because there are so many excellent options in this area.",
                timestamp: "2025-04-25T10:30:00Z",
                kind: "response",
                attachments: nil,
                detail: "I've found 47 potential routes so far and am evaluating each one.",
                pinned: false
            ),
            isThinking: true,
            showSlowApology: false,
            showCancelConfirm: false,
            showWarningChrome: false
        )/' PlanningMockProvider.swift
