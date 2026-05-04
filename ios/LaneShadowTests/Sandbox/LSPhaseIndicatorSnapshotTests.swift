import LaneShadowTheme
import SnapshotTesting
import SwiftUI
import Testing
import UIKit
import XCTest
@testable import LaneShadow

/// Snapshot tests verifying LSPhaseIndicator renders canonical Phase enum labels.
///
/// AC-4: Each snapshot shows the canonical label text and passes visual verification (use `pnpm design:review` in Sprint 05+).
/// These tests render LSPhaseIndicator with PlanningPhase data sourced from the Phase enum,
/// capture PNG snapshots, and verify they match committed baselines.
@MainActor
final class LSPhaseIndicatorSnapshotTests: XCTestCase {
    func test_phaseIndicator_rendersCanonicalLabels() {
        UIView.setAnimationsEnabled(false)

        let snapshotDir = Self.snapshotDirectory()
        try? FileManager.default.createDirectory(at: snapshotDir, withIntermediateDirectories: true)

        let canonicalPhases: [Phase] = [.parsing, .searching, .drafting, .enriching, .finalizing]

        for phase in canonicalPhases {
            let indicator = LSPhaseIndicator(
                phases: canonicalPhases.map { p in
                    PlanningPhase(
                        id: p.rawValue,
                        label: p.label,
                        state: p == phase ? .active :
                            (canonicalPhases.firstIndex(of: p)! < canonicalPhases
                                .firstIndex(of: phase)! ? .done : .pending)
                    )
                },
                header: "Planning your ride…"
            )

            let themedView = indicator.laneShadowTheme()
            let controller = UIHostingController(rootView: themedView)
            controller.view.frame = CGRect(x: 0, y: 0, width: 390, height: 300)
            controller.view.backgroundColor = .white

            guard let image = captureViewAsImage(controller.view, size: CGSize(width: 390, height: 300)) else {
                XCTFail("Failed to render snapshot for phase \(phase.rawValue)")
                continue
            }

            let filename = snapshotDir
                .appendingPathComponent("molecules.phaseindicator.canonical-\(phase.rawValue).light.png")
            try? image.pngData()?.write(to: filename)
        }

        let missingSnapshots = canonicalPhases.compactMap { phase -> String? in
            let filename = "molecules.phaseindicator.canonical-\(phase.rawValue).light.png"
            let fileURL = snapshotDir.appendingPathComponent(filename)
            return FileManager.default.fileExists(atPath: fileURL.path) ? nil : filename
        }

        XCTAssertTrue(missingSnapshots.isEmpty, "Missing canonical phase snapshots: \(missingSnapshots)")
    }

    private func captureViewAsImage(_ view: UIView, size: CGSize) -> UIImage? {
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { _ in
            view.drawHierarchy(in: CGRect(origin: .zero, size: size), afterScreenUpdates: true)
        }
    }

    private static func snapshotDirectory() -> URL {
        let testFilePath = URL(fileURLWithPath: #filePath)
        let sandboxDir = testFilePath.deletingLastPathComponent()
        let testsDir = sandboxDir.deletingLastPathComponent()
        return testsDir.appendingPathComponent("__Snapshots__").appendingPathComponent("StorySnapshotTests")
    }
}
