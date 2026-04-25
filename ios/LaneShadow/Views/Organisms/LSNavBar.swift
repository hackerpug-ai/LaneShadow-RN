import LaneShadowTheme
import NativeTheme
import SwiftUI

public struct LSNavBar: View {
    @Environment(\.theme) private var theme

    private let title: String
    private let leading: LSToolbarLeading
    private let trailing: LSToolbarTrailing

    public init(
        title: String,
        leading: LSToolbarLeading = .none,
        trailing: LSToolbarTrailing = .none
    ) {
        self.title = title
        self.leading = leading
        self.trailing = trailing
    }

    public var body: some View {
        LSToolbar(
            leading: leading,
            title: title,
            trailing: trailing
        )
        .accessibilityIdentifier("lsnavbar")
    }
}
