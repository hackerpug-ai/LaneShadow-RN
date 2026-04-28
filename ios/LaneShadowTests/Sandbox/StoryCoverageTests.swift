import Foundation
import NativeSandbox
import Testing
@testable import LaneShadow

/// Coverage tests for sandbox story registration.
///
/// Verifies that each template has the minimum number of stories
/// to cover all states, variants, and edge cases.
@MainActor
struct StoryCoverageTests {
    // MARK: - AC-1: IdleScreen coverage (7 stories)

    @Test("AC-1: IdleScreen has 7 registered stories")
    func idleScreenStoryCount() {
        let idleStories = LaneShadowStories.all.filter { $0.component == "IdleScreen" }
        #expect(idleStories.count >= 7, "Expected at least 7 IdleScreen stories, found \(idleStories.count)")
    }

    // MARK: - AC-2: RouteResults coverage (6 stories)

    @Test("AC-2: RouteResults has 7 registered stories")
    func routeResultsStoryCount() {
        let routeResultsStories = LaneShadowStories.all.filter { $0.component == "RouteResultsScreen" }
        #expect(
            routeResultsStories.count >= 7,
            "Expected at least 7 RouteResults stories, found \(routeResultsStories.count)"
        )
    }

    // MARK: - AC-3: RouteDetails coverage (6 stories)

    @Test("AC-3: RouteDetails has 6 registered stories")
    func routeDetailsStoryCount() {
        let routeDetailsStories = LaneShadowStories.all.filter { $0.component == "RouteDetailsScreen" }
        #expect(routeDetailsStories.count == 6, "Expected 6 RouteDetails stories, found \(routeDetailsStories.count)")
    }

    // MARK: - AC-4: Sessions coverage (5 stories)

    @Test("AC-4: Sessions has 5 registered stories")
    func sessionsStoryCount() {
        let sessionsStories = LaneShadowStories.all.filter { $0.component == "SessionsScreen" }
        #expect(sessionsStories.count == 5, "Expected 5 Sessions stories, found \(sessionsStories.count)")
    }

    // MARK: - AC-5: Error coverage (6 stories)

    @Test("AC-5: Error has 6 registered stories")
    func errorStoryCount() {
        let errorStories = LaneShadowStories.all.filter { $0.component == "ErrorScreen" }
        #expect(errorStories.count == 6, "Expected 6 Error stories, found \(errorStories.count)")
    }

    // MARK: - AC-6: RouteCard coverage (6 stories)

    @Test("AC-6: RouteCard has 6 registered stories")
    func routeCardStoryCount() {
        let routeCardStories = LaneShadowStories.all.filter { $0.component == "RouteCard" }
        #expect(routeCardStories.count == 6, "Expected 6 RouteCard stories, found \(routeCardStories.count)")
    }

    // MARK: - AC-7: All templates meet minimum thresholds

    @Test("AC-7: All template stories meet minimum coverage thresholds")
    func allTemplatesMeetThresholds() {
        let templates = [
            "IdleScreen": 7,
            "RouteResultsScreen": 7,
            "RouteDetailsScreen": 6,
            "SessionsScreen": 5,
            "ErrorScreen": 6,
            "RouteCard": 6,
        ]

        for (component, expectedCount) in templates {
            let stories = LaneShadowStories.all.filter { $0.component == component }
            #expect(
                stories.count >= expectedCount,
                "\(component): Expected at least \(expectedCount) stories, found \(stories.count)"
            )
        }
    }

    // MARK: - AC-8: Story IDs follow canonical naming convention

    @Test("AC-8: All story IDs follow lowercase-dot-separated-kebab-case convention")
    func storyIdsFollowCanonicalConvention() {
        let pattern = #"^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$"#
        let regex = try? Regex(pattern)

        for story in LaneShadowStories.all {
            if let regex {
                #expect(
                    story.id.wholeMatch(of: regex) != nil,
                    "Story ID '\(story.id)' does not follow canonical naming convention"
                )
            }
        }
    }

    // MARK: - AC-9: Required story IDs exist

    @Test("AC-9: All required story IDs are registered")
    func requiredStoryIdsExist() {
        let requiredIds: Set = [
            // IdleScreen (7) - templates.idle.default is the original, plus 6 variants
            "templates.idle.default",
            "templates.idle-screen.s02-typing-send",
            "templates.idle-screen.s03-dark",
            "templates.idle-screen.s04-filter-sheet",
            "templates.idle-screen.v-no-location",
            "templates.idle-screen.v-first-ride",
            "templates.idle-screen.v-weather-advisory",

            // RouteResults (7) - templates.route-results.default is the original, plus 6 variants
            "templates.route-results.default",
            "templates.route-results.s02-alt-selected",
            "templates.route-results.s03-dark",
            "templates.route-results.s04-refining",
            "templates.route-results.v01-default",
            "templates.route-results.v02-weather-divergent",
            "templates.route-results.v03-recall",

            // RouteDetails (6) - already complete
            "templates.route-details.default",
            "templates.route-details.s02-mixed-weather",
            "templates.route-details.s03-dark",
            "templates.route-details.s04-medium",
            "templates.route-details.s05-dismissing",
            "templates.route-details.v01-saved",

            // Sessions (5) - templates.sessions.default is the original, plus 4 variants
            "templates.sessions.default",
            "templates.sessions-screen.s02-dark",
            "templates.sessions-screen.s03-empty",
            "templates.sessions-screen.s04-grouped",
            "templates.sessions-screen.s05-new-confirm",

            // Error (6) - templates.error.default is the original, plus 5 variants
            "templates.error.default",
            "templates.error-screen.s02-dark",
            "templates.error-screen.s03-extended",
            "templates.error-screen.s04-recovered",
            "templates.error-screen.v01-offline",
            "templates.error-screen.v02-generic",

            // RouteCard (6) - already complete
        ]

        let registeredIds = Set(LaneShadowStories.all.map(\.id))
        let missingIds = requiredIds.subtracting(registeredIds)

        #expect(
            missingIds.isEmpty,
            "Missing required story IDs: \(missingIds.sorted())"
        )
    }
}
