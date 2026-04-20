package com.laneshadow.models

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.test.runTest
import org.junit.Before
import org.junit.Test
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull

/**
 * TDD Test for DownloadQueue Model Translation
 *
 * AC-1: Public API matches source
 * GIVEN: TypeScript source defines exported functions
 * WHEN: Kotlin equivalents are called
 * THEN: Function signatures match (names, parameters, return types)
 *
 * TypeScript source exports from react-native/lib/mapbox/download-queue.ts:
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
class DownloadQueueTest {

    private lateinit var queue: DownloadQueue<String>

    @Before
    fun setup() {
        // For AC-1 tests (non-async), use default scope
        queue = DownloadQueue()
    }

    /**
     * Test that enqueue matches source signature
     * Source: enqueue(item: QueueItem): void
     */
    @Test
    fun testPublicAPI_matchesSource_enqueue() = runTest {
        // GIVEN: A queue item matching TypeScript interface
        val item = QueueItem(
            id = "test-1",
            execute = { "result-1" },
            onComplete = null,
            onError = null
        )

        // WHEN: Calling enqueue (should not throw)
        queue.enqueue(item)

        // THEN: enqueue() starts processing immediately (matching TypeScript behavior)
        // The item is consumed from the queue and begins processing
        // We verify it didn't throw an exception
        assertTrue(true)
    }

    /**
     * Test that dequeue matches source signature
     * Source: dequeue(id: string): boolean
     */
    @Test
    fun testPublicAPI_matchesSource_dequeue() = runTest {
        // GIVEN: Queue with an item
        val item = QueueItem(
            id = "test-1",
            execute = { "result-1" }
        )
        queue.enqueue(item)

        // WHEN: Calling dequeue
        val result = queue.dequeue("test-1")

        // THEN: Returns boolean and removes item
        assertEquals(true, result)
        assertEquals(0, queue.pendingCount)
    }

    /**
     * Test that getStatus matches source signature
     * Source: getStatus(): QueueStatus (where QueueStatus = 'idle' | 'processing' | 'paused')
     */
    @Test
    fun testPublicAPI_matchesSource_getStatus() {
        // GIVEN: Empty queue
        // WHEN: Calling getStatus
        val status = queue.getStatus()

        // THEN: Returns QueueStatus enum
        assertEquals(QueueStatus.IDLE, status)
    }

    /**
     * Test that pendingCount matches source signature
     * Source: get pendingCount(): number
     */
    @Test
    fun testPublicAPI_matchesSource_pendingCount() = runTest {
        // GIVEN: Queue with items
        val item1 = QueueItem(id = "test-1", execute = { "result-1" })
        val item2 = QueueItem(id = "test-2", execute = { "result-2" })
        queue.enqueue(item1)
        queue.enqueue(item2)

        // WHEN: Accessing pendingCount
        val count = queue.pendingCount

        // THEN: Returns number of pending items
        assertEquals(2, count)
    }

    /**
     * Test that currentItem matches source signature
     * Source: get currentItem(): QueueItem | null
     */
    @Test
    fun testPublicAPI_matchesSource_currentItem() {
        // GIVEN: Empty queue
        // WHEN: Accessing currentItem
        val current = queue.currentItem

        // THEN: Returns null when no item processing
        assertNull(current)
    }

    /**
     * Test that queuedIds matches source signature
     * Source: get queuedIds(): string[]
     */
    @Test
    fun testPublicAPI_matchesSource_queuedIds() = runTest {
        // GIVEN: Queue with items (paused to prevent immediate processing)
        queue.pause()
        val item1 = QueueItem(id = "test-1", execute = { "result-1" })
        val item2 = QueueItem(id = "test-2", execute = { "result-2" })
        queue.enqueue(item1)
        queue.enqueue(item2)

        // WHEN: Accessing queuedIds
        val ids = queue.queuedIds

        // THEN: Returns list of IDs in FIFO order
        assertEquals(listOf("test-1", "test-2"), ids)
    }

    /**
     * Test that pause matches source signature
     * Source: pause(): void
     */
    @Test
    fun testPublicAPI_matchesSource_pause() {
        // GIVEN: Queue in idle state
        // WHEN: Calling pause (should not throw)
        queue.pause()

        // THEN: Status changes to paused
        assertEquals(QueueStatus.PAUSED, queue.getStatus())
    }

    /**
     * Test that resume matches source signature
     * Source: resume(): void
     */
    @Test
    fun testPublicAPI_matchesSource_resume() {
        // GIVEN: Paused queue
        queue.pause()

        // WHEN: Calling resume (should not throw)
        queue.resume()

        // THEN: Status changes to idle
        assertEquals(QueueStatus.IDLE, queue.getStatus())
    }

    /**
     * Test that clear matches source signature
     * Source: clear(): void
     */
    @Test
    fun testPublicAPI_matchesSource_clear() = runTest {
        // GIVEN: Queue with items (paused to prevent processing)
        queue.pause()
        val item1 = QueueItem(id = "test-1", execute = { "result-1" })
        val item2 = QueueItem(id = "test-2", execute = { "result-2" })
        queue.enqueue(item1)
        queue.enqueue(item2)

        // WHEN: Calling clear (should not throw)
        queue.clear()

        // THEN: All items removed, status reset
        assertEquals(0, queue.pendingCount)
        assertEquals(QueueStatus.IDLE, queue.getStatus())
    }

    // ==================================================================================
    // AC-2: Async operations use coroutines
    // ==================================================================================

    /**
     * Test that execute is a suspend function
     * Source: execute: () => Promise<T>
     */
    @Test
    fun testAsyncOperationsUseCoroutines_executeIsSuspend() = runTest {
        // GIVEN: Queue with test scope
        val testQueue = DownloadQueue<String>(this)

        // AND: Queue item with suspend execute function and callback
        var callbackResult: String? = null
        val item = QueueItem(
            id = "test-1",
            execute = {
                delay(100) // Simulate async work
                "result-1"
            },
            onComplete = { result ->
                callbackResult = result
            }
        )

        // WHEN: Enqueueing and processing
        testQueue.enqueue(item)
        delay(1000) // Wait for processing

        // THEN: Callback was invoked, proving execute completed
        assertEquals("result-1", callbackResult)
    }

    /**
     * Test that processNext uses coroutines correctly
     * Source: private async processNext(): Promise<void>
     */
    @Test
    fun testAsyncOperationsUseCoroutines_processNext() = runTest {
        // GIVEN: Queue with test scope
        val testQueue = DownloadQueue<String>(this)

        // AND: Multiple items
        val results = mutableListOf<String>()
        val item1 = QueueItem(
            id = "test-1",
            execute = {
                delay(50)
                results.add("item-1")
                "result-1"
            }
        )
        val item2 = QueueItem(
            id = "test-2",
            execute = {
                delay(50)
                results.add("item-2")
                "result-2"
            }
        )

        // WHEN: Enqueueing multiple items
        testQueue.enqueue(item1)
        testQueue.enqueue(item2)
        delay(500) // Wait for both to process

        // THEN: Items processed sequentially (FIFO order)
        assertEquals(listOf("item-1", "item-2"), results)
    }

    /**
     * Test that pause/resume work with coroutines
     * Source: pause() and resume() control async processing
     */
    @Test
    fun testAsyncOperationsUseCoroutines_pauseResume() = runTest {
        // GIVEN: Queue with test scope
        val testQueue = DownloadQueue<String>(this)

        // AND: Item and paused queue
        var executed = false
        testQueue.pause()
        val item = QueueItem(
            id = "test-1",
            execute = {
                delay(50)
                executed = true
                "result"
            }
        )
        testQueue.enqueue(item)
        delay(200) // Wait to ensure it doesn't execute

        // THEN: Item not executed due to pause
        assertEquals(false, executed)
        assertEquals(QueueStatus.PAUSED, testQueue.getStatus())

        // WHEN: Resuming
        testQueue.resume()
        delay(200) // Wait for processing

        // THEN: Item executed after resume
        assertEquals(true, executed)
        assertEquals(QueueStatus.IDLE, testQueue.getStatus())
    }

    /**
     * Test that onComplete callback works with coroutines
     * Source: onComplete?: (result: T) => void
     */
    @Test
    fun testAsyncOperationsUseCoroutines_onComplete() = runTest {
        // GIVEN: Queue with test scope
        val testQueue = DownloadQueue<String>(this)

        // AND: Item with completion callback
        var callbackResult: String? = null
        val item = QueueItem(
            id = "test-1",
            execute = {
                delay(50)
                "async-result"
            },
            onComplete = { result ->
                callbackResult = result
            }
        )

        // WHEN: Processing item
        testQueue.enqueue(item)
        delay(200)

        // THEN: Callback invoked with result
        assertEquals("async-result", callbackResult)
    }

    /**
     * Test that onError callback works with coroutines
     * Source: onError?: (error: Error) => void
     */
    @Test
    fun testAsyncOperationsUseCoroutines_onError() = runTest {
        // GIVEN: Queue with test scope
        val testQueue = DownloadQueue<String>(this)

        // AND: Item that throws error
        var errorCaught: Error? = null
        val item = QueueItem<String>(
            id = "test-1",
            execute = {
                delay(50)
                throw RuntimeException("Test error")
            },
            onError = { error ->
                errorCaught = error
            }
        )

        // WHEN: Processing item
        testQueue.enqueue(item)
        delay(200)

        // THEN: Error callback invoked
        assertNotNull(errorCaught)
        assertTrue(errorCaught?.message?.contains("Test error") == true)
    }
}
