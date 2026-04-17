import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { Button } from '../ui/button'
import { BottomSheetWrapper } from './bottom-sheet-wrapper'

export type PlanningErrorSheetProps = {
  isVisible: boolean
  message: string
  onTryAgain: () => void
  onBack: () => void
  onClose: () => void
}

export const PlanningErrorSheet = ({
  isVisible,
  message,
  onTryAgain,
  onBack,
  onClose,
}: PlanningErrorSheetProps) => {
  const { semantic } = useSemanticTheme()

  return (
    <BottomSheetWrapper
      isVisible={isVisible}
      onClose={onClose}
      preset="content"
      testID="planning-error-sheet"
    >
      <View style={[styles.container, { gap: semantic.space.md }]}>
        <View style={[styles.header, { gap: semantic.space.xs }]}>
          <Text variant="titleMedium" style={{ color: semantic.color.onSurface.default }}>
            Couldn&apos;t plan route
          </Text>
          <Text variant="bodyMedium" style={{ color: semantic.color.onSurface.muted }}>
            {message}
          </Text>
        </View>

        <View style={[styles.actions, { gap: semantic.space.sm }]}>
          <Button
            variant="default"
            size="lg"
            onPress={onTryAgain}
            testID="planning-error-try-again"
          >
            Try again
          </Button>
          <Button variant="outline" size="lg" onPress={onBack} testID="planning-error-back">
            Back
          </Button>
        </View>
      </View>
    </BottomSheetWrapper>
  )
}

PlanningErrorSheet.displayName = 'PlanningErrorSheet'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'flex-start',
  },
  actions: {
    flexDirection: 'column',
  },
})
