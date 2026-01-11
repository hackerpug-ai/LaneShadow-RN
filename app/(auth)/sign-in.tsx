import { useRouter } from 'expo-router'
import React, { useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'
import { Button, HelperText, Text, TextInput } from 'react-native-paper'
import { AuthCard, AuthDivider } from '../../components/auth/auth-card'
import { AuthScreenLayout } from '../../components/auth/auth-screen-layout'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { useSession } from '../../providers/session-provider'

type AuthStep = 'start' | 'email' | 'password' | 'signUp'

export const SignInScreen = () => {
  const router = useRouter()
  const { semantic } = useSemanticTheme()
  const { beginEmail, signInWithOAuth, signInWithPassword, signUpWithEmail } = useSession()

  const [step, setStep] = useState<AuthStep>('start')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetErrors = () => setError(null)

  const showError = useCallback((message: string) => {
    setError(message)
  }, [])

  const handleSocial = useCallback(
    async (provider: 'google' | 'apple') => {
      resetErrors()
      setLoading(true)
      try {
        await signInWithOAuth(provider)
        router.replace('/(app)')
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to complete social sign-in right now.'
        showError(message)
      } finally {
        setLoading(false)
      }
    },
    [resetErrors, router, showError, signInWithOAuth]
  )

  const handleStartEmail = useCallback(() => {
    resetErrors()
    setStep('email')
  }, [])

  const handleSubmitEmail = useCallback(async () => {
    resetErrors()
    if (!email) {
      showError('Please enter your email.')
      return
    }

    setLoading(true)
    try {
      const next = await beginEmail(email)
      setStep(next === 'password' ? 'password' : 'signUp')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to continue with that email.'
      showError(message)
    } finally {
      setLoading(false)
    }
  }, [beginEmail, email, showError])

  const handlePasswordSignIn = useCallback(async () => {
    resetErrors()
    if (!password) {
      showError('Please enter your password.')
      return
    }

    setLoading(true)
    try {
      await signInWithPassword(password)
      router.replace('/(app)')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to sign in with that password right now.'
      showError(message)
    } finally {
      setLoading(false)
    }
  }, [password, router, showError, signInWithPassword])

  const handleSignUp = useCallback(async () => {
    resetErrors()
    if (!email || !password || !confirmPassword) {
      showError('Please fill all fields.')
      return
    }
    if (password !== confirmPassword) {
      showError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await signUpWithEmail({ email, password, name })
      router.replace('/(app)')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to create your account now.'
      showError(message)
    } finally {
      setLoading(false)
    }
  }, [confirmPassword, email, name, password, router, showError, signUpWithEmail])

  const hasError = useMemo(() => Boolean(error), [error])

  return (
    <AuthScreenLayout title="Lane Shadow" subtitle="Sign in to save and replay rides">
      <AuthCard>
        {step === 'start' ? (
          <View style={{ gap: semantic.space.sm }}>
            <Button
              mode="contained"
              onPress={() => handleSocial('apple')}
              loading={loading}
              disabled={loading}
            >
              Continue with Apple
            </Button>
            <Button
              mode="outlined"
              onPress={() => handleSocial('google')}
              loading={loading}
              disabled={loading}
            >
              Continue with Google
            </Button>
            <AuthDivider label="or email" />
            <Button mode="contained-tonal" onPress={handleStartEmail} disabled={loading}>
              Login with Email
            </Button>
          </View>
        ) : null}

        {step === 'email' ? (
          <View style={{ gap: semantic.space.md }}>
            <Text variant="titleMedium" style={{ color: semantic.color.onSurface.default }}>
              Enter your email
            </Text>
            <TextInput
              label="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
            />
            <Button
              mode="contained"
              onPress={handleSubmitEmail}
              loading={loading}
              disabled={loading}
            >
              Continue
            </Button>
          </View>
        ) : null}

        {step === 'password' ? (
          <View style={{ gap: semantic.space.md }}>
            <Text variant="titleMedium" style={{ color: semantic.color.onSurface.default }}>
              Enter your password
            </Text>
            <TextInput
              label="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              mode="outlined"
            />
            <Button
              mode="contained"
              onPress={handlePasswordSignIn}
              loading={loading}
              disabled={loading}
            >
              Sign in
            </Button>
          </View>
        ) : null}

        {step === 'signUp' ? (
          <View style={{ gap: semantic.space.md }}>
            <Text variant="titleMedium" style={{ color: semantic.color.onSurface.default }}>
              Create your account
            </Text>
            <TextInput
              label="Name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              autoCapitalize="words"
            />
            <TextInput
              label="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
            />
            <TextInput
              label="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              mode="outlined"
            />
            <TextInput
              label="Confirm password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
            />
            <Button mode="contained" onPress={handleSignUp} loading={loading} disabled={loading}>
              Create account
            </Button>
          </View>
        ) : null}

        {hasError ? (
          <HelperText type="error" visible>
            {error}
          </HelperText>
        ) : null}

        {step !== 'start' ? (
          <Button onPress={() => setStep('start')} disabled={loading}>
            Back
          </Button>
        ) : null}
      </AuthCard>
    </AuthScreenLayout>
  )
}

export default SignInScreen
