/**
 * Toast Configuration for react-native-toast-message
 *
 * Centralized toast system styled to match our semantic theme.
 * Provides success, error, warning, and info toast variants.
 */

import { MaterialCommunityIcons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'
import Toast from 'react-native-toast-message'
import { useSemanticTheme } from '../hooks/use-semantic-theme'

const SuccessToast = ({ text1, text2 }: any) => {
  const { semantic } = useSemanticTheme()
  return (
    <View style={[styles.container, { backgroundColor: semantic.color.success.default }]}>
      <MaterialCommunityIcons name="check-circle" size={24} color="#FFFFFF" />
      <View style={styles.textContainer}>
        {text1 && <Text style={[styles.title, { color: '#FFFFFF' }]}>{text1}</Text>}
        {text2 && <Text style={[styles.message, { color: '#FFFFFF' }]}>{text2}</Text>}
      </View>
    </View>
  )
}

const ErrorToast = ({ text1, text2 }: any) => {
  const { semantic } = useSemanticTheme()
  return (
    <View style={[styles.container, { backgroundColor: semantic.color.danger.default }]}>
      <MaterialCommunityIcons name="alert-circle" size={24} color="#FFFFFF" />
      <View style={styles.textContainer}>
        {text1 && <Text style={[styles.title, { color: '#FFFFFF' }]}>{text1}</Text>}
        {text2 && <Text style={[styles.message, { color: '#FFFFFF' }]}>{text2}</Text>}
      </View>
    </View>
  )
}

const WarningToast = ({ text1, text2 }: any) => {
  const { semantic } = useSemanticTheme()
  return (
    <View style={[styles.container, { backgroundColor: semantic.color.warning.default }]}>
      <MaterialCommunityIcons name="alert" size={24} color="#FFFFFF" />
      <View style={styles.textContainer}>
        {text1 && <Text style={[styles.title, { color: '#FFFFFF' }]}>{text1}</Text>}
        {text2 && <Text style={[styles.message, { color: '#FFFFFF' }]}>{text2}</Text>}
      </View>
    </View>
  )
}

const InfoToast = ({ text1, text2 }: any) => {
  const { semantic } = useSemanticTheme()
  return (
    <View style={[styles.container, { backgroundColor: semantic.color.info.default }]}>
      <MaterialCommunityIcons name="information" size={24} color="#FFFFFF" />
      <View style={styles.textContainer}>
        {text1 && <Text style={[styles.title, { color: '#FFFFFF' }]}>{text1}</Text>}
        {text2 && <Text style={[styles.message, { color: '#FFFFFF' }]}>{text2}</Text>}
      </View>
    </View>
  )
}

export const toastConfig = {
  success: SuccessToast,
  error: ErrorToast,
  warning: WarningToast,
  info: InfoToast,
}

export const toast = {
  success: (message: string, title?: string) => {
    Toast.show({
      type: 'success',
      text1: title || 'Success',
      text2: message,
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 60,
    })
  },

  error: (message: string, title?: string) => {
    Toast.show({
      type: 'error',
      text1: title || 'Error',
      text2: message,
      visibilityTime: 5000,
      autoHide: true,
      topOffset: 60,
    })
  },

  warning: (message: string, title?: string) => {
    Toast.show({
      type: 'warning',
      text1: title || 'Warning',
      text2: message,
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 60,
    })
  },

  info: (message: string, title?: string) => {
    Toast.show({
      type: 'info',
      text1: title || 'Info',
      text2: message,
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 60,
    })
  },

  hide: () => {
    Toast.hide()
  },
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minHeight: 60,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
})
