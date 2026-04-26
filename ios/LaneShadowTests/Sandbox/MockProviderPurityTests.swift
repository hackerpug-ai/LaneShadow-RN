import Foundation
import Testing
@testable import LaneShadow

@Suite("Mock Provider Purity Tests")
struct MockProviderPurityTests {
    // MARK: - I/O Symbol Detection

    @Test("IdleMockProvider: Contains no I/O symbols")
    func idleMockProvider_containsNoIOSymbols() {
        let sourceFile = readSourceFile("IdleMockProvider.swift")
        #expect(!containsIOSymbols(sourceFile), "IdleMockProvider should not contain I/O symbols")
    }

    @Test("PlanningMockProvider: Contains no I/O symbols")
    func planningMockProvider_containsNoIOSymbols() {
        let sourceFile = readSourceFile("PlanningMockProvider.swift")
        #expect(!containsIOSymbols(sourceFile), "PlanningMockProvider should not contain I/O symbols")
    }

    @Test("RouteResultsMockProvider: Contains no I/O symbols")
    func routeResultsMockProvider_containsNoIOSymbols() {
        let sourceFile = readSourceFile("RouteResultsMockProvider.swift")
        #expect(!containsIOSymbols(sourceFile), "RouteResultsMockProvider should not contain I/O symbols")
    }

    @Test("RouteDetailsMockProvider: Contains no I/O symbols")
    func routeDetailsMockProvider_containsNoIOSymbols() {
        let sourceFile = readSourceFile("RouteDetailsMockProvider.swift")
        #expect(!containsIOSymbols(sourceFile), "RouteDetailsMockProvider should not contain I/O symbols")
    }

    @Test("SessionsMockProvider: Contains no I/O symbols")
    func sessionsMockProvider_containsNoIOSymbols() {
        let sourceFile = readSourceFile("SessionsMockProvider.swift")
        #expect(!containsIOSymbols(sourceFile), "SessionsMockProvider should not contain I/O symbols")
    }

    @Test("ErrorMockProvider: Contains no I/O symbols")
    func errorMockProvider_containsNoIOSymbols() {
        let sourceFile = readSourceFile("ErrorMockProvider.swift")
        #expect(!containsIOSymbols(sourceFile), "ErrorMockProvider should not contain I/O symbols")
    }

    @Test("NavigatorDomain: Contains no I/O symbols")
    func navigatorDomain_containsNoIOSymbols() {
        let sourceFile = readSourceFile("NavigatorDomain.swift")
        #expect(!containsIOSymbols(sourceFile), "NavigatorDomain should not contain I/O symbols")
    }

    // MARK: - Network Symbol Detection

    @Test("All providers: Contain no network symbols")
    func allProviders_containNoNetworkSymbols() {
        let providers = [
            "IdleMockProvider.swift",
            "PlanningMockProvider.swift",
            "RouteResultsMockProvider.swift",
            "RouteDetailsMockProvider.swift",
            "SessionsMockProvider.swift",
            "ErrorMockProvider.swift",
        ]

        for provider in providers {
            let sourceFile = readSourceFile(provider)
            #expect(
                !containsNetworkSymbols(sourceFile),
                "\(provider) should not contain network symbols"
            )
        }
    }

    // MARK: - Async/Await Detection

    @Test("All providers: Contain no async/await")
    func allProviders_containNoAsyncAwait() {
        let providers = [
            "IdleMockProvider.swift",
            "PlanningMockProvider.swift",
            "RouteResultsMockProvider.swift",
            "RouteDetailsMockProvider.swift",
            "SessionsMockProvider.swift",
            "ErrorMockProvider.swift",
        ]

        for provider in providers {
            let sourceFile = readSourceFile(provider)
            #expect(
                !containsAsyncAwait(sourceFile),
                "\(provider) should not contain async/await"
            )
        }
    }

    // MARK: - Throwing Functions Detection

    @Test("All providers: Contain no throwing functions")
    func allProviders_containNoThrowingFunctions() {
        let providers = [
            "IdleMockProvider.swift",
            "PlanningMockProvider.swift",
            "RouteResultsMockProvider.swift",
            "RouteDetailsMockProvider.swift",
            "SessionsMockProvider.swift",
            "ErrorMockProvider.swift",
        ]

        for provider in providers {
            let sourceFile = readSourceFile(provider)
            #expect(
                !containsThrowingFunctions(sourceFile),
                "\(provider) should not contain throwing functions"
            )
        }
    }

    // MARK: - File/JSON Parsing Detection

    @Test("All providers: Contain no file/JSON parsing")
    func allProviders_containNoFileOrJSONParsing() {
        let providers = [
            "IdleMockProvider.swift",
            "PlanningMockProvider.swift",
            "RouteResultsMockProvider.swift",
            "RouteDetailsMockProvider.swift",
            "SessionsMockProvider.swift",
            "ErrorMockProvider.swift",
        ]

        for provider in providers {
            let sourceFile = readSourceFile(provider)
            #expect(
                !containsFileOrJSONParsing(sourceFile),
                "\(provider) should not contain file/JSON parsing"
            )
        }
    }

    // MARK: - Helper Functions

    private func readSourceFile(_ fileName: String) -> String {
        let mockProvidersPath = "/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Sandbox/MockProviders"
        let filePath = "\(mockProvidersPath)/\(fileName)"

        guard let content = try? String(contentsOfFile: filePath, encoding: .utf8) else {
            return ""
        }

        return content
    }

    private func containsIOSymbols(_ source: String) -> Bool {
        let ioPatterns = [
            "print(",
            "FileHandle",
            "FileManager",
            "readFromFile",
            "writeToFile",
            "stdout",
            "stderr",
            "stdin",
            "NSLog",
            "os_log",
            "Logger",
        ]

        return ioPatterns.contains { source.contains($0) }
    }

    private func containsNetworkSymbols(_ source: String) -> Bool {
        let networkPatterns = [
            "URLSession",
            "URLRequest",
            "URLResponse",
            "HttpClient",
            "Alamofire",
            "fetch(",
            "axios",
            "http://",
            "https://",
        ]

        return networkPatterns.contains { source.contains($0) }
    }

    private func containsAsyncAwait(_ source: String) -> Bool {
        source.contains("async ") || source.contains("await ")
    }

    private func containsThrowingFunctions(_ source: String) -> Bool {
        source.contains("throws") && source.contains("func")
    }

    private func containsFileOrJSONParsing(_ source: String) -> Bool {
        let patterns = [
            "JSONDecoder",
            "JSONEncoder",
            "Codable",
            "Data(contentsOf:",
            "String(contentsOfFile:",
            "Bundle.main",
            ".json",
        ]

        return patterns.contains { source.contains($0) }
    }
}
