package com.laneshadow.ui.atoms

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.FloatingActionButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

@Composable
fun ThemeFAB(
    iconName: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    visible: Boolean = true,
    accessibilityLabel: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    AnimatedVisibility(visible = visible) {
        if (label.isNullOrBlank()) {
            FloatingActionButton(
                onClick = onClick,
                modifier =
                    modifier.then(
                        if (accessibilityLabel != null) {
                            Modifier.semantics { contentDescription = accessibilityLabel }
                        } else {
                            Modifier
                        },
                    ),
                containerColor = theme.colors.primary.default,
                contentColor = theme.colors.onPrimary.default,
            ) {
                IconSymbol(name = iconName, size = 20.dp, color = theme.colors.onPrimary.default)
            }
        } else {
            ExtendedFloatingActionButton(
                onClick = onClick,
                modifier =
                    modifier.then(
                        if (accessibilityLabel != null) {
                            Modifier.semantics { contentDescription = accessibilityLabel }
                        } else {
                            Modifier
                        },
                    ),
                containerColor = theme.colors.primary.default,
                contentColor = theme.colors.onPrimary.default,
                icon = {
                    IconSymbol(name = iconName, size = 20.dp, color = theme.colors.onPrimary.default)
                },
                text = {
                    ThemedText(
                        text = label,
                        variant = ThemedTextVariant.LabelMd,
                        color = theme.colors.onPrimary.default,
                    )
                },
            )
        }
    }
}

@Composable
fun FAB(
    iconName: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    visible: Boolean = true,
    accessibilityLabel: String? = null,
) = ThemeFAB(
    iconName = iconName,
    onClick = onClick,
    modifier = modifier,
    label = label,
    visible = visible,
    accessibilityLabel = accessibilityLabel,
)
