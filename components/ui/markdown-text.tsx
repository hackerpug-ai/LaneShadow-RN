/**
 * MarkdownText - Renders markdown content using react-native-markdown-display
 *
 * Integrates with the semantic theme system for consistent styling.
 * Supports CommonMark syntax including headings, bold, italic, lists, links, code blocks, etc.
 *
 * Usage:
 * ```tsx
 * <MarkdownText>{markdownContent}</MarkdownText>
 * ```
 *
 * For custom styling, pass a `style` prop with overrides:
 * ```tsx
 * <MarkdownText style={{ heading1: { fontSize: 28 } }}>
 *   {markdownContent}
 * </MarkdownText>
 * ```
 */

import React from 'react'
import { StyleSheet, Platform } from 'react-native'
import Markdown from 'react-native-markdown-display'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

export interface MarkdownTextProps {
  /** Markdown content to render */
  children: string
  /** Optional style overrides for specific markdown elements */
  style?: React.ComponentProps<typeof Markdown>['style']
  /** Optional test ID for testing */
  testID?: string
}

/**
 * MarkdownText component
 *
 * Renders markdown using react-native-markdown-display with semantic theme integration.
 * Note: Styles are consumed by the Markdown component internally - ESLint false positives disabled.
 */
export const MarkdownText = ({ children, style, testID }: MarkdownTextProps) => {
  const { semantic } = useSemanticTheme()

  // Default styles that integrate with semantic theme
   
  const defaultStyles = StyleSheet.create({
    body: {
      color: semantic.color.onSurface.default,
      ...semantic.type.body.lg,
    },
    heading1: {
      color: semantic.color.onSurface.default,
      ...semantic.type.heading.lg,
      marginTop: semantic.space.md,
      marginBottom: semantic.space.sm,
    },
    heading2: {
      color: semantic.color.onSurface.default,
      ...semantic.type.heading.md,
      marginTop: semantic.space.md,
      marginBottom: semantic.space.sm,
    },
    heading3: {
      color: semantic.color.onSurface.default,
      ...semantic.type.heading.sm,
      marginTop: semantic.space.sm,
      marginBottom: semantic.space.xs,
    },
    heading4: {
      color: semantic.color.onSurface.default,
      ...semantic.type.title.lg,
      marginTop: semantic.space.sm,
      marginBottom: semantic.space.xs,
    },
    heading5: {
      color: semantic.color.onSurface.default,
      ...semantic.type.title.md,
      marginTop: semantic.space.sm,
      marginBottom: semantic.space.xs,
    },
    heading6: {
      color: semantic.color.onSurface.default,
      ...semantic.type.title.sm,
      marginTop: semantic.space.sm,
      marginBottom: semantic.space.xs,
    },
    strong: {
      ...semantic.type.body.lg,
      fontWeight: '700' as const,
      color: semantic.color.onSurface.default,
    },
    em: {
      fontStyle: 'italic' as const,
      color: semantic.color.onSurface.default,
    },
    paragraph: {
      marginBottom: semantic.space.sm,
    },
    list_item: {
      flexDirection: 'row',
      marginBottom: semantic.space.xs,
    },
    bullet_list: {
      marginLeft: semantic.space.md,
      marginBottom: semantic.space.sm,
    },
    ordered_list: {
      marginLeft: semantic.space.md,
      marginBottom: semantic.space.sm,
    },
    code_inline: {
      backgroundColor: semantic.color.surfaceVariant.default,
      color: semantic.color.primary.default,
      ...semantic.type.body.sm,
      paddingHorizontal: semantic.space.xs,
      paddingVertical: 2,
      borderRadius: semantic.radius.sm,
    },
    code_block: {
      backgroundColor: semantic.color.surfaceVariant.default,
      color: semantic.color.onSurface.default,
      ...semantic.type.body.sm,
      padding: semantic.space.md,
      borderRadius: semantic.radius.md,
      marginBottom: semantic.space.sm,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    fence: {
      backgroundColor: semantic.color.surfaceVariant.default,
      color: semantic.color.onSurface.default,
      ...semantic.type.body.sm,
      padding: semantic.space.md,
      borderRadius: semantic.radius.md,
      marginBottom: semantic.space.sm,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    blockquote: {
      backgroundColor: semantic.color.surfaceVariant.default + '33',
      borderLeftWidth: 4,
      borderLeftColor: semantic.color.primary.default,
      paddingLeft: semantic.space.md,
      paddingVertical: semantic.space.xs,
      marginBottom: semantic.space.sm,
    },
    link: {
      color: semantic.color.primary.default,
      textDecorationLine: 'underline' as const,
    },
    blocklink: {
      color: semantic.color.primary.default,
      textDecorationLine: 'underline' as const,
      marginBottom: semantic.space.sm,
    },
    table: {
      borderWidth: 1,
      borderColor: semantic.color.border.default,
      borderRadius: semantic.radius.md,
      marginBottom: semantic.space.sm,
    },
    thead: {
      backgroundColor: semantic.color.surfaceVariant.default,
    },
    th: {
      ...semantic.type.body.sm,
      fontWeight: '700' as const,
      color: semantic.color.onSurface.default,
      padding: semantic.space.sm,
      borderWidth: 1,
      borderColor: semantic.color.border.default,
    },
    td: {
      ...semantic.type.body.sm,
      color: semantic.color.onSurface.default,
      padding: semantic.space.sm,
      borderWidth: 1,
      borderColor: semantic.color.border.default,
    },
    hr: {
      backgroundColor: semantic.color.border.default,
      height: 1,
      marginTop: semantic.space.md,
      marginBottom: semantic.space.md,
    },
  })

  // Merge default styles with any custom styles provided
  const mergedStyles = {
    ...defaultStyles,
    ...style,
  }

  return (
    <Markdown
      style={mergedStyles}
      // Handle link presses
      onLinkPress={(url) => {
        // Use Linking API from react-native
        // For now, return true to let the default handler work
        return true
      }}
    >
      {children}
    </Markdown>
  )
}
