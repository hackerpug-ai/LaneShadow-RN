import CoreGraphics
import SwiftUI

@MainActor
@Observable
public final class LSMapCameraController {
    public var zoomLevel: Double = 12
    public var pendingRecenter: Bool = false

    public init(zoomLevel: Double = 12) {
        self.zoomLevel = zoomLevel
    }
}
