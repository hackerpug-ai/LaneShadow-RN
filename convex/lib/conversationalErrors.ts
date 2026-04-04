import { ERROR_CODES } from '../errors'

/**
 * Conversational error messages for user-facing chat responses
 * These messages are empathetic, helpful, and suggest next steps
 * No modal dialogs - all errors communicated as chat messages
 */

export interface ConversationalError {
  code: string
  message: string
  suggestion?: string
  canRetry: boolean
}

/**
 * Map error codes to conversational messages
 */
export function getConversationalError(
  errorCode: string,
  context?: Record<string, unknown>
): ConversationalError {
  switch (errorCode) {
    case ERROR_CODES.RATE_LIMIT_EXCEEDED:
      return {
        code: errorCode,
        message: `You've reached your monthly limit of 5 route plans. 🔒`,
        suggestion: `Upgrade to Premium for unlimited plans and advanced features!`,
        canRetry: false,
      }

    case ERROR_CODES.LOW_CONFIDENCE_PARSE:
      return {
        code: errorCode,
        message: `I'm having trouble understanding your request. 🤔`,
        suggestion: `Could you provide more details? For example: "Plan a ride from San Francisco to Santa Cruz along scenic roads."`,
        canRetry: true,
      }

    case ERROR_CODES.NETWORK_TIMEOUT:
      return {
        code: errorCode,
        message: `The request took too long to complete. ⏱️`,
        suggestion: `Please try again. If this persists, check your connection or contact support.`,
        canRetry: true,
      }

    case ERROR_CODES.WEATHER_UNAVAILABLE:
      return {
        code: errorCode,
        message: `Weather information is currently unavailable. 🌤️`,
        suggestion: `You can still plan your route, but weather data won't be included. Try again later for weather updates.`,
        canRetry: true,
      }

    case ERROR_CODES.GENERATION_FAILED:
      return {
        code: errorCode,
        message: `I couldn't generate a route plan. Sorry about that! 😔`,
        suggestion: `Let's try a different approach. Could you specify your start and end points more clearly?`,
        canRetry: true,
      }

    case ERROR_CODES.AGENT_TIMEOUT:
      return {
        code: errorCode,
        message: `Planning is taking longer than expected. ⏳`,
        suggestion: `Please try again. Complex routes may take a moment to process.`,
        canRetry: true,
      }

    case ERROR_CODES.NO_ROUTES_GENERATED:
      return {
        code: errorCode,
        message: `I couldn't find any routes matching your criteria. 🛣️`,
        suggestion: `Try adjusting your preferences or check if the locations are accessible by road.`,
        canRetry: true,
      }

    case ERROR_CODES.PLAN_ALREADY_ACTIVE:
      return {
        code: errorCode,
        message: `You already have an active plan in progress. 🔄`,
        suggestion: `Wait for the current plan to complete, or check your saved routes.`,
        canRetry: false,
      }

    case ERROR_CODES.PLAN_NOT_FOUND:
      return {
        code: errorCode,
        message: `I couldn't find that plan. 📋`,
        suggestion: `It may have been deleted or you might not have access to it. Check your saved routes.`,
        canRetry: false,
      }

    default:
      return {
        code: 'UNKNOWN_ERROR',
        message: `Something unexpected happened. 🙈`,
        suggestion: `Please try again. If the problem persists, contact support.`,
        canRetry: true,
      }
  }
}

/**
 * Format error for chat response
 * Returns a user-friendly string suitable for display in chat
 */
export function formatErrorForChat(error: ConversationalError): string {
  let message = error.message

  if (error.suggestion) {
    message += `\n\n${error.suggestion}`
  }

  if (error.canRetry) {
    message += `\n\nYou can try again.`
  }

  return message
}

/**
 * Create a conversational error response for actions
 * This is the preferred way to return errors to the chat interface
 */
export function createChatError(
  errorCode: string,
  context?: Record<string, unknown>
): { error: ConversationalError } {
  return {
    error: getConversationalError(errorCode, context),
  }
}
