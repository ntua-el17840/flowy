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
  
  // Load saved position or calculate center position
  const getInitialPosition = async () => {
    if (isPopup) return { x: 0, y: 0 }
    
    try {
      // Use different storage keys for different palette modes
      const storageKey = mode === 'tool' ? 'flowyToolPalettePosition' : 'flowyWebPalettePosition'
      const result = await chrome.storage.local.get([storageKey])
      if (result[storageKey]) {
        // Validate saved position - ensure entire palette + margin stays within viewport
        const { x, y } = result[storageKey]
        const margin = 20
        const estimatedWidth = 600
        const estimatedHeight = 400
        
        if (x >= margin && 
            x <= window.innerWidth - estimatedWidth - margin && 
            y >= margin && 
            y <= window.innerHeight - estimatedHeight - margin) {
          return { x, y }
        }
      }
    } catch (error) {
      console.log('Could not load saved position:', error)
    }
    
    // Fallback to center
    const centerX = Math.max(20, (window.innerWidth - 600) / 2)
    const centerY = Math.max(20, (window.innerHeight - 400) / 2)
    return { x: centerX, y: centerY }
  }
  
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [positionLoaded, setPositionLoaded] = useState(isPopup) // Don't show until position is loaded for overlay
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [hasBeenDragged, setHasBeenDragged] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const paletteRef = useRef<HTMLDivElement>(null)
  const dragHandleRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  // Load initial position
  useEffect(() => {
    if (!isPopup) {
      getInitialPosition().then((pos) => {
        setPosition(pos)
        setPositionLoaded(true)
      })
    }
  }, [isPopup])

  // Save position when dragging ends
  const savePosition = useCallback(async (newPosition: { x: number, y: number }) => {
    if (isPopup) return
    try {
      // Use different storage keys for different palette modes
      const storageKey = mode === 'tool' ? 'flowyToolPalettePosition' : 'flowyWebPalettePosition'
      await chrome.storage.local.set({ [storageKey]: newPosition })
    } catch (error) {
      console.log('Could not save position:', error)
    }
  }, [isPopup, mode])

  const fuse = new Fuse(items, {
    keys: ["name"],
    threshold: 0.3,
    includeScore: true
  })

  const results = debouncedQuery
    ? fuse.search(debouncedQuery).map((result) => result.item)
    : items

  // Constrain position to viewport boundaries using actual palette dimensions
  const constrainPosition = useCallback((x: number, y: number) => {
    if (isPopup) return { x, y }

    // Get actual palette dimensions
    const paletteRect = paletteRef.current?.getBoundingClientRect()
    if (!paletteRect) {
      // Fallback to estimated dimensions - keep entire palette + margin inside viewport
      const paletteWidth = 600
      const paletteHeight = 400
      const margin = 20
      
      const constrainedX = Math.max(
        margin,
        Math.min(x, window.innerWidth - paletteWidth - margin)
      )
      const constrainedY = Math.max(
        margin,
        Math.min(y, window.innerHeight - paletteHeight - margin)
      )
      
      return { x: constrainedX, y: constrainedY }
    }

    // Use actual dimensions - keep entire palette + margin inside viewport
    const margin = 20
    const paletteWidth = paletteRect.width
    const paletteHeight = paletteRect.height
    
    const constrainedX = Math.max(
      margin,
      Math.min(x, window.innerWidth - paletteWidth - margin)
    )
    const constrainedY = Math.max(
      margin,
      Math.min(y, window.innerHeight - paletteHeight - margin)
    )

    return { x: constrainedX, y: constrainedY }
  }, [isPopup])

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

  // Handle click outside to close (only for full overlay version)
  useEffect(() => {
    if (isPopup) return

    const handleClickOutside = (e: MouseEvent) => {
      // Don't close if we're dragging or just finished dragging
      if (isDragging) return
      
      if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    // Add a small delay to prevent immediate closing after drag ends
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose, isPopup, isDragging])

  // Handle dragging functionality (only for full overlay version)
  useEffect(() => {
    if (isPopup) return

    let finalPosition = position

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x
        const newY = e.clientY - dragOffset.y
        const constrainedPos = constrainPosition(newX, newY)
        finalPosition = constrainedPos
        setPosition(constrainedPos)
      }
    }

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
        setHasBeenDragged(true)
        // Save the final position immediately
        savePosition(finalPosition)
      }
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset, constrainPosition, position, savePosition])

  const handleDragStart = (e: React.MouseEvent) => {
    if (isPopup) return

    e.preventDefault()
    e.stopPropagation()

    // Get current palette position relative to viewport
    const paletteRect = paletteRef.current?.getBoundingClientRect()
    
    if (paletteRect) {
      // Calculate offset from mouse to top-left of palette (more precise)
      const offsetX = e.clientX - paletteRect.left
      const offsetY = e.clientY - paletteRect.top
      
      setDragOffset({ x: offsetX, y: offsetY })
      setIsDragging(true)
    }
  }

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
          ) : null}
        </div>
      </div>
    )
  }

  // Full overlay version - for content script
  // Don't render until position is loaded to prevent flicker
  if (!positionLoaded) {
    return null
  }

  return (
    <div 
      className="fixed inset-0 z-50"
      style={{ 
        pointerEvents: 'auto',
        backgroundColor: 'rgba(15, 23, 42, 0.2)'
      }}
    >
      <div 
        ref={paletteRef}
        className="w-full max-w-2xl flex" 
        style={{
          backgroundColor: '#1e293b',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          border: '1px solid #334155',
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : 'default',
          position: 'absolute',
          top: 0,
          left: 0,
          minWidth: '520px',
          maxWidth: '600px'
        }}
      >
        {/* Left Drag Handle */}
        <div 
          ref={dragHandleRef}
          onMouseDown={handleDragStart}
          className="flex items-center justify-center px-2 cursor-grab hover:bg-slate-700 rounded-l-xl transition-colors"
          style={{ 
            borderRight: '1px solid #334155',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            backgroundColor: isDragging ? '#475569' : 'transparent',
            minWidth: '32px'
          }}
        >
          {/* 6-dot drag icon - rotated for vertical layout */}
          <svg 
            width="12" 
            height="20" 
            viewBox="0 0 12 20" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Left column */}
            <circle cx="3" cy="4" r="2" fill="#94a3b8" />
            <circle cx="3" cy="10" r="2" fill="#94a3b8" />
            <circle cx="3" cy="16" r="2" fill="#94a3b8" />
            {/* Right column */}
            <circle cx="9" cy="4" r="2" fill="#94a3b8" />
            <circle cx="9" cy="10" r="2" fill="#94a3b8" />
            <circle cx="9" cy="16" r="2" fill="#94a3b8" />
          </svg>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="p-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              autoFocus
              tabIndex={1}
              className="w-full px-3 py-2 text-lg border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                backgroundColor: '#374151',
                color: '#f1f5f9',
                fontSize: '16px',
                fontWeight: '400'
              }}
            />
          </div>
          
          {results.length > 0 ? (
            results.map((item, index) => (
              <div
                key={item.id}
                className="px-3 py-1.5 cursor-pointer transition-colors duration-150"
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
            <div className="px-3 py-1.5" style={{ color: '#64748b', fontSize: '14px' }}>
              Press Enter to search for "{query}"
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
} 