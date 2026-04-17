import { isClerkAPIResponseError, useSignIn, useSignUp } from '@clerk/clerk-expo'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { View } from 'react-native'
import { HelperText, Text } from 'react-native-paper'
import { z } from 'zod'
import { AuthCard, AuthDivider } from '../../components/auth/auth-card'
import { AuthScreenLayout } from '../../components/auth/auth-screen-layout'
import { Button } from '../../components/ui/button'
import { IconSymbol } from '../../components/ui/icon-symbol'
import { Input } from '../../components/ui/input'
import {
  OAUTH_FLOW_PROVIDERS,
  type OAuthFlowProvider,
  useOAuthFlow,
} from '../../hooks/use-oauth-flow'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

type AuthStep = 'start' | 'email' | 'password' | 'signUp'
const formSchema = z.object({
  email: z.string().min(1, 'Please enter your email.').email('Enter a valid email address.'),
  password: z.string().min(1, 'Please enter your password.'),
  confirmPassword: z.string().optional(),
  name: z.string().optional(),
})

type AuthFormValues = z.infer<typeof formSchema>

export const SignInScreen = () => {
  const { semantic } = useSemanticTheme()
  const router = useRouter()
  const { signIn, setActive: setSignInActive, isLoaded: isSignInLoaded } = useSignIn()
  const { signUp, setActive: setSignUpActive, isLoaded: isSignUpLoaded } = useSignUp()
  const [step, setStep] = useState<AuthStep>('start')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    formState: { errors },
    clearErrors,
    resetField,
  } = useForm<AuthFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
    },
  })

  const resetErrors = () => setError(null)

  const showError = useCallback((message: string) => {
    setError(message)
  }, [])

  const onAuthSuccess = () => {
    router.replace('/(app)' as any)
  }

  const googleFlow = useOAuthFlow(OAUTH_FLOW_PROVIDERS.google, {
    onSuccess: onAuthSuccess,
    onError: (err) => {
      showError(err.message || 'Google sign-in failed. Please try again.')
    },
  })

  const appleFlow = useOAuthFlow(OAUTH_FLOW_PROVIDERS.apple, {
    onSuccess: onAuthSuccess,
    onError: (err) => {
      showError(err.message || 'Apple sign-in failed. Please try again.')
    },
  })
  const handleStartEmail = () => {
    resetErrors()
    clearErrors()
    resetField('password')
    resetField('confirmPassword')
    setStep('email')
  }

  const handleSubmitEmail = handleSubmit(async ({ email }) => {
    resetErrors()
    clearErrors()
    if (!isSignInLoaded || !signIn) {
      showError('Auth is not ready. Please try again.')
      return
    }

    setLoading(true)
    try {
      const attempt = await signIn.create({ identifier: email })
      const supportsPassword = attempt.supportedFirstFactors?.some(
        (factor: any) => factor.strategy === 'password',
      )
      setStep(supportsPassword ? 'password' : 'signUp')
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        const code = err.errors?.[0]?.code
        if (code === 'form_identifier_not_found') {
          setStep('signUp')
          return
        }
        showError(err.errors?.[0]?.message ?? 'Unable to continue with that email.')
      } else {
        const message = err instanceof Error ? err.message : 'Unable to continue with that email.'
        showError(message)
      }
    } finally {
      setLoading(false)
    }
  })

  const handlePasswordSignIn = handleSubmit(async ({ password }) => {
    resetErrors()
    clearErrors()
    if (!password) {
      showError('Please enter your password.')
      return
    }
    if (!isSignInLoaded || !signIn) {
      showError('Auth is not ready. Please try again.')
      return
    }

    setLoading(true)
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'password',
        password,
      })
      if (result.status === 'complete' && result.createdSessionId) {
        await setSignInActive({ session: result.createdSessionId })
        onAuthSuccess()
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        showError(err.errors?.[0]?.message ?? 'Unable to sign in with that password.')
      } else {
        const message =
          err instanceof Error ? err.message : 'Unable to sign in with that password right now.'
        showError(message)
      }
    } finally {
      setLoading(false)
    }
  })

  const handleSignUp = handleSubmit(async (values) => {
    resetErrors()
    clearErrors()
    const { email, password, confirmPassword, name } = values
    if (!email || !password || !confirmPassword) {
      showError('Please fill all fields.')
      return
    }
    if (password !== confirmPassword) {
      showError('Passwords do not match.')
      return
    }
    if (!isSignUpLoaded || !signUp) {
      showError('Sign-up is not ready. Please try again.')
      return
    }

    setLoading(true)
    try {
      const result = await signUp.create({
        emailAddress: email,
        password,
        firstName: name || undefined,
      })
      if (result.status === 'complete' && result.createdSessionId) {
        await setSignUpActive({ session: result.createdSessionId })
        onAuthSuccess()
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        showError(err.errors?.[0]?.message ?? 'Unable to create your account.')
      } else {
        const message = err instanceof Error ? err.message : 'Unable to create your account now.'
        showError(message)
      }
    } finally {
      setLoading(false)
    }
  })

  const handleSocial = async (provider: OAuthFlowProvider) => {
    setLoading(true)
    setError(null)
    if (provider === OAUTH_FLOW_PROVIDERS.google) {
      await googleFlow.startFlow()
    } else if (provider === OAUTH_FLOW_PROVIDERS.apple) {
      await appleFlow.startFlow()
    }
  }

  const hasError = Boolean(error)

  return (
    <AuthScreenLayout
      title="Lane Shadow"
      subtitle="Sign in to save and replay rides"
      backgroundImage={require('../../assets/images/login_background.png')}
      showGlow={false}
    >
      <AuthCard>
        {step === 'start' ? (
          <View style={{ gap: semantic.space.sm }}>
            <Button
              variant="glass"
              size="xl"
              icon={
                <IconSymbol
                  name="apple"
                  color={semantic.color.onSurface.default}
                  size={semantic.space.lg}
                />
              }
              onPress={() => handleSocial(OAUTH_FLOW_PROVIDERS.apple)}
              loading={loading}
              disabled={loading}
            >
              Continue with Apple
            </Button>
            <Button
              variant="glass"
              size="xl"
              icon={
                <IconSymbol
                  name="google"
                  color={semantic.color.onSurface.default}
                  size={semantic.space.lg}
                />
              }
              onPress={() => handleSocial(OAUTH_FLOW_PROVIDERS.google)}
              loading={loading}
              disabled={loading}
            >
              Continue with Google
            </Button>
            <AuthDivider label="or email" />
            <Button variant="glass" size="xl" onPress={handleStartEmail} disabled={loading}>
              Login with Email
            </Button>
          </View>
        ) : null}

        {step === 'email' ? (
          <View style={{ gap: semantic.space.md }}>
            <Text variant="titleMedium" style={{ color: semantic.color.onSurface.default }}>
              Enter your email
            </Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email Address"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="rider@laneshadow.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  error={Boolean(errors.email)}
                />
              )}
            />
            {errors.email ? (
              <HelperText type="error" visible>
                {errors.email.message}
              </HelperText>
            ) : null}
            <Button
              variant="default"
              size="2xl"
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
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="••••••••"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password"
                  error={Boolean(errors.password)}
                />
              )}
            />
            {errors.password ? (
              <HelperText type="error" visible>
                {errors.password.message}
              </HelperText>
            ) : null}
            <Button
              variant="default"
              size="2xl"
              onPress={handlePasswordSignIn}
              loading={loading}
              disabled={loading}
            >
              Sign In
            </Button>
          </View>
        ) : null}

        {step === 'signUp' ? (
          <View style={{ gap: semantic.space.md }}>
            <Text variant="titleMedium" style={{ color: semantic.color.onSurface.default }}>
              Create your account
            </Text>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Rider Name"
                  autoCapitalize="words"
                  autoComplete="name"
                  error={Boolean(errors.name)}
                />
              )}
            />
            {errors.name ? (
              <HelperText type="error" visible>
                {errors.name.message}
              </HelperText>
            ) : null}
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email Address"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="rider@laneshadow.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  error={Boolean(errors.email)}
                />
              )}
            />
            {errors.email ? (
              <HelperText type="error" visible>
                {errors.email.message}
              </HelperText>
            ) : null}
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="••••••••"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password-new"
                  error={Boolean(errors.password)}
                />
              )}
            />
            {errors.password ? (
              <HelperText type="error" visible>
                {errors.password.message}
              </HelperText>
            ) : null}
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirm Password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="••••••••"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password-new"
                  error={Boolean(errors.confirmPassword)}
                />
              )}
            />
            {errors.confirmPassword ? (
              <HelperText type="error" visible>
                {errors.confirmPassword.message}
              </HelperText>
            ) : null}
            <Button
              variant="default"
              size="2xl"
              onPress={handleSignUp}
              loading={loading}
              disabled={loading}
            >
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
          <Button variant="glass" size="xl" onPress={() => setStep('start')} disabled={loading}>
            Back
          </Button>
        ) : null}
      </AuthCard>
    </AuthScreenLayout>
  )
}

export default SignInScreen
