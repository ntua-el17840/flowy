import { useEffect, useState, useCallback } from "react"
import { CommandPalette } from "./CommandPalette"
import { Action } from "../types/action"
import Fuse from "fuse.js"

interface ToolFinderPaletteProps {
  onClose: () => void
  actions: Action[]
  isPopup?: boolean
}

export const ToolFinderPalette = ({ onClose, actions, isPopup = false }: ToolFinderPaletteProps) => {
  const [filteredActions, setFilteredActions] = useState<Action[]>(actions)

  const handleQueryChange = useCallback((query: string) => {
    if (query.trim()) {
      const fuse = new Fuse(actions, {
        keys: ["name", "tags"],
        threshold: 0.3,
        includeScore: true
      })
      const results = fuse.search(query).map((result) => result.item)
      setFilteredActions(results.slice(0, 6)) // Show top 6 results
    } else {
      setFilteredActions(actions)
    }
  }, [actions])

  const handleSelect = useCallback(async (action: Action) => {
    try {
      if (typeof action.handler === 'function') {
        await action.handler()
      } else {
        console.log('Action handler not implemented:', action.name)
      }
      onClose()
    } catch (error) {
      console.error(`Error executing action ${action.name}:`, error)
    }
  }, [onClose])

  return (
    <CommandPalette
      items={filteredActions}
      onSelect={handleSelect}
      onQueryChange={handleQueryChange}
      onClose={onClose}
      placeholder="Search tools..."
      mode="tool"
      isPopup={isPopup}
    />
  )
} 