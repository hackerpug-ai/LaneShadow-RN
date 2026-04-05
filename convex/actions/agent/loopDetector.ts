'use node'

import { createHash } from 'crypto'

export type ToolCall = {
  name: string
  arguments: Record<string, unknown>
}

function sortedKeys(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(sortedKeys)
  const sorted: Record<string, unknown> = {}
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    sorted[key] = sortedKeys((value as Record<string, unknown>)[key])
  }
  return sorted
}

function hashCall(call: ToolCall): string {
  const payload = `${call.name}:${JSON.stringify(sortedKeys(call.arguments))}`
  return createHash('sha256').update(payload).digest('hex').slice(0, 16)
}

export class LoopDetector {
  private counts = new Map<string, number>()

  constructor(private threshold: number = 3) {}

  record(call: ToolCall): boolean {
    const key = hashCall(call)
    const count = (this.counts.get(key) ?? 0) + 1
    this.counts.set(key, count)
    return count >= this.threshold
  }

  getCount(call: ToolCall): number {
    return this.counts.get(hashCall(call)) ?? 0
  }

  clear(): void {
    this.counts.clear()
  }
}
