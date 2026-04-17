export const applySearchFilter = <T extends { name: string }>(
  items: T[],
  searchQuery: string | undefined
): T[] => {
  if (!searchQuery) return items
  const lower = searchQuery.toLowerCase()
  return items.filter((item) => item.name.toLowerCase().includes(lower))
}

export const applyDateFilter = <T extends { createdAt: number }>(
  items: T[],
  afterDate: number | undefined,
  beforeDate: number | undefined
): T[] => {
  let filtered = items
  if (afterDate !== undefined) {
    filtered = filtered.filter((item) => item.createdAt >= afterDate)
  }
  if (beforeDate !== undefined) {
    filtered = filtered.filter((item) => item.createdAt <= beforeDate)
  }
  return filtered
}
