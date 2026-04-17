/**
 * React Error Boundary with logging.
 *
 * Catches React component errors and logs them to the frontend logger.
 */

import type React from 'react'
import { Component, type ReactNode } from 'react'
import { View } from 'react-native'
import { Text } from 'react-native-paper'
import { logger } from '../../../server/lib/logger/frontend-logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('ui.error', 'React error boundary caught error', error, {
      componentStack: errorInfo.componentStack,
    })
    logger.flush()
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ fontSize: 18, marginBottom: 10 }}>Something went wrong.</Text>
            {__DEV__ && this.state.error && (
              <Text style={{ fontSize: 12, color: 'gray' }}>{this.state.error.message}</Text>
            )}
          </View>
        )
      )
    }

    return this.props.children
  }
}
