import Combine
import ConvexMobile
import Foundation
import Observation

@MainActor
@Observable
final class ConvexStore {
    var helloValue: String

    private let convexClient: ConvexClient?
    private var subscriptionTask: Task<Void, Never>?

    init(deploymentURL: String = ConvexConfig.deploymentURL) {
        helloValue = ConvexCopy.connecting

        guard let deploymentURL = URL(string: deploymentURL), !deploymentURL.absoluteString.isEmpty else {
            convexClient = nil
            helloValue = ConvexCopy.missingDeploymentURL
            return
        }

        convexClient = ConvexClient(deploymentUrl: deploymentURL.absoluteString)
    }

    func start() {
        guard subscriptionTask == nil else { return }
        guard let convexClient else { return }

        subscriptionTask = Task { [weak self] in
            let values = convexClient
                .subscribe(to: ConvexEndpoint.helloGet, yielding: String.self)
                .replaceError(with: ConvexCopy.unavailable)
                .values

            for await value in values {
                guard !Task.isCancelled else { return }
                self?.helloValue = value
            }
        }
    }

}

extension ConvexStore {
    @MainActor
    static var preview: ConvexStore {
        let store = ConvexStore(deploymentURL: "")
        store.helloValue = ConvexCopy.preview
        return store
    }
}

enum ConvexEndpoint {
    static let helloGet = "hello:get"
}

enum ConvexCopy {
    static let connecting = "Connecting to Convex…"
    static let missingDeploymentURL = "Convex deployment URL is missing."
    static let unavailable = "Unable to load hello:get from Convex."
    static let preview = "Preview mode"
}
