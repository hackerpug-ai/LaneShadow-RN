package com.laneshadow.models

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Sequential download queue processor.
 *
 * Processes downloads one at a time in FIFO order.
 * Supports cancellation and pause/resume.
 *
 * Translation from: react-native/lib/mapbox/download-queue.ts
 *
 * TypeScript exports:
 * - enqueue(item: QueueItem): void
 * - dequeue(id: string): boolean
 * - getStatus(): QueueStatus
 * - pendingCount: number
 * - currentItem: QueueItem | null
 * - queuedIds: string[]
 * - pause(): void
 * - resume(): void
 * - clear(): void
 */

/**
 * Queue status enum
 *
 * Matches TypeScript: type QueueStatus = 'idle' | 'processing' | 'paused'
 */
enum class QueueStatus {
    IDLE,
    PROCESSING,
    PAUSED
}

/**
 * Queue item data class
 *
 * Matches TypeScript interface:
 * interface QueueItem<T = unknown> {
 *   id: string
 *   execute: () => Promise<T>
 *   onComplete?: (result: T) => void
 *   onError?: (error: Error) => void
 * }
 */
data class QueueItem<T>(
    val id: String,
    val execute: suspend () -> T,
    val onComplete: ((T) -> Unit)? = null,
    val onError: ((Error) -> Unit)? = null
)

/**
 * Download queue manager
 *
 * Generic class supporting any result type T.
 * Processes items sequentially in FIFO order.
 *
 * @param coroutineScope Optional coroutine scope for testing. Uses Default dispatcher if not provided.
 */
class DownloadQueue<T>(
    private val coroutineScope: CoroutineScope = CoroutineScope(Dispatchers.Default)
) {

    private val queue: MutableList<QueueItem<T>> = mutableListOf()
    private var status: QueueStatus = QueueStatus.IDLE
    private var current: QueueItem<T>? = null
    private var processingJob: Job? = null

    /**
     * Add an item to the download queue.
     *
     * Matches: enqueue(item: QueueItem): void
     */
    fun enqueue(item: QueueItem<T>) {
        queue.add(item)
        if (status == QueueStatus.IDLE) {
            startProcessing()
        }
    }

    /**
     * Remove an item from the queue by ID.
     *
     * Matches: dequeue(id: string): boolean
     */
    fun dequeue(id: String): Boolean {
        val index = queue.indexOfFirst { it.id == id }
        return if (index != -1) {
            queue.removeAt(index)
            true
        } else {
            false
        }
    }

    /**
     * Get current queue status.
     *
     * Matches: getStatus(): QueueStatus
     */
    fun getStatus(): QueueStatus {
        return status
    }

    /**
     * Get number of items waiting in queue.
     *
     * Matches: get pendingCount(): number
     */
    val pendingCount: Int
        get() = queue.size

    /**
     * Get the currently processing item.
     *
     * Matches: get currentItem(): QueueItem | null
     */
    val currentItem: QueueItem<T>?
        get() = current

    /**
     * Get all queued item IDs.
     *
     * Matches: get queuedIds(): string[]
     */
    val queuedIds: List<String>
        get() = queue.map { it.id }

    /**
     * Pause the queue. Current download continues but next item won't start.
     *
     * Matches: pause(): void
     */
    fun pause() {
        status = QueueStatus.PAUSED
    }

    /**
     * Resume the queue. Starts processing next item if idle.
     *
     * Matches: resume(): void
     */
    fun resume() {
        if (status == QueueStatus.PAUSED) {
            status = QueueStatus.IDLE
            startProcessing()
        }
    }

    /**
     * Clear all pending items from the queue.
     *
     * Matches: clear(): void
     */
    fun clear() {
        processingJob?.cancel()
        queue.clear()
        status = QueueStatus.IDLE
        current = null
        processingJob = null
    }

    /**
     * Start processing items from the queue.
     */
    private fun startProcessing() {
        if (processingJob?.isActive == true) return

        processingJob = coroutineScope.launch {
            processNext()
        }
    }

    /**
     * Process the next item in the queue.
     *
     * Matches: private async processNext(): Promise<void>
     */
    private suspend fun processNext() {
        while (true) {
            // Check if paused or processing
            if (status == QueueStatus.PAUSED || status == QueueStatus.PROCESSING) {
                delay(100)
                continue
            }

            // Check if queue is empty
            if (queue.isEmpty()) {
                status = QueueStatus.IDLE
                return
            }

            // Get next item
            status = QueueStatus.PROCESSING
            current = queue.removeAt(0)

            try {
                val result = current!!.execute()
                current!!.onComplete?.invoke(result)
            } catch (error: Throwable) {
                current!!.onError?.invoke(Error(error.message ?: "Unknown error"))
            } finally {
                current = null
                status = QueueStatus.IDLE
            }
        }
    }
}
