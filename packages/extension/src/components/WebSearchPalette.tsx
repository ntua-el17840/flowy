import { useEffect, useState, useCallback } from "react"
import { CommandPalette } from "./CommandPalette"
import { fetchSearchSuggestions, getSearchUrl, SearchSuggestion } from "../lib/services/search"
import type { SearchEngine } from "../types/settings"

interface WebSearchPaletteProps {
  onClose: () => void
  defaultEngine: SearchEngine
  isPopup?: boolean
}

export const WebSearchPalette = ({ onClose, defaultEngine, isPopup = false }: WebSearchPaletteProps) => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])

  const handleQueryChange = useCallback((query: string) => {
    if (query.trim()) {
      fetchSearchSuggestions(query, defaultEngine)
        .then(setSuggestions)
        .catch((error) => {
          console.error('Error fetching suggestions:', error)
          setSuggestions([])
        })
    } else {
      setSuggestions([])
    }
  }, [defaultEngine])

  const handleSelect = useCallback((suggestion: SearchSuggestion) => {
    try {
      const searchUrl = getSearchUrl(suggestion.name, defaultEngine)
      chrome.runtime.sendMessage({
        type: 'OPEN_TAB',
        url: searchUrl
      })
      onClose()
    } catch (error) {
      console.error('Error sending message to background:', error)
    }
  }, [defaultEngine, onClose])

  const handleDirectSearch = useCallback((searchQuery: string) => {
    try {
      const searchUrl = getSearchUrl(searchQuery, defaultEngine)
      chrome.runtime.sendMessage({
        type: 'OPEN_TAB',
        url: searchUrl
      })
      onClose()
    } catch (error) {
      console.error('Error sending message to background:', error)
    }
  }, [defaultEngine, onClose])

  return (
    <CommandPalette
      items={suggestions}
      onSelect={handleSelect}
      onDirectSearch={handleDirectSearch}
      onQueryChange={handleQueryChange}
      onClose={onClose}
      placeholder={`Search with ${defaultEngine}...`}
      mode="web"
      isPopup={isPopup}
    />
  )
} 