import XCTest

final class RealMapOnlyTests: XCTestCase {
    func testNativeAndDesignSurfacesDoNotUseStaticMapSubstitutes() throws {
        let repoRoot = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
        let scannedRoots = [
            repoRoot.appendingPathComponent("ios/LaneShadow"),
            repoRoot.appendingPathComponent("android"),
            repoRoot.appendingPathComponent("ios/project.yml"),
            repoRoot.appendingPathComponent(".spec/design/system"),
        ]
        let forbiddenTerms = [
            "LSPaper" + "Map",
            "paper" + "-map",
            "map" + "-mock",
            "paper " + "map",
            "paper " + "substrate",
            "map " + "mock",
            "static " + "map",
            "faux " + "map",
            "LSMap " + "static",
            "static SVG map " + "previews",
            "Static SVG design " + "mock",
            "mapbox" + "-paper" + "-tile",
            "_mapbox" + "-paper" + "-tile",
            "__map" + "-svg",
            "map" + "-contours",
            "inline SVG " + "preview",
            "SVG " + "placeholder",
            "static " + "snapshot",
            "visual " + "placeholder",
            "preview " + "helper only",
            "preview " + "decoration",
            "[" + "STUB]",
        ]

        let violations = try scannedFiles(in: scannedRoots).flatMap { fileURL in
            let contents = try String(contentsOf: fileURL, encoding: .utf8)
            return forbiddenTerms
                .filter { contents.localizedCaseInsensitiveContains($0) }
                .map { "\(fileURL.path): \($0)" }
        }

        XCTAssertTrue(
            violations.isEmpty,
            "Real map surfaces must not use static substitutes:\n\(violations.joined(separator: "\n"))"
        )
    }

    private func scannedFiles(in roots: [URL]) throws -> [URL] {
        try roots.flatMap { root -> [URL] in
            var isDirectory: ObjCBool = false
            guard FileManager.default.fileExists(atPath: root.path, isDirectory: &isDirectory) else {
                return []
            }

            if !isDirectory.boolValue {
                return [root]
            }

            guard let enumerator = FileManager.default.enumerator(
                at: root,
                includingPropertiesForKeys: [.isRegularFileKey],
                options: [.skipsHiddenFiles]
            ) else {
                return []
            }

            return try enumerator.compactMap { item in
                guard let fileURL = item as? URL else {
                    return nil
                }

                let values = try fileURL.resourceValues(forKeys: [.isRegularFileKey])
                guard values.isRegularFile == true, Self.isScannedExtension(fileURL.pathExtension) else {
                    return nil
                }

                return fileURL
            }
        }
    }

    private static func isScannedExtension(_ pathExtension: String) -> Bool {
        ["swift", "yml", "yaml", "md", "html", "css"].contains(pathExtension)
    }
}
