package com.laneshadow.ui.atoms

import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

@Composable
fun ThemeCollapsible(
    open: Boolean,
    onOpenChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    accessibilityLabel: String? = null,
    header: @Composable () -> Unit,
    content: @Composable () -> Unit,
) {
    val theme = LocalLaneShadowTheme.current

    Column(
        modifier =
            modifier
                .fillMaxWidth()
                .animateContentSize()
                .then(
                    if (accessibilityLabel != null) {
                        Modifier.semantics { contentDescription = accessibilityLabel }
                    } else {
                        Modifier
                    },
                ),
        verticalArrangement = Arrangement.spacedBy(theme.space.sm),
    ) {
        Row(
            modifier =
                Modifier
                    .fillMaxWidth()
                    .clickable { onOpenChange(!open) },
            horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconSymbol(
                name = if (open) "chevron-down" else "chevron-right",
                size = 18.dp,
                color = theme.colors.muted.default,
            )
            header()
        }

        if (open) {
            Column(
                modifier = Modifier.padding(start = theme.space.xl),
                verticalArrangement = Arrangement.spacedBy(theme.space.sm),
            ) {
                content()
            }
        }
    }
}

@Composable
fun Collapsible(
    open: Boolean,
    onOpenChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    accessibilityLabel: String? = null,
    header: @Composable () -> Unit,
    content: @Composable () -> Unit,
) = ThemeCollapsible(
    open = open,
    onOpenChange = onOpenChange,
    modifier = modifier,
    accessibilityLabel = accessibilityLabel,
    header = header,
    content = content,
)
