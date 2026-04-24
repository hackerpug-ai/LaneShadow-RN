import NativeTheme
import XCTest
@testable import LaneShadow
@testable import LaneShadowTheme

@MainActor
final class LSRouteAttachmentCardTests: XCTestCase {
    func test_best_variant_stripe_and_bestbadge_and_weatherbadge() {
        let route = bestRouteMock()
        let card = LSRouteAttachmentCard(route: route, selected: false, compact: false)
        let style = LSRouteAttachmentCard.resolvedStyle(variant: route.variant, selected: false)

        XCTAssertEqual(card.route.variant, .best)
        XCTAssertTrue(card.showsBestBadge)
        XCTAssertTrue(card.showsWeatherBadge)
        XCTAssertEqual(style.backgroundToken, "color.surface.card")
        XCTAssertEqual(style.borderToken, "color.border.default")
        XCTAssertEqual(style.stripeToken, "color.route.best")
        XCTAssertEqual(style.scenicFilledToken, "color.signal.default")
        XCTAssertEqual(style.scenicEmptyToken, "color.border.strong")
    }

    func test_selected_state_applies_signal_border() {
        let selectedStyle = LSRouteAttachmentCard.resolvedStyle(
            variant: .best,
            selected: true
        )
        let defaultStyle = LSRouteAttachmentCard.resolvedStyle(
            variant: .best,
            selected: false
        )

        XCTAssertEqual(selectedStyle.borderToken, "color.signal.default")
        XCTAssertEqual(defaultStyle.borderToken, "color.border.default")
    }

    func test_compact_mode_hides_badge_and_weather() {
        let card = LSRouteAttachmentCard(route: bestRouteMock(), selected: false, compact: true)

        XCTAssertFalse(card.showsBestBadge)
        XCTAssertFalse(card.showsWeatherBadge)
        XCTAssertEqual(
            card.effectiveContentPadding(),
            LSRouteAttachmentCardContentPadding(vertical: 10, horizontal: 12)
        )
    }

    func test_non_compact_mode_uses_card_inset_plus_content_padding() {
        let card = LSRouteAttachmentCard(route: bestRouteMock(), selected: false, compact: false)
        let inset = LSRouteAttachmentCard.containerInset(compact: false, in: Theme.shared)

        XCTAssertEqual(
            card.effectiveContentPadding(),
            LSRouteAttachmentCardContentPadding(vertical: inset.vertical, horizontal: inset.horizontal + 4)
        )
    }

    func test_scenic_meter_uses_five_filled_and_hollow_circle_icons() {
        XCTAssertEqual(
            LSRouteAttachmentCard.scenicMeterIcons(for: 4),
            [.circleFill, .circleFill, .circleFill, .circleFill, .circle]
        )
        XCTAssertEqual(
            LSRouteAttachmentCard.scenicMeterIcons(for: 0),
            [.circle, .circle, .circle, .circle, .circle]
        )
        XCTAssertEqual(
            LSRouteAttachmentCard.scenicMeterIcons(for: 8),
            [.circleFill, .circleFill, .circleFill, .circleFill, .circleFill]
        )
        XCTAssertEqual(
            LSRouteAttachmentCard.scenicMeterIcons(for: -1),
            [.circle, .circle, .circle, .circle, .circle]
        )
    }

    func test_circle_icon_catalog_supports_filled_and_hollow_dots() {
        let hollowSpecs = IconCatalog.pathSpecs(for: .circle)
        let filledSpecs = IconCatalog.pathSpecs(for: .circleFill)

        XCTAssertEqual(IconName.allCases.count, 33)
        XCTAssertEqual(hollowSpecs.count, 1)
        XCTAssertEqual(filledSpecs.count, 1)
        XCTAssertEqual(hollowSpecs.first?.pathData, "M4 12 A8 8 0 1 0 20 12 A8 8 0 1 0 4 12")
        XCTAssertEqual(filledSpecs.first?.pathData, "M4 12 A8 8 0 1 0 20 12 A8 8 0 1 0 4 12")
        XCTAssertEqual(hollowSpecs.first?.fill, false)
        XCTAssertEqual(hollowSpecs.first?.stroke, true)
        XCTAssertEqual(filledSpecs.first?.fill, true)
        XCTAssertEqual(filledSpecs.first?.stroke, true)
    }

    func test_alt1_alt2_stripe_colors_resolve_route_tokens() {
        let alt1Style = LSRouteAttachmentCard.resolvedStyle(variant: .alt1, selected: false)
        let alt2Style = LSRouteAttachmentCard.resolvedStyle(variant: .alt2, selected: false)
        let alt1Card = LSRouteAttachmentCard(route: alt1RouteMock(), selected: false, compact: false)
        let alt2Card = LSRouteAttachmentCard(route: alt2RouteMock(), selected: false, compact: false)

        XCTAssertEqual(alt1Style.stripeToken, "color.route.alt1")
        XCTAssertEqual(alt2Style.stripeToken, "color.route.alt2")
        XCTAssertFalse(alt1Card.showsBestBadge)
        XCTAssertFalse(alt2Card.showsBestBadge)
    }

    func test_metrics_row_matches_uc_mol_08_composition() {
        let card = LSRouteAttachmentCard(route: bestRouteMock(), selected: false, compact: false)

        XCTAssertEqual(card.metricValues, ["62 mi", "1h 45m"])
        XCTAssertEqual(card.scenicLabel, "SCENIC")
        XCTAssertFalse(card.metricValues.contains("3,200 ft"))
    }

    func test_ontap_fires_once() {
        var fireCount = 0
        let card = LSRouteAttachmentCard(route: bestRouteMock()) {
            fireCount += 1
        }

        card.handleTap()

        XCTAssertEqual(fireCount, 1)
    }

    private func bestRouteMock() -> LSRouteAttachmentCardRoute {
        LSRouteAttachmentCardRoute(
            variant: .best,
            title: "Santa Cruz Redwoods Loop",
            subtitle: "Via Bonny Doon and Skyline",
            distance: "62 mi",
            duration: "1h 45m",
            elevation: "3,200 ft",
            scenicRating: 4,
            weather: .init(condition: .sun, label: "Clear"),
            favoriteLabel: "Includes West Cliff favorite"
        )
    }

    private func alt1RouteMock() -> LSRouteAttachmentCardRoute {
        LSRouteAttachmentCardRoute(
            variant: .alt1,
            title: "Empire Grade Alternative",
            subtitle: "Via Felton and Zayante",
            distance: "58 mi",
            duration: "1h 38m",
            elevation: "2,900 ft",
            scenicRating: 3,
            weather: .init(condition: .wind, label: "18mph NW")
        )
    }

    private func alt2RouteMock() -> LSRouteAttachmentCardRoute {
        LSRouteAttachmentCardRoute(
            variant: .alt2,
            title: "Coastal Return",
            subtitle: "Via Davenport and Highway 1",
            distance: "66 mi",
            duration: "1h 52m",
            elevation: "2,100 ft",
            scenicRating: 2,
            weather: .init(condition: .rain, label: "Rain 3pm")
        )
    }
}
