export interface Action {
  id: string
  name: string
  description?: string
  handler: () => void | Promise<void>
  shortcut: string
  tags: string[]
}

// Type for creating a new action (without id)
export type CreateAction = Omit<Action, 'id'>

// Type for updating an existing action
export type UpdateAction = Partial<Omit<Action, 'id'>>

// Type for action search/filtering
export interface ActionFilter {
  search?: string
  tags?: string[]
} 