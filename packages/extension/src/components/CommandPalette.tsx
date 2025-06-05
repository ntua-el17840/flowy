import { useEffect, useRef, useState, useCallback } from "react"
import Fuse from "fuse.js"
import { useDebounce } from "../lib/hooks"

interface CommandPaletteProps {
  items?: Array<{ id: string; name: string; [key: string]: any }>
  onSelect: (item: any) => void
  onClose: () => void
  placeholder?: string
  mode?: "web" | "tool"
  onDirectSearch?: (query: string) => void
  onQueryChange?: (query: string) => void
  isPopup?: boolean
}

export const CommandPalette = ({
  items = [],
  onSelect,
  onClose,
  placeholder = "Search...",
  mode = "web",
  onDirectSearch,
  onQueryChange,
  isPopup = false
}: CommandPaletteProps) => {
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  const fuse = new Fuse(items, {
    keys: ["name"],
    threshold: 0.3,
    includeScore: true
  })

  const results = debouncedQuery
    ? fuse.search(debouncedQuery).map((result) => result.item)
    : items

  useEffect(() => {
    // Focus input on mount with improved timing and persistence
    const focusInput = () => {
      if (inputRef.current) {
        inputRef.current.focus()
        // Also select any existing text
        inputRef.current.select()
      }
    }
    
    // Immediate focus
    focusInput()
    
    // Persistent focus attempts to prevent focus stealing
    const intervals = [10, 25, 50, 100, 150, 200, 300]
    const timeouts = intervals.map(delay => 
      setTimeout(focusInput, delay)
    )
    
    // Add focus event listener to re-focus if lost
    const handleFocusLoss = (e: FocusEvent) => {
      // Only intervene if our input exists and the focus went to something else
      if (inputRef.current && 
          e.target !== inputRef.current && 
          document.contains(inputRef.current)) {
        
        // Don't steal focus if it went to another input/textarea/contenteditable
        const target = e.target as HTMLElement
        if (target && (
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.contentEditable === 'true'
        )) {
          return
        }
        
        // Re-focus our input after a short delay
        setTimeout(() => {
          if (inputRef.current && 
              document.activeElement !== inputRef.current &&
              document.contains(inputRef.current)) {
            focusInput()
          }
        }, 10)
      }
    }
    
    // Listen for focus changes on the document
    document.addEventListener('focusin', handleFocusLoss)
    
    return () => {
      timeouts.forEach(clearTimeout)
      document.removeEventListener('focusin', handleFocusLoss)
    }
  }, [])

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [results])

  // Stabilize the onQueryChange callback to prevent infinite re-renders
  const stableOnQueryChange = useCallback((query: string) => {
    if (onQueryChange) {
      onQueryChange(query)
    }
  }, [onQueryChange])

  // Notify parent of query changes - only when debouncedQuery actually changes
  useEffect(() => {
    stableOnQueryChange(debouncedQuery)
  }, [debouncedQuery, stableOnQueryChange])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        if (results.length > 0) {
          setSelectedIndex((prev) => (prev + 1) % results.length)
        }
        break
      case "ArrowUp":
        e.preventDefault()
        if (results.length > 0) {
          setSelectedIndex((prev) => (prev - 1 + results.length) % results.length)
        }
        break
      case "Enter":
        e.preventDefault()
        if (results.length > 0 && results[selectedIndex]) {
          onSelect(results[selectedIndex])
        } else if (query.trim() && onDirectSearch) {
          // Allow direct search with the typed query
          onDirectSearch(query.trim())
        } else if (query.trim() && mode === "web") {
          // Fallback for web search if onDirectSearch not provided
          // Send message to background script to open tab (content scripts can't create tabs)
          try {
            chrome.runtime.sendMessage({
              type: 'OPEN_TAB',
              url: `https://www.google.com/search?q=${encodeURIComponent(query.trim())}`
            })
            onClose()
          } catch (error) {
            console.error('Error sending message to background:', error)
          }
        }
        break
      case "Escape":
        e.preventDefault()
        onClose()
        break
    }
  }

  // Popup version - embedded in popup window
  if (isPopup) {
    return (
      <div className="w-full">
        <div className="mb-4">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus
            tabIndex={1}
            className="w-full px-4 py-3 text-lg border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{
              backgroundColor: '#374151',
              color: '#f1f5f9',
              fontSize: '16px',
              fontWeight: '400'
            }}
          />
        </div>
        <div className="max-h-64 overflow-y-auto rounded-lg" style={{ backgroundColor: '#374151' }}>
          {results.length > 0 ? (
            results.map((item, index) => (
              <div
                key={item.id}
                className="px-4 py-2 cursor-pointer transition-colors duration-150"
                style={{
                  backgroundColor: index === selectedIndex ? '#3b82f6' : 'transparent',
                  color: index === selectedIndex ? '#ffffff' : '#cbd5e1',
                  fontSize: '14px'
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => onSelect(item)}
              >
                {item.name}
              </div>
            ))
          ) : query.trim() && mode === "web" ? (
            <div className="px-4 py-3" style={{ color: '#64748b', fontSize: '14px' }}>
              Press Enter to search for "{query}"
            </div>
          ) : (
            <div className="px-4 py-3" style={{ color: '#64748b', fontSize: '14px' }}>
              {mode === "web" ? "Type to search..." : "No results found"}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Full overlay version - for content script
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ 
        pointerEvents: 'auto',
        backgroundColor: 'rgba(15, 23, 42, 0.95)'
      }}
    >
      <div className="w-full max-w-2xl mx-4" style={{
        backgroundColor: '#1e293b',
        borderRadius: '12px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        border: '1px solid #334155'
      }}>
        <div className="p-6">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus
            tabIndex={1}
            className="w-full px-4 py-3 text-lg border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{
              backgroundColor: '#374151',
              color: '#f1f5f9',
              fontSize: '18px',
              fontWeight: '400'
            }}
          />
        </div>
        <div className="max-h-96 overflow-y-auto" style={{ borderTop: '1px solid #334155' }}>
          {results.length > 0 ? (
            results.map((item, index) => (
              <div
                key={item.id}
                className="px-6 py-3 cursor-pointer transition-colors duration-150"
                style={{
                  backgroundColor: index === selectedIndex ? '#3b82f6' : 'transparent',
                  color: index === selectedIndex ? '#ffffff' : '#cbd5e1',
                  fontSize: '16px'
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => onSelect(item)}
              >
                {item.name}
              </div>
            ))
          ) : query.trim() && mode === "web" ? (
            <div className="px-6 py-4" style={{ color: '#64748b', fontSize: '14px' }}>
              Press Enter to search for "{query}"
            </div>
          ) : (
            <div className="px-6 py-4" style={{ color: '#64748b', fontSize: '14px' }}>
              {mode === "web" ? "Type to search..." : "No results found"}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 