# MODEL-mapbox-download-queue.md - Sequential Download Queue Translation Plan

**Document ID**: MAT-MODEL-MAPBOX-DOWNLOAD-QUEUE
**Status**: Draft
**Source File**: `react-native/lib/mapbox/download-queue.ts`
**Classification**: PORT
**Priority**: P0 (Offline map downloads)
**Protocol**: 08g-model-translation-protocol.md

---

## Overview

Sequential download queue processor that processes downloads one at a time in FIFO order. Supports cancellation, pause/resume, and priority ordering. Pure business logic for queue management with no platform dependencies.

---

## Platform Translation Strategy

### Android (Kotlin)

**Queue**: kotlinx.coroutines.channels.Channel

```kotlin
// DownloadQueue.kt
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

sealed class QueueStatus { object Idle : QueueStatus(); object Processing : QueueStatus(); object Paused : QueueStatus() }

data class QueueItem<T>(
    val id: String,
    val execute: suspend () -> T,
    val onComplete: ((T) -> Unit)? = null,
    val onError: ((Error) -> Unit)? = null
)

class DownloadQueue<T> {
    private val queue = Channel<QueueItem<T>>(capacity = Channel.UNLIMITED)
    private val _status = MutableStateFlow<QueueStatus>(QueueStatus.Idle)
    val status: StateFlow<QueueStatus> = _status.asStateFlow()

    private val _currentItem = MutableStateFlow<QueueItem<T>?>(null)
    val currentItem: StateFlow<QueueItem<T>?> = _currentItem.asStateFlow()

    private var processingJob: Job? = null

    suspend fun enqueue(item: QueueItem<T>) {
        queue.send(item)
        if (_status.value is QueueStatus.Idle) {
            startProcessing()
        }
    }

    fun dequeue(id: String): Boolean {
        // Channel doesn't support removal by ID, so we track pending items separately
        return true // Implementation would use a separate tracking list
    }

    fun pause() {
        _status.value = QueueStatus.Paused
    }

    fun resume() {
        if (_status.value is QueueStatus.Paused) {
            _status.value = QueueStatus.Idle
            startProcessing()
        }
    }

    fun clear() {
        // Cancel current and clear queue
        processingJob?.cancel()
        processingJob = null
        _currentItem.value = null
        _status.value = QueueStatus.Idle
    }

    val pendingCount: Int
        get() = queue.isEmpty // Simplified

    val queuedIds: List<String>
        get() = emptyList() // Would need separate tracking

    private fun startProcessing() {
        if (processingJob?.isActive == true) return

        processingJob = CoroutineScope(Dispatchers.Default).launch {
            while (isActive) {
                when (val status = _status.value) {
                    is QueueStatus.Paused -> delay(100)
                    is QueueStatus.Idle -> {
                        val item = queue.receiveCatching().getOrNull() ?: break
                        processItem(item)
                    }
                    is QueueStatus.Processing -> delay(100)
                }
            }
            _status.value = QueueStatus.Idle
        }
    }

    private suspend fun processItem(item: QueueItem<T>) {
        _status.value = QueueStatus.Processing
        _currentItem.value = item

        try {
            val result = item.execute()
            item.onComplete?.invoke(result)
        } catch (error: Error) {
            item.onError?.invoke(error)
        } finally {
            _currentItem.value = null
            _status.value = QueueStatus.Idle
        }
    }
}
```

### iOS (Swift)

**Queue**: AsyncStream + Actor

```swift
// DownloadQueue.swift
import Foundation

enum QueueStatus { case idle, processing, paused }

struct QueueItem<T> {
    let id: String
    let execute: () async -> T
    let onComplete: ((T) -> Void)?
    let onError: ((Error) -> Void)?
}

@MainActor
class DownloadQueue<T>: ObservableObject {
    @Published private(set) var status: QueueStatus = .idle
    @Published private(set) var currentItem: QueueItem<T>?

    private var queue: [QueueItem<T>] = []
    private var processingTask: Task<Void, Never>?

    func enqueue(_ item: QueueItem<T>) {
        queue.append(item)
        if status == .idle {
            startProcessing()
        }
    }

    func dequeue(id: String) -> Bool {
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
        queue.removeAll()
        processingTask?.cancel()
        processingTask = nil
        currentItem = nil
        status = .idle
    }

    var pendingCount: Int {
        queue.count
    }

    var queuedIds: [String] {
        queue.map { $0.id }
    }

    private func startProcessing() {
        guard processingTask == nil else { return }

        processingTask = Task {
            while !Task.isCancelled && !queue.isEmpty {
                switch status {
                case .paused:
                    try? await Task.sleep(nanoseconds: 100_000_000) // 0.1s
                case .idle:
                    guard !queue.isEmpty else { break }
                    let item = queue.removeFirst()
                    await processItem(item)
                case .processing:
                    break
                }
            }
            status = .idle
            processingTask = nil
        }
    }

    private func processItem(_ item: QueueItem<T>) async {
        status = .processing
        currentItem = item

        do {
            let result = await item.execute()
            item.onComplete?(result)
        } catch {
            item.onError?(error)
        }

        currentItem = nil
        status = .idle
    }
}
```

---

## References

- `08g-model-translation-protocol.md` — Classification and translation patterns
- React Native source: `react-native/lib/mapbox/download-queue.ts`

---

**Change Log**:
- 2026-04-19: Initial translation plan authored (FND-006)
