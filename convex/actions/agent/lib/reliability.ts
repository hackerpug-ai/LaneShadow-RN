'use node'
export type TimeoutOptions = {
  ms: number
  label?: string
}

/**
 * Wraps an async operation with an abortable timeout.
 * Caller should catch and translate timeout failures to deterministic error codes.
 */
export const withTimeout = async <T>(
  operation: (signal: any) => Promise<T>,
  { ms, label }: TimeoutOptions,
): Promise<T> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)

  try {
    return await operation(controller.signal)
  } catch (error) {
    if (controller.signal.aborted) {
      const reason = label ? `TIMEOUT:${label}` : 'TIMEOUT'
      throw new Error(reason)
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

export type RetryOnceOptions = {
  shouldRetry?: (error: unknown) => boolean
  onRetry?: (error: unknown) => void
}

/**
 * Executes an async operation with at most one retry.
 * Retries only when shouldRetry returns true (default: true).
 */
export const retryOnce = async <T>(
  operation: () => Promise<T>,
  options?: RetryOnceOptions,
): Promise<T> => {
  const shouldRetry = options?.shouldRetry ?? (() => true)
  try {
    return await operation()
  } catch (error) {
    if (!shouldRetry(error)) {
      throw error
    }
    options?.onRetry?.(error)
    return await operation()
  }
}

export type ConcurrencyLimiter = <T>(fn: () => Promise<T>) => Promise<T>

/**
 * Deterministic, dependency-free concurrency limiter (p-limit style).
 *
 * - Preserves FIFO scheduling.
 * - Avoids dynamic imports (important for Convex bundling + test determinism).
 */
export const createConcurrencyLimiter = (concurrency: number): ConcurrencyLimiter => {
  if (!Number.isFinite(concurrency) || concurrency <= 0) {
    throw new Error(`Invalid concurrency: ${concurrency}`)
  }

  let active = 0
  const queue: (() => void)[] = []

  const next = () => {
    if (active >= concurrency) return
    const run = queue.shift()
    if (!run) return
    active += 1
    run()
  }

  return async <T>(fn: () => Promise<T>) =>
    new Promise<T>((resolve, reject) => {
      const run = () => {
        fn()
          .then(resolve, reject)
          .finally(() => {
            active -= 1
            next()
          })
      }
      queue.push(run)
      next()
    })
}

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
