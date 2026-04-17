/**
 * Teacher Simple View Layout
 *
 * Layout for teacher views without tab bar (Profile, Settings)
 * Simple back button header without drawer menu
 * Following theme_rules.mdc - StyleSheet for static, inline for theme
 */

import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { IconSymbol } from '../ui/icon-symbol'
import { BaseViewLayout } from './base-view-layout'

export type TeacherSimpleViewLayoutProps = {
  title: string
  children: React.ReactNode
  testID?: string
}

export const TeacherSimpleViewLayout = ({
  title,
  children,
  testID,
}: TeacherSimpleViewLayoutProps) => {
  const { semantic } = useSemanticTheme()
  const router = useRouter()

  return (
    <BaseViewLayout>
      <View
        style={[
          styles.header,
          {
            backgroundColor: semantic.color.background.default,
            borderBottomColor: semantic.color.border.default,
            paddingHorizontal: semantic.space.lg,
            paddingVertical: semantic.space.sm,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          testID={testID ? `${testID}-back-button` : 'back-button'}
          style={({ pressed }) => [
            styles.backButton,
            {
              backgroundColor: pressed ? semantic.color.surface.pressed : 'transparent',
              borderRadius: semantic.radius.full,
              padding: semantic.space.sm,
            },
          ]}
        >
          <IconSymbol name="arrow-left" size={24} color={semantic.color.onSurface.default} />
        </Pressable>
        <View style={styles.titleContainer}>
          <Text variant="titleLarge" style={{ color: semantic.color.onSurface.default }}>
            {title}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>
      <View style={styles.content}>{children}</View>
    </BaseViewLayout>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    width: 44,
  },
  content: {
    flex: 1,
  },
})
