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
        XCTAssertTrue(script.contains("S03.1-source.xml"))
        XCTAssertTrue(script.contains("S03.1-failure.png"))
        XCTAssertTrue(script.contains("remediation"))
    }
}
