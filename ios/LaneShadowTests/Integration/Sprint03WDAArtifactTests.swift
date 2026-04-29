import XCTest

final class Sprint03WDAArtifactTests: XCTestCase {
    private let repositoryRoot = URL(fileURLWithPath: #filePath)
        .deletingLastPathComponent()
        .deletingLastPathComponent()
        .deletingLastPathComponent()
        .deletingLastPathComponent()

    private let evidencePathKeys = Set(["log", "diagnostics", "resultArtifact", "t11Evidence", "xcresult"])

    private func isAbsoluteHostPath(_ value: String) -> Bool {
        value.hasPrefix("/") ||
            value.hasPrefix("file://") ||
            value.range(of: #"^[A-Za-z]:\\"#, options: .regularExpression) != nil
    }

    private func collectStringValues(_ value: Any) -> [String] {
        if let string = value as? String {
            return [string]
        }
        if let dict = value as? [String: Any] {
            return dict.values.flatMap(collectStringValues)
        }
        if let array = value as? [Any] {
            return array.flatMap(collectStringValues)
        }
        return []
    }

    private func assertEvidencePathsAreRelativeAndExist(_ evidence: [String: Any], file: StaticString = #filePath, line: UInt = #line) {
        for stringValue in collectStringValues(evidence) {
            XCTAssertFalse(
                isAbsoluteHostPath(stringValue),
                "Closure artifact evidence must not include absolute host paths: \(stringValue)",
                file: file,
                line: line
            )
        }

        for (key, rawValue) in evidence where evidencePathKeys.contains(key) {
            guard let relativePath = rawValue as? String else {
                XCTFail("Evidence path field \(key) must be a string", file: file, line: line)
                continue
            }
            XCTAssertFalse(
                relativePath.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
                "Evidence path field \(key) cannot be empty",
                file: file,
                line: line
            )
            XCTAssertFalse(
                isAbsoluteHostPath(relativePath),
                "Evidence path field \(key) must be repo-relative: \(relativePath)",
                file: file,
                line: line
            )

            let fileURL = repositoryRoot.appendingPathComponent(relativePath)
            XCTAssertTrue(
                FileManager.default.fileExists(atPath: fileURL.path),
                "Evidence path field \(key) is missing file: \(relativePath)",
                file: file,
                line: line
            )
        }
    }

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
        let fileManager = FileManager.default
        let files = try fileManager.contentsOfDirectory(at: diagnosticsURL, includingPropertiesForKeys: nil)

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
                  let screenshotPath = evidence["screenshot"] as? String
            else {
                continue
            }
            let screenshotURL = repositoryRoot.appendingPathComponent(screenshotPath)
            XCTAssertTrue(
                fileManager.fileExists(atPath: screenshotURL.path),
                "Evidence screenshot path missing: \(screenshotPath)"
            )
            if screenshotPath.hasSuffix(".png") {
                let screenshotData = try Data(contentsOf: screenshotURL)
                let pngSignature = Data([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
                XCTAssertTrue(
                    screenshotData.starts(with: pngSignature),
                    "Evidence uses .png extension but not PNG content: \(screenshotPath)"
                )
            }
        }
    }

    func testSprintClosureArtifactSeparatesNativeE2ELanes() throws {
        let closureURL = repositoryRoot.appendingPathComponent("ios/E2E/results/sprint-03-closure.json")
        XCTAssertTrue(
            FileManager.default.fileExists(atPath: closureURL.path),
            "Expected sprint-03-closure.json artifact"
        )

        let data = try Data(contentsOf: closureURL)
        let payload = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
        let lanes = try XCTUnwrap(payload["lanes"] as? [[String: Any]])
        XCTAssertEqual(lanes.count, 4, "Closure artifact should include iOS+Android simulator/device lanes")
        let allowedStatuses = Set(["PASS", "FAIL", "BLOCKED", "MANUAL"])
        let iso8601Formatter = ISO8601DateFormatter()

        let requiredKeys = ["platform", "framework", "target", "command", "status", "timestamp", "evidence"]
        for lane in lanes {
            for key in requiredKeys {
                XCTAssertNotNil(lane[key], "Lane is missing required key \(key): \(lane)")
            }

            let status = try XCTUnwrap(lane["status"] as? String, "Lane status must be a string")
            XCTAssertTrue(allowedStatuses.contains(status), "Lane status must be one of \(allowedStatuses): \(status)")

            let timestamp = try XCTUnwrap(lane["timestamp"] as? String, "Lane timestamp must be a string")
            XCTAssertNotNil(
                iso8601Formatter.date(from: timestamp),
                "Lane timestamp must be ISO8601 parseable: \(timestamp)"
            )

            let evidence = try XCTUnwrap(lane["evidence"] as? [String: Any], "Lane evidence must be an object")
            assertEvidencePathsAreRelativeAndExist(evidence)

            if status == "BLOCKED" {
                let prerequisites = try XCTUnwrap(
                    evidence["prerequisites"] as? [String],
                    "Blocked lane requires prerequisites array"
                )
                XCTAssertFalse(prerequisites.isEmpty, "Blocked lane prerequisites cannot be empty")
                XCTAssertTrue(
                    prerequisites.allSatisfy { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty },
                    "Blocked lane prerequisites must contain non-empty strings"
                )
            }
        }

        let laneIndex = Dictionary(uniqueKeysWithValues: lanes.compactMap { lane -> (String, [String: Any])? in
            guard let platform = lane["platform"] as? String,
                  let target = lane["target"] as? String
            else {
                return nil
            }
            return ("\(platform):\(target)", lane)
        })

        let iosSimulator = try XCTUnwrap(laneIndex["ios:simulator"])
        XCTAssertEqual(iosSimulator["framework"] as? String, "xctest")

        let iosReal = try XCTUnwrap(laneIndex["ios:real-ios-device"])
        XCTAssertEqual(iosReal["framework"] as? String, "wda")

        let androidEmulator = try XCTUnwrap(laneIndex["android:emulator"])
        XCTAssertEqual(androidEmulator["framework"] as? String, "espresso")

        let androidReal = try XCTUnwrap(laneIndex["android:real-android-device"])
        XCTAssertEqual(androidReal["framework"] as? String, "espresso")

        let blockedLaneEvidences = [iosReal, androidEmulator, androidReal]
            .filter { ($0["status"] as? String) == "BLOCKED" }
            .compactMap { $0["evidence"] as? [String: Any] }
        XCTAssertFalse(blockedLaneEvidences.isEmpty, "Expected blocked lanes to provide remediation evidence")
        for evidence in blockedLaneEvidences {
            XCTAssertNotNil(evidence["summary"] as? String, "Blocked lane evidence should include summary")
            XCTAssertNotNil(evidence["diagnostics"] as? String, "Blocked lane evidence should include diagnostics path")
            XCTAssertNotNil(
                evidence["prerequisites"] as? [String],
                "Blocked lane evidence should include prerequisites"
            )
        }
    }
}
