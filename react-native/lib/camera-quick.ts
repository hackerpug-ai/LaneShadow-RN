/**
 * Camera Quick Launch
 *
 * Opens camera immediately for photo capture
 */

import * as ImagePicker from 'expo-image-picker'

export const openCamera = async (): Promise<string | undefined> => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync()

  if (status !== 'granted') {
    return undefined
  }

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.9,
    allowsEditing: false,
  })

  return result?.assets?.[0]?.uri
}
