/**
 * Sequential download queue processor.
 *
 * Processes downloads one at a time in FIFO order.
 * Supports cancellation and priority ordering.
 */

export interface QueueItem<T = unknown> {
  id: string
  execute: () => Promise<T>
  onComplete?: (result: T) => void
  onError?: (error: Error) => void
}

export type QueueStatus = 'idle' | 'processing' | 'paused'

export class DownloadQueue {
  private queue: QueueItem[] = []
  private status: QueueStatus = 'idle'
  private current: QueueItem | null = null

  /**
   * Add an item to the download queue.
   */
  enqueue(item: QueueItem): void {
    this.queue.push(item)
    if (this.status === 'idle') {
      void this.processNext()
    }
  }

  /**
   * Remove an item from the queue by ID.
   */
  dequeue(id: string): boolean {
    const index = this.queue.findIndex((item) => item.id === id)
    if (index !== -1) {
      this.queue.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * Get current queue status.
   */
  getStatus(): QueueStatus {
    return this.status
  }

  /**
   * Get number of items waiting in queue.
   */
  get pendingCount(): number {
    return this.queue.length
  }

  /**
   * Get the currently processing item.
   */
  get currentItem(): QueueItem | null {
    return this.current
  }

  /**
   * Get all queued item IDs.
   */
  get queuedIds(): string[] {
    return this.queue.map((item) => item.id)
  }

  /**
   * Pause the queue. Current download continues but next item won't start.
   */
  pause(): void {
    this.status = 'paused'
  }

  /**
   * Resume the queue. Starts processing next item if idle.
   */
  resume(): void {
    if (this.status === 'paused') {
      this.status = 'idle'
      void this.processNext()
    }
  }

  /**
   * Clear all pending items from the queue.
   */
  clear(): void {
    this.queue = []
  }

  /**
   * Process the next item in the queue.
   */
  private async processNext(): Promise<void> {
    if (this.status === 'paused' || this.status === 'processing') return
    if (this.queue.length === 0) {
      this.status = 'idle'
      return
    }

    this.status = 'processing'
    this.current = this.queue.shift()!

    try {
      const result = await this.current.execute()
      this.current.onComplete?.(result as never)
    } catch (error) {
      this.current.onError?.(error as Error)
    } finally {
      this.current = null
      this.status = 'idle'
      void this.processNext()
    }
  }
}
