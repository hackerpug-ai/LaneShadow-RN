import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSContextCapsuleStories {
    static let all: [Story] = [
        makeStory(id: "molecules.context-capsule.idle-light", name: "Idle / Light", scheme: .light, state: .idle(
            headline: storyHeadline(
                fullText: "Where are we riding today, Justin?",
                emphasized: "today"
            ),
            metaItems: ["Friday", "68°F", "Clear"]
        )),
        makeStory(id: "molecules.context-capsule.idle-dark", name: "Idle / Dark", scheme: .dark, state: .idle(
            headline: storyHeadline(
                fullText: "Where are we riding today, Justin?",
                emphasized: "today"
            ),
            metaItems: ["Friday", "68°F", "Clear"]
        )),
        makeStory(
            id: "molecules.context-capsule.planning-light",
            name: "Planning / Light",
            scheme: .light,
            state: .planning(headline: "Sketching a coastal loop…")
        ),
        makeStory(
            id: "molecules.context-capsule.planning-dark",
            name: "Planning / Dark",
            scheme: .dark,
            state: .planning(headline: "Sketching a coastal loop…")
        ),
        makeStory(id: "molecules.context-capsule.route-light", name: "Route / Light", scheme: .light, state: .route(
            name: storyHeadline(
                fullText: "Coastal cruise",
                emphasized: "Coastal cruise"
            ),
            metrics: ["47 mi", "2h 15m", "arr 4:32p"]
        )),
        makeStory(id: "molecules.context-capsule.route-dark", name: "Route / Dark", scheme: .dark, state: .route(
            name: storyHeadline(
                fullText: "Coastal cruise",
                emphasized: "Coastal cruise"
            ),
            metrics: ["47 mi", "2h 15m", "arr 4:32p"]
        )),
        makeStory(
            id: "molecules.context-capsule.warning-light",
            name: "Warning / Light",
            scheme: .light,
            state: .idle(
                headline: storyHeadline(
                    fullText: "Not the prettiest day for it.",
                    emphasized: "prettiest"
                ),
                metaItems: ["Friday", "52°F", "Rain · 0.4″"]
            ),
            isWarning: true
        ),
        makeStory(
            id: "molecules.context-capsule.warning-dark",
            name: "Warning / Dark",
            scheme: .dark,
            state: .idle(
                headline: storyHeadline(
                    fullText: "Not the prettiest day for it.",
                    emphasized: "prettiest"
                ),
                metaItems: ["Friday", "52°F", "Rain · 0.4″"]
            ),
            isWarning: true
        ),
        makeStory(id: "molecules.context-capsule.saved-light", name: "Saved / Light", scheme: .light, state: .route(
            name: storyHeadline(
                fullText: "Mountain Pass Sunrise",
                emphasized: "Mountain Pass Sunrise"
            ),
            metrics: ["62 mi", "3h 02m", "arr 9:18a"]
        ), isSaved: true),
        makeStory(id: "molecules.context-capsule.saved-dark", name: "Saved / Dark", scheme: .dark, state: .route(
            name: storyHeadline(
                fullText: "Mountain Pass Sunrise",
                emphasized: "Mountain Pass Sunrise"
            ),
            metrics: ["62 mi", "3h 02m", "arr 9:18a"]
        ), isSaved: true)
    ]

    private static func makeStory(
        id: String,
        name: String,
        scheme: ColorScheme,
        state: LSContextCapsule.CapsuleState,
        isWarning: Bool = false,
        isSaved: Bool = false
    ) -> Story {
        Story(
            id: id,
            tier: .molecule,
            component: "LSContextCapsule",
            name: name,
            summary: "Context capsule state variant."
        ) { _ in
            MoleculeStoryFrame {
                LSContextCapsule(
                    state: state,
                    isWarning: isWarning,
                    isSaved: isSaved
                )
            }
            .preferredColorScheme(scheme)
        }
    }

    private static func storyHeadline(
        fullText: String,
        emphasized: String
    ) -> AttributedString {
        var headline = AttributedString(fullText)

        if let range = headline.range(of: emphasized) {
            headline[range].inlinePresentationIntent = .emphasized
        }

        return headline
    }
}
