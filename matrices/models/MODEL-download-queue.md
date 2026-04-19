# MODEL-download-queue.md - Sequential Queue Translation Plan

**Source File**: `react-native/lib/mapbox/download-queue.ts`
**Classification**: PORT
**Priority**: P1 (offline download orchestration)

---

## SOURCE ANALYSIS

### Purpose
Sequential download queue processor. Processes downloads one at a time in FIFO order with cancellation and pause/resume support.

### Exports
- `DownloadQueue` class with:
  - `enqueue(item)` → `void`
  - `dequeue(id)` → `boolean`
  - `getStatus()` → `QueueStatus`
  - `pendingCount` → `number`
  - `currentItem` → `QueueItem | null`
  - `queuedIds` → `string[]`
  - `pause()` → `void`
  - `resume()` → `void`
  - `clear()` → `void`
  - Private `processNext()` → `Promise<void>`

### Dependencies
- None (pure queue logic)

### Key Behaviors
- FIFO (first-in-first-out) ordering
- Single concurrent execution (one item at a time)
- Pause prevents next item from starting
- Clear removes all pending items
- Callbacks for completion and error handling

---

## TRANSLATION STRATEGY

### Android (Kotlin)

```kotlin
// queue/DownloadQueue.kt
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

enum class QueueStatus {
    IDLE,
    PROCESSING,
    PAUSED
}

data class QueueItem<T>(
    val id: String,
    val execute: suspend () -> T,
    val onComplete: ((T) -> Unit)? = null,
    val onError: ((Error) -> Unit)? = null
)

class DownloadQueue<T> {
    private val _queue = Channel<QueueItem<T>>(Channel.UNLIMITED)
    private val _status = MutableStateFlow(QueueStatus.IDLE)
    val status: StateFlow<QueueStatus> = _status.asStateFlow()

    private val _pendingIds = MutableStateFlow<List<String>>(emptyList())
    val pendingIds: StateFlow<List<String>> = _pendingIds.asStateFlow()

    private val _currentItem = MutableStateFlow<QueueItem<T>?>(null)
    val currentItem: StateFlow<QueueItem<T>?> = _currentItem.asStateFlow()

    private var processingJob: Job? = null

    fun enqueue(item: QueueItem<T>) {
        // Update pending IDs
        val current = _pendingIds.value.toMutableList()
        current.add(item.id)
        _pendingIds.value = current

        // Try to send to channel (non-blocking)
        _queue.trySend(item)

        // Start processing if idle
        if (_status.value == QueueStatus.IDLE) {
            startProcessing()
        }
    }

    fun dequeue(id: String): Boolean {
        // Filter out the item from pending IDs
        val current = _pendingIds.value.toMutableList()
        val removed = current.remove(id)
        _pendingIds.value = current

        // Note: Cannot remove from Channel once sent,
        // so we skip execution when this ID is processed
        return removed
    }

    fun pause() {
        _status.value = QueueStatus.PAUSED
    }

    fun resume() {
        if (_status.value == QueueStatus.PAUSED) {
            _status.value = QueueStatus.IDLE
            startProcessing()
        }
    }

    fun clear() {
        // Cancel current processing
        processingJob?.cancel()

        // Clear channel and reset state
        _pendingIds.value = emptyList()
        _currentItem.value = null
        _status.value = QueueStatus.IDLE

        // Restart processing job
        processingJob = null
    }

    private fun startProcessing() {
        if (processingJob?.isActive == true) return

        processingJob = CoroutineScope(Dispatchers.Default).launch {
            processNext()
        }
    }

    private suspend fun processNext() {
        while (isActive) {
            // Check if paused
            if (_status.value == QueueStatus.PAUSED) {
                delay(100)
                continue
            }

            // Check if processing
            if (_status.value == QueueStatus.PROCESSING) {
                delay(100)
                continue
            }

            // Try to receive next item
            val item = _queue.tryReceive().getOrNull() ?: run {
                _status.value = QueueStatus.IDLE
                return
            }

            // Check if dequeued (skipped execution)
            if (!_pendingIds.value.contains(item.id)) {
                continue
            }

            // Process item
            _status.value = QueueStatus.PROCESSING
            _currentItem.value = item

            try {
                // Remove from pending IDs
                val current = _pendingIds.value.toMutableList()
                current.remove(item.id)
                _pendingIds.value = current

                // Execute
                val result = item.execute()
                item.onComplete?.invoke(result)
            } catch (error: Throwable) {
                item.onError?.invoke(Error(error.message ?: "Unknown error"))
            } finally {
                _currentItem.value = null
                _status.value = QueueStatus.IDLE
            }
        }
    }
}
```

### iOS (Swift)

```swift
// queue/DownloadQueue.swift
import Foundation

enum QueueStatus {
    case idle
    case processing
    case paused
}

struct QueueItem<T> {
    let id: String
    let execute: () async throws -> T
    let onComplete: ((T) -> Void)?
    let onError: ((Error) -> Void)?
}

@MainActor
class DownloadQueue<T> {
    @Published private(set) var status: QueueStatus = .idle
    @Published private(set) var currentItem: QueueItem<T>?
    @Published private(set) var pendingIds: [String] = []

    private var queue: [QueueItem<T>] = []
    private var task: Task<Void, Never>?

    func enqueue(_ item: QueueItem<T>) {
        // Add to pending IDs
        pendingIds.append(item.id)

        // Add to queue
        queue.append(item)

        // Start processing if idle
        if status == .idle {
            startProcessing()
        }
    }

    func dequeue(id: String) -> Bool {
        // Remove from pending IDs
        if let index = pendingIds.firstIndex(of: id) {
            pendingIds.remove(at: index)
        }

        // Remove from queue
        if let index = queue.firstIndex(where: { $0.id == id }) {
            queue.remove(at: index)
            return true
        }

        return false
    }

    func pause() {
        status = .paused
    }

    func resume() {
        if status == .paused {
            status = .idle
            startProcessing()
        }
    }

    func clear() {
        // Cancel current task
        task?.cancel()

        // Clear state
        queue.removeAll()
        pendingIds.removeAll()
        currentItem = nil
        status = .idle

        task = nil
    }

    private func startProcessing() {
        guard task == nil || task?.isCancelled == true else { return }

        task = Task {
            await processNext()
        }
    }

    private func processNext() async {
        while !Task.isCancelled {
            // Check if paused
            if status == .paused {
                try? await Task.sleep(nanoseconds: 100_000_000) // 100ms
                continue
            }

            // Check if processing
            if status == .processing {
                try? await Task.sleep(nanoseconds: 100_000_000) // 100ms
                continue
            }

            // Get next item
            guard !queue.isEmpty else {
                status = .idle
                return
            }

            let item = queue.removeFirst()

            // Check if dequeued (skipped execution)
            if !pendingIds.contains(item.id) {
                continue
            }

            // Process item
            status = .processing
            currentItem = item

            do {
                // Remove from pending IDs
                pendingIds.removeAll { $0 == item.id }

                // Execute
                let result = try await item.execute()
                item.onComplete?(result)
            } catch {
                item.onError?(error)
            } finally {
                currentItem = nil
                status = .idle
            }
        }
    }
}
```

---

## PARITY CONTRACT

### Behavioral Invariants
1. **FIFO Ordering**: Items MUST be processed in order they were enqueued
2. **Single Execution**: Only ONE item can execute at a time (no concurrency)
3. **Pause Semantics**: Pause stops NEXT item, current item continues
4. **Resume Semantics**: Resume starts processing if idle
5. **Dequeuing**: Dequeued items are skipped when reached in queue
6. **Callbacks**: onComplete/onError MUST be called for each processed item

### Edge Cases
- Empty queue → status = idle, no processing
- Pause with no current item → next item won't start
- Resume when paused → starts processing from front of queue
- Clear while processing → cancels current job, clears all pending

### State Transitions
```
IDLE → PROCESSING (when item available)
PROCESSING → IDLE (after item completes)
PROCESSING → PAUSED (when pause() called)
PAUSED → IDLE (when resume() called)
IDLE → IDLE (clear() resets all state)
```

---

## DEPENDENCIES

### Translation Order
- No dependencies on other business logic files
- Can be translated independently

### Integration Points
- Used by `lib/mapbox/offline-manager.ts` (NATIVE-OWNED) for sequential offline downloads
- Used by `stores/offline-store.ts` (NATIVE-OWNED) for queue state management

### Test Porting
- Port tests from `lib/mapbox/__tests__/download-queue.test.ts` (if exists) to platform tests
- Test FIFO ordering
- Test pause/resume semantics
- Test cancellation behavior
