import { SearchEngine, SearchEngineConfig, SEARCH_ENGINES } from "../../types/settings"

export interface SearchSuggestion {
  id: string
  name: string
}

export async function fetchSearchSuggestions(
  query: string,
  engine: SearchEngine
): Promise<SearchSuggestion[]> {
  // For now, disable external API calls and provide local suggestions
  // This prevents CORS errors while maintaining functionality
  if (query.trim().length < 2) {
    return []
  }
  
  // Generate some basic query suggestions locally
  const localSuggestions = generateLocalSuggestions(query, engine)
  
  // Uncomment this section when CORS issues are resolved
  /*
  const config = SEARCH_ENGINES[engine]
  
  try {
    const url = `${config.suggestionUrl}${encodeURIComponent(query)}`
    
    // Create fetch options with headers if available
    const fetchOptions: RequestInit = {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...config.headers
      }
    }
    
    const response = await fetch(url, fetchOptions)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    switch (engine) {
      case "google":
        // Google Firefox API returns [query, [suggestions], [], { "google:suggestrelevance": [...] }]
        return (data[1] || []).map((suggestion: string, index: number) => ({
          id: `${suggestion}-${index}`,
          name: suggestion
        }))
      case "duckduckgo":
        // DuckDuckGo returns [{phrase: "suggestion"}]
        return (data || []).map((item: any, index: number) => ({
          id: `${item.phrase}-${index}`,
          name: item.phrase
        }))
      case "bing":
        // Bing returns [query, [suggestions]]
        return (data[1] || []).map((suggestion: string, index: number) => ({
          id: `${suggestion}-${index}`,
          name: suggestion
        }))
      default:
        return []
    }
  } catch (error) {
    console.error(`Error fetching suggestions from ${engine}:`, error)
    return localSuggestions
  }
  */
  
  return localSuggestions
}

function generateLocalSuggestions(query: string, engine: SearchEngine): SearchSuggestion[] {
  const suggestions: SearchSuggestion[] = []
  
  // Add the original query as the first suggestion
  suggestions.push({
    id: `${query}-original`,
    name: query
  })
  
  // Add some basic variations
  if (query.length > 3) {
    suggestions.push({
      id: `${query}-what`,
      name: `what is ${query}`
    })
    
    suggestions.push({
      id: `${query}-how`,
      name: `how to ${query}`
    })
    
    if (engine === 'google') {
      suggestions.push({
        id: `${query}-tutorial`,
        name: `${query} tutorial`
      })
    }
  }
  
  return suggestions.slice(0, 4) // Limit to 4 suggestions
}

export function getSearchUrl(query: string, engine: SearchEngine): string {
  const config = SEARCH_ENGINES[engine]
  return `${config.searchUrl}?q=${encodeURIComponent(query)}`
} 