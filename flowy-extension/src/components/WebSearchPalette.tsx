import { useEffect, useState } from "react"
import { CommandPalette } from "./CommandPalette"
import { fetchSearchSuggestions, getSearchUrl, SearchSuggestion } from "../lib/services/search"
import { SearchEngine } from "../types/settings"

interface WebSearchPaletteProps {
  onClose: () => void
  defaultEngine: SearchEngine
}

export const WebSearchPalette = ({ onClose, defaultEngine }: WebSearchPaletteProps) => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [query, setQuery] = useState("")

  useEffect(() => {
    if (query.trim()) {
      fetchSearchSuggestions(query, defaultEngine).then(setSuggestions)
    } else {
      setSuggestions([])
    }
  }, [query, defaultEngine])

  const handleSelect = (suggestion: SearchSuggestion) => {
    const searchUrl = getSearchUrl(suggestion.name, defaultEngine)
    chrome.tabs.create({ url: searchUrl })
    onClose()
  }

  return (
    <CommandPalette
      items={suggestions}
      onSelect={handleSelect}
      onClose={onClose}
      placeholder={`Search with ${defaultEngine}...`}
      mode="web"
    />
  )
} 