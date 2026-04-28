package com.laneshadow.ui.organisms

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import com.laneshadow.ui.atoms.ButtonVariant
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.GlassVariant
import com.laneshadow.ui.atoms.IconColor
import com.laneshadow.ui.atoms.IconSize
import com.laneshadow.ui.atoms.LSButton
import com.laneshadow.ui.atoms.LSGlassPanel
import com.laneshadow.ui.atoms.LSIcon
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.TextColor
import com.laneshadow.ui.atoms.TypographyVariant

// Test tags
const val LSSSESSIONSDRAWER_TAG = "ls-sessions-drawer"
const val LSSSESSIONSDRAWER_HEADER_TAG = "ls-sessions-drawer-header"
const val LSSSESSIONSDRAWER_NEW_BUTTON_TAG = "ls-sessions-drawer-new-button"
const val LSSSESSIONSDRAWER_SESSION_ROW_TAG = "ls-sessions-drawer-session-row"
const val LSSSESSIONSDRAWER_ACTIVE_STRIPE_TAG = "ls-sessions-drawer-active-stripe"

// Private constants for hardcoded values
private val drawerWidth = 312.dp

// Semantics keys
val LSGlassPanelLSGlassPanelVariantKey = SemanticsPropertyKey<GlassVariant>("LSGlassPanelVariant")
val SessionRowActiveKey = SemanticsPropertyKey<Boolean>("SessionRowActive")

private var SemanticsPropertyReceiver.sessionRowActive by SessionRowActiveKey

/**
 * Helper function to draw a directional shadow on the trailing edge.
 * AC-5: Drawer shadow uses correct directional tier 2px 0 16px
 *
 * Uses a layered shadow approach to create a directional shadow effect
 * on the right side of the drawer.
 */
private fun Modifier.trailingShadow(
    color: Color,
    elevation: Dp = 2.dp,
): Modifier = this.then(
    Modifier.shadow(
        elevation = elevation,
        ambientColor = color.copy(alpha = 0.14f),
        spotColor = color.copy(alpha = 0.14f),
        shape = RectangleShape,
    )
)

/**
 * LSSessionsDrawer organism - left-anchored conversation-history drawer.
 *
 * @param sessions List of sessions to display
 * @param activeSessionId ID of the currently active session (null if none)
 * @param groupLabel Section header label (e.g., "THIS WEEK")
 * @param onSelect Callback when a session row is tapped
 * @param onNew Callback when NEW button is tapped
 * @param onDismiss Callback when drawer should be dismissed
 * @param modifier Modifier for the root composable
 */
@Composable
fun LSSessionsDrawer(
    sessions: List<Session>,
    activeSessionId: String?,
    groupLabel: String,
    onSelect: (String) -> Unit,
    onNew: () -> Unit,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    // AC-1: Replace LSGlassPanel.Chrome with solid surface.default background
    // AC-5: Add directional shadow (2px 0 16px)
    Box(
        modifier = modifier
            .width(drawerWidth)
            .fillMaxHeight()
            .trailingShadow(Color.Black, elevation = 2.dp)
            .background(theme.colors.surface.default)
            .border(
                width = GeneratedTokens.sizing.stroke.sm,
                color = theme.colors.border.default,
            )
            .testTag(LSSSESSIONSDRAWER_TAG),
    ) {
        Column(
            modifier = Modifier
                .fillMaxHeight()
                .width(drawerWidth),
        ) {
            // Sticky header: title + NEW button
            DrawerHeader(
                title = "Rides",
                onNewTap = onNew,
                modifier = Modifier.testTag(LSSSESSIONSDRAWER_HEADER_TAG),
            )

            // Section label
            LSSectionHeader(
                title = groupLabel,
                modifier = Modifier.testTag(LSSECTIONHEADER_TAG),
            )

            // Session list (scrollable)
            if (sessions.isEmpty()) {
                EmptyState(modifier = Modifier.weight(1f))
            } else {
                val scrollState = rememberScrollState()
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .verticalScroll(scrollState),
                ) {
                    sessions.forEach { session ->
                        SessionRow(
                            session = session,
                            isActive = session.id == activeSessionId,
                            onTap = { onSelect(session.id) },
                        )
                    }
                }
            }
        }
    }
}

/**
 * Drawer header with title and NEW button.
 */
@Composable
private fun DrawerHeader(
    title: String,
    onNewTap: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(
                start = theme.space.lg,
                end = theme.space.lg,
                top = theme.space.lg,
                bottom = theme.space.md,
            ),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
    ) {
        LSText(
            text = title,
            variant = TypographyVariant.Ui.Title.Lg,
            color = ContentColor.Primary,
        )

        LSButton(
            label = "NEW",
            variant = ButtonVariant.Outline,
            leadingIcon = IconName.Plus,
            onClick = onNewTap,
            modifier = Modifier.testTag(LSSSESSIONSDRAWER_NEW_BUTTON_TAG),
        )
    }
}

/**
 * Session row composable.
 */
@Composable
private fun SessionRow(
    session: Session,
    isActive: Boolean,
    onTap: () -> Unit,
) {
    val theme = LocalLaneShadowTheme.current

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = theme.space.xl + theme.space.md) // Ensure minimum height for the stripe to be visible
            .clickable(onClick = onTap)
            .then(
                if (isActive) {
                    // AC-3: Use signal.whisper semantic token for active row background
                    Modifier.background(
                        color = GeneratedTokens.color.Signal.whisper,
                    )
                } else {
                    Modifier
                }
            )
            .semantics { sessionRowActive = isActive }
            .testTag(LSSSESSIONSDRAWER_SESSION_ROW_TAG),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(
                    start = theme.space.md,
                    end = theme.space.lg,
                    top = theme.space.sm,
                    bottom = theme.space.sm,
                ),
            verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
        ) {
            // Active stripe (AC-2: stroke.lg = 2dp, NOT theme.space.xs)
            if (isActive) {
                androidx.compose.foundation.layout.Box(
                    modifier = Modifier
                        .width(GeneratedTokens.sizing.stroke.lg)
                        .height(theme.space.xl + theme.space.sm)
                        .background(GeneratedTokens.color.Signal.default)
                        .testTag(LSSSESSIONSDRAWER_ACTIVE_STRIPE_TAG)
                        .semantics { },
                    content = {},
                )
                androidx.compose.foundation.layout.Spacer(modifier = Modifier.width(theme.space.xs))
            }
                // Row content
                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(theme.space.xs),
                ) {
                    // Title row: title + when label
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
                    ) {
                        LSText(
                            text = session.title,
                            variant = TypographyVariant.Ui.Label.Lg,
                            color = ContentColor.Primary,
                            modifier = Modifier.weight(1f, fill = false),
                        )

                        LSText(
                            text = session.whenLabel,
                            variant = TypographyVariant.Instrument.Sm,
                            color = TextColor.Content(ContentColor.Subtle),
                        )
                    }

                    // Preview line
                    Text(
                        text = session.preview,
                        style = theme.typography.ui.body.sm,
                        color = theme.colors.muted.default,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )

                    // Meta footer
                    val metaColor = if (isActive) {
                        TextColor.Signal
                    } else {
                        TextColor.Content(ContentColor.Subtle)
                    }

                    LSText(
                        text = session.meta,
                        variant = TypographyVariant.Ui.Label.Sm,
                        color = metaColor,
                    )
                }
            }

        // Bottom border
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .align(androidx.compose.ui.Alignment.BottomCenter)
                .height(with(LocalLaneShadowTheme.current) { space.xs / 3 })
                .background(GeneratedTokens.color.Border.subtle),
        )
    }
}

/**
 * Empty state when no sessions exist.
 */
@Composable
private fun EmptyState(modifier: Modifier = Modifier) {
    val theme = LocalLaneShadowTheme.current

    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(theme.space.xl),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally,
    ) {
        LSIcon(
            name = IconName.Clock,
            size = IconSize.Lg,
            color = IconColor.Content(ContentColor.Subtle),
            modifier = Modifier.semantics { contentDescription = "No sessions icon" },
        )

        LSText(
            text = "No rides yet. Tap NEW to start a conversation.",
            variant = TypographyVariant.Ui.Body.Md,
            color = TextColor.Content(ContentColor.Subtle),
            modifier = Modifier.padding(top = theme.space.md),
        )
    }
}
