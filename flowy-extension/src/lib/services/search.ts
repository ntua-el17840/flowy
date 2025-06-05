import { SearchEngine, SearchEngineConfig, SEARCH_ENGINES } from "../../types/settings"

export interface SearchSuggestion {
  id: string
  name: string
}

export async function fetchSearchSuggestions(
  query: string,
  engine: SearchEngine
): Promise<SearchSuggestion[]> {
  const config = SEARCH_ENGINES[engine]
  
  try {
    const response = await fetch(`${config.suggestionUrl}${encodeURIComponent(query)}`)
    const data = await response.json()
    
    switch (engine) {
      case "google":
        return data[1].map((suggestion: string) => ({
          id: suggestion,
          name: suggestion
        }))
      case "duckduckgo":
        return data.map((suggestion: string) => ({
          id: suggestion,
          name: suggestion
        }))
      case "bing":
        return data[1].map((suggestion: string) => ({
          id: suggestion,
          name: suggestion
        }))
      default:
        return []
    }
  } catch (error) {
    console.error(`Error fetching suggestions from ${engine}:`, error)
    return []
  }
}

export function getSearchUrl(query: string, engine: SearchEngine): string {
  const config = SEARCH_ENGINES[engine]
  return `${config.searchUrl}?q=${encodeURIComponent(query)}`
} 