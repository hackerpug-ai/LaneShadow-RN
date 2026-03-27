export const applySearchFilter = <T extends { name: string }>(
  items: T[],
  searchQuery: string | undefined
): T[] => {
  if (!searchQuery) return items
  const lower = searchQuery.toLowerCase()
  return items.filter((item) => item.name.toLowerCase().includes(lower))
}
