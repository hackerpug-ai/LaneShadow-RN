import XCTest

final class Sprint03WDAArtifactTests: XCTestCase {
    private let repositoryRoot = URL(fileURLWithPath: #filePath)
        .deletingLastPathComponent()
        .deletingLastPathComponent()
        .deletingLastPathComponent()
        .deletingLastPathComponent()

    func testSprint03WdaScriptCreatesRealDeviceSession() throws {
        let scriptURL = repositoryRoot.appendingPathComponent("ios/E2E/sprint-03-auth.js")
        XCTAssertTrue(FileManager.default.fileExists(atPath: scriptURL.path), "Expected sprint-03-auth.js to exist")

        let script = try String(contentsOf: scriptURL, encoding: .utf8)
        XCTAssertTrue(script.contains("client.status()"), "Script should probe WDA status before session creation")
        XCTAssertTrue(script.contains("createSession"), "Script should create a WDA app session")
        XCTAssertTrue(script.contains("-UITesting"), "Script should launch app with -UITesting argument")
        XCTAssertTrue(script.contains("readiness"), "Script should capture readiness screenshot evidence")
        XCTAssertTrue(script.contains("tapElement"), "Script should tap interactive elements through WDA")
        XCTAssertTrue(script.contains("terminateApp"), "Script should terminate app for cold-start restore")
        XCTAssertTrue(script.contains("launchApp"), "Script should launch app for cold-start restore")
        XCTAssertTrue(script.contains("activateApp"), "Script should activate app for cold-start restore")
    }

    func testSprint03WdaResultsCoverEveryHumanStep() throws {
        let resultURL = repositoryRoot.appendingPathComponent("ios/E2E/results/sprint-03-auth.json")
        XCTAssertTrue(FileManager.default.fileExists(atPath: resultURL.path), "Expected sprint-03-auth.json artifact")

        let data = try Data(contentsOf: resultURL)
        let payload = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
        let steps = try XCTUnwrap(payload["steps"] as? [[String: Any]])
        let ids = Set(steps.compactMap { $0["id"] as? String })
        XCTAssertEqual(ids, Set(["S03.1", "S03.2", "S03.3", "S03.4", "S03.5", "S03.6", "S03.7", "S03.8"]))
        XCTAssertTrue(steps
            .allSatisfy { $0["status"] is String && $0["detail"] is String && $0["timestamp"] is String })
    }

    func testSprint03WdaScriptUsesStableAuthIdentifiers() throws {
        let scriptURL = repositoryRoot.appendingPathComponent("ios/E2E/sprint-03-auth.js")
        let script = try String(contentsOf: scriptURL, encoding: .utf8)
        XCTAssertTrue(script.contains("auth.signIn.apple"))
        XCTAssertTrue(script.contains("idlescreen-greeting"))
        XCTAssertTrue(script.contains("settings.entry"))
        XCTAssertTrue(script.contains("settings.signOut"))
        XCTAssertTrue(script.contains("auth.signOut.confirm"))
        XCTAssertTrue(script.contains("auth.signIn.root"))

        let helperURL = repositoryRoot.appendingPathComponent("ios/E2E/lib/wda-helpers.js")
        let helper = try String(contentsOf: helperURL, encoding: .utf8)
        XCTAssertTrue(helper.contains("accessibility id"))
    }

    func testSprint03WdaResultsUseManualOrBlockedForUnsupportedEvidence() throws {
        let resultURL = repositoryRoot.appendingPathComponent("ios/E2E/results/sprint-03-auth.json")
        let data = try Data(contentsOf: resultURL)
        let payload = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
        let steps = try XCTUnwrap(payload["steps"] as? [[String: Any]])
        let byId = Dictionary(uniqueKeysWithValues: steps.compactMap { step -> (String, String)? in
            guard let id = step["id"] as? String, let status = step["status"] as? String else { return nil }
            return (id, status)
        })

        XCTAssertTrue(["MANUAL", "BLOCKED"].contains(byId["S03.2"] ?? ""))
        XCTAssertTrue(["MANUAL", "BLOCKED"].contains(byId["S03.6"] ?? ""))
        XCTAssertTrue(["MANUAL", "BLOCKED"].contains(byId["S03.7"] ?? ""))
        XCTAssertTrue(["MANUAL", "BLOCKED"].contains(byId["S03.8"] ?? ""))
    }

    func testSprint03WdaDiagnosticsCoverFailedAndBlockedSteps() throws {
        let scriptURL = repositoryRoot.appendingPathComponent("ios/E2E/sprint-03-auth.js")
        let script = try String(contentsOf: scriptURL, encoding: .utf8)
        XCTAssertTrue(script.contains("diagnosticsDir"))
        XCTAssertTrue(script.contains("BLOCKED"))
        XCTAssertTrue(script.contains("-source.xml"))
        XCTAssertTrue(script.contains("-screenshot.txt"))
        XCTAssertTrue(script.contains("remediation"))
    }

    func testSprint03ArtifactsDoNotUseFakePngDiagnostics() throws {
        let diagnosticsURL = repositoryRoot.appendingPathComponent("ios/E2E/diagnostics/sprint-03-auth")
        let fm = FileManager.default
        let files = try fm.contentsOfDirectory(at: diagnosticsURL, includingPropertiesForKeys: nil)

        for file in files where file.pathExtension.lowercased() == "png" {
            let data = try Data(contentsOf: file)
            let pngSignature = Data([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
            XCTAssertTrue(data.starts(with: pngSignature), "PNG file has invalid signature: \(file.lastPathComponent)")
        }

        let resultURL = repositoryRoot.appendingPathComponent("ios/E2E/results/sprint-03-auth.json")
        let data = try Data(contentsOf: resultURL)
        let payload = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
        let steps = try XCTUnwrap(payload["steps"] as? [[String: Any]])

        for step in steps {
            guard let evidence = step["evidence"] as? [String: Any],
                  let screenshotPath = evidence["screenshot"] as? String else {
                continue
            }
            let screenshotURL = repositoryRoot.appendingPathComponent(screenshotPath)
            XCTAssertTrue(fm.fileExists(atPath: screenshotURL.path), "Evidence screenshot path missing: \(screenshotPath)")
            if screenshotPath.hasSuffix(".png") {
                let screenshotData = try Data(contentsOf: screenshotURL)
                let pngSignature = Data([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
                XCTAssertTrue(screenshotData.starts(with: pngSignature), "Evidence uses .png extension but not PNG content: \(screenshotPath)")
            }
        }
    }
}
