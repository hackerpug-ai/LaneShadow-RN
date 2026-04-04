/**
 * Teacher Tab View Layout
 *
 * Composed layout for teacher views with tab bar (Feed, Reports)
 * Includes MenuLayout with drawer and safe area handling
 * 
 * Sprint 06: Integrated with voice assistant (push-to-talk pattern)
 * Following theme_rules.mdc
 */

import { Banner } from '../ui/banner'
import { useTeacherDrawerConfig } from '../../hooks/use-teacher-drawer-config'
import { useVoiceAssistant } from '../../hooks/use-voice-assistant'
import * as Haptics from 'expo-haptics'
import { StyleSheet, View } from 'react-native'
import { VoiceAssistantOverlay } from '../assistant/voice-assistant-overlay'
import { BaseViewLayout } from './base-view-layout'
import { Header } from './header'
import { MenuLayout } from './menu-layout'
import { TeacherTabBar } from './teacher-tab-bar'

export type TeacherTabViewLayoutProps = {
  title: string
  currentRoute: string
  children: React.ReactNode
  testID?: string
}

export const TeacherTabViewLayout = ({
  title,
  currentRoute,
  children,
  testID,
}: TeacherTabViewLayoutProps) => {
  const { sections, footerItems } = useTeacherDrawerConfig()
  
  // Sprint 06: Voice assistant with push-to-talk
  // TODO: Get actual classroom context from route/user state
  const voiceAssistant = useVoiceAssistant({
    scopeType: 'classroom',
    scopeId: 'classroom_placeholder', // TEMP: Will be replaced with actual classroom ID
    classHint: 'Sunflowers',
  })

  // Push-to-talk: Start recording on press, stop on release
  const handleMicPressIn = async () => {
    // Haptic feedback on press
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    await voiceAssistant.startRecording()
  }

  const handleMicPressOut = async () => {
    // Stop recording and send
    await voiceAssistant.stopRecording()
    
    // Success haptic on release
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  return (
    <MenuLayout
      sections={sections as any}
      footerItems={footerItems as any}
      headerTitle="Classes"
      testID={testID}
    >
      {(onMenuPress) => (
        <BaseViewLayout>
          <Header
            title={title}
            onMenuPress={onMenuPress}
            testID={testID ? `${testID}-header` : undefined}
          />
          <Banner
            visible={false}
            message="You are currently offline."
            icon="wifi-off"
            testID="offline-banner"
          />
          <View style={styles.content}>{children}</View>
          <TeacherTabBar
            currentRoute={currentRoute}
            testID={testID ? `${testID}-tab-bar` : undefined}
            action={{
              icon: 'microphone',
              label: 'Assistant',
              onPressIn: handleMicPressIn,
              onPressOut: handleMicPressOut,
              isActive: voiceAssistant.state.status === 'recording',
            }}
          />
          <VoiceAssistantOverlay
            isOpen={voiceAssistant.isOverlayOpen}
            state={voiceAssistant.state}
            isCameraOpen={voiceAssistant.isCameraOpen}
            onOpenCamera={voiceAssistant.openCamera}
            onCloseCamera={voiceAssistant.closeCamera}
            onCapturePhoto={voiceAssistant.attachPhoto}
            onSubmit={voiceAssistant.submitDraft}
            onSaveDraft={voiceAssistant.saveDraft}
            onDiscard={voiceAssistant.discardDraft}
            onDismiss={voiceAssistant.dismissOverlay}
          />
        </BaseViewLayout>
      )}
    </MenuLayout>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
})
