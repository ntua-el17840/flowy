export type SearchEngine = "google" | "duckduckgo" | "bing"

export interface SearchEngineConfig {
  id: SearchEngine
  name: string
  searchUrl: string
  suggestionUrl: string
  headers?: Record<string, string>
}

export const SEARCH_ENGINES: Record<SearchEngine, SearchEngineConfig> = {
  google: {
    id: "google",
    name: "Google",
    searchUrl: "https://www.google.com/search",
    suggestionUrl: "https://clients1.google.com/complete/search?client=firefox&q="
  },
  duckduckgo: {
    id: "duckduckgo",
    name: "DuckDuckGo",
    searchUrl: "https://duckduckgo.com/",
    suggestionUrl: "https://ac.duckduckgo.com/ac/?q=",
    headers: {
      'Accept': 'application/json'
    }
  },
  bing: {
    id: "bing",
    name: "Bing",
    searchUrl: "https://www.bing.com/search",
    suggestionUrl: "https://api.bing.com/osjson.aspx?query="
  }
}

export interface Settings {
  defaultSearchEngine: SearchEngine
  recentColors: string[]
  lastUsedTool: string
} 