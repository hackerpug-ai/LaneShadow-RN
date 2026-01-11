import { isClerkAPIResponseError, useAuth, useSSO, useSignIn, useSignUp } from '@clerk/clerk-expo'
import { useQuery } from 'convex/react'
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { api } from '../convex/_generated/api'
import type { Session } from '../models/users'

type AuthNextStep = 'password' | 'signUp'

type SessionContextType = {
  isLoading: boolean
  session: Session | null | undefined
  sessionId: string | null
  beginEmail: (identifier: string) => Promise<AuthNextStep>
  signInWithPassword: (password: string) => Promise<void>
  signUpWithEmail: (params: { email: string; password: string; name?: string }) => Promise<void>
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<void>
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionContextType>({
  isLoading: true,
  session: null,
  sessionId: null,
  beginEmail: async () => 'password',
  signInWithPassword: async () => {},
  signUpWithEmail: async () => {},
  signInWithOAuth: async () => {},
  signOut: async () => {
    console.error('signOut not implemented')
  },
})

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const { userId, isLoaded: isAuthLoaded, signOut: clerkSignOut, sessionId } = useAuth()
  const { signIn, isLoaded: isSignInLoaded, setActive } = useSignIn()
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp()
  const { startSSOFlow } = useSSO()

  const session = useQuery(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation depth issue with conditional query
    api.db.users.getSession,
    userId ? undefined : 'skip'
  )

  const [signInAttempt, setSignInAttempt] = useState<any | null>(null)

  const beginEmail = useCallback(
    async (identifier: string): Promise<AuthNextStep> => {
      if (!isSignInLoaded || !signIn) {
        throw new Error('Auth is not ready. Please try again.')
      }
      const attempt = await signIn.create({ identifier })
      setSignInAttempt(attempt)
      const supportsPassword = attempt.supportedFirstFactors?.some(
        (factor: any) => factor.strategy === 'password'
      )
      return supportsPassword ? 'password' : 'signUp'
    },
    [isSignInLoaded, signIn]
  )

  const signInWithPassword = useCallback(
    async (password: string) => {
      if (!isSignInLoaded || !signIn || !signInAttempt) {
        throw new Error('Auth is not ready. Please restart the email flow.')
      }
      const result = await signIn.attemptFirstFactor({
        strategy: 'password',
        password,
      })
      if (result.status === 'complete' && result.createdSessionId) {
        await setActive({ session: result.createdSessionId })
        setSignInAttempt(null)
        return
      }
      throw new Error('Please complete the sign-in flow.')
    },
    [isSignInLoaded, setActive, signIn, signInAttempt]
  )

  const signUpWithEmail = useCallback(
    async ({ email, password, name }: { email: string; password: string; name?: string }) => {
      if (!isSignUpLoaded || !signUp) {
        throw new Error('Sign-up is not ready. Please try again.')
      }
      const result = await signUp.create({
        emailAddress: email,
        password,
        firstName: name || undefined,
      })
      if (result.status === 'complete' && result.createdSessionId) {
        await setActive({ session: result.createdSessionId })
        setSignInAttempt(null)
        return
      }
      throw new Error('Please complete the sign-up flow.')
    },
    [isSignUpLoaded, setActive, signUp]
  )

  const signInWithOAuth = useCallback(
    async (provider: 'google' | 'apple') => {
      const { createdSessionId } = await startSSOFlow({
        strategy: provider === 'google' ? 'oauth_google' : 'oauth_apple',
      })
      if (createdSessionId) {
        await setActive({ session: createdSessionId })
        setSignInAttempt(null)
        return
      }
      throw new Error('Unable to complete social sign-in.')
    },
    [setActive, startSSOFlow]
  )

  const signOut = useCallback(async () => {
    setSignInAttempt(null)
    await clerkSignOut()
  }, [clerkSignOut])

  const value = useMemo<SessionContextType>(
    () => ({
      isLoading: !isAuthLoaded,
      session,
      sessionId: sessionId ?? null,
      beginEmail: async (identifier: string) => {
        try {
          return await beginEmail(identifier)
        } catch (err) {
          if (isClerkAPIResponseError(err)) {
            const code = err.errors?.[0]?.code
            if (code === 'form_identifier_not_found') {
              setSignInAttempt(null)
              return 'signUp'
            }
            throw new Error(err.errors?.[0]?.message ?? 'Unable to continue with that email.')
          }
          const message = err instanceof Error ? err.message : 'Unable to continue with that email.'
          throw new Error(message)
        }
      },
      signInWithPassword: async (password: string) => {
        try {
          await signInWithPassword(password)
        } catch (err) {
          if (isClerkAPIResponseError(err)) {
            throw new Error(err.errors?.[0]?.message ?? 'Unable to sign in with that password.')
          }
          const message =
            err instanceof Error ? err.message : 'Unable to sign in with that password right now.'
          throw new Error(message)
        }
      },
      signUpWithEmail: async (params) => {
        try {
          await signUpWithEmail(params)
        } catch (err) {
          if (isClerkAPIResponseError(err)) {
            throw new Error(err.errors?.[0]?.message ?? 'Unable to create your account.')
          }
          const message =
            err instanceof Error ? err.message : 'Unable to create your account right now.'
          throw new Error(message)
        }
      },
      signInWithOAuth: async (provider) => {
        try {
          await signInWithOAuth(provider)
        } catch (err) {
          if (isClerkAPIResponseError(err)) {
            throw new Error(err.errors?.[0]?.message ?? 'Unable to complete social sign-in.')
          }
          const message =
            err instanceof Error ? err.message : 'Unable to complete social sign-in right now.'
          throw new Error(message)
        }
      },
      signOut,
    }),
    [
      beginEmail,
      isAuthLoaded,
      session,
      sessionId,
      signInWithOAuth,
      signInWithPassword,
      signOut,
      signUpWithEmail,
    ]
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export const useSession = () => {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error('useSession must be used within SessionProvider')
  }
  return context
}

export const useCurrentUser = () => {
  const { session } = useSession()
  return session?.user ?? null
}
