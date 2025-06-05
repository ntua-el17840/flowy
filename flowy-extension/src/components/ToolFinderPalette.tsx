import { useEffect, useState } from "react"
import { CommandPalette } from "./CommandPalette"
import { Action } from "../types/action"
import Fuse from "fuse.js"

interface ToolFinderPaletteProps {
  onClose: () => void
  actions: Action[]
}

export const ToolFinderPalette = ({ onClose, actions }: ToolFinderPaletteProps) => {
  const [filteredActions, setFilteredActions] = useState<Action[]>(actions)
  const [query, setQuery] = useState("")

  useEffect(() => {
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
  }, [query, actions])

  const handleSelect = async (action: Action) => {
    try {
      await action.handler()
      onClose()
    } catch (error) {
      console.error(`Error executing action ${action.name}:`, error)
    }
  }

  return (
    <CommandPalette
      items={filteredActions}
      onSelect={handleSelect}
      onClose={onClose}
      placeholder="Search tools..."
      mode="tool"
    />
  )
} 