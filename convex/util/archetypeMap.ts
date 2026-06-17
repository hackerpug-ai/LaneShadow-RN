export type UiArchetype = 'twisties' | 'scenic' | 'technical' | 'cruising' | 'sport' | 'adventure'
export type DbArchetype =
  | 'twisties'
  | 'mountain'
  | 'coastal'
  | 'adventure'
  | 'scenic_byway'
  | 'desert'

const UI_TO_DB: Record<UiArchetype, DbArchetype[]> = {
  scenic: ['scenic_byway', 'coastal'],
  technical: ['mountain'],
  cruising: ['scenic_byway'],
  sport: ['twisties'],
  adventure: ['adventure', 'desert'],
  twisties: ['twisties'],
}

const DB_TO_UI: Record<DbArchetype, UiArchetype> = {
  scenic_byway: 'scenic',
  coastal: 'scenic',
  mountain: 'technical',
  desert: 'adventure',
  twisties: 'twisties',
  adventure: 'adventure',
}

export function uiArchetypeToDbSet(ui: UiArchetype): DbArchetype[] {
  return UI_TO_DB[ui]
}

export function dbArchetypeToUi(db: DbArchetype): UiArchetype {
  return DB_TO_UI[db]
}
