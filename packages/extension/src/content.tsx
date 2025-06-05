import React, { useEffect, useState, useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import { WebSearchPalette } from './components/WebSearchPalette'
import { ToolFinderPalette } from './components/ToolFinderPalette'
import type { Action } from './types/action'
import { db } from './lib/db'
import './styles.css'

const ContentApp = () => {
  const [palette, setPalette] = useState<null | 'web' | 'tool'>(null)
  const [actions, setActions] = useState<Action[]>([])
  const [defaultEngine, setDefaultEngine] = useState('google')

  console.log('ContentApp rendering with palette:', palette)

  useEffect(() => {
    // Load actions for tool finder with error handling
    db.actions.toArray().then(setActions).catch((error) => {
      console.error('Error loading actions:', error)
    })
    
    // Load default search engine with error handling
    try {
      chrome.storage.sync.get(['settings'], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Storage error:', chrome.runtime.lastError)
          return
        }
        setDefaultEngine(result.settings?.defaultSearchEngine || 'google')
      })
    } catch (error) {
      console.error('Error accessing storage:', error)
    }
  }, [])

  // Global keyboard event handler for shortcuts
  useEffect(() => {
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      // Skip if we're in an input field, textarea, or contenteditable element
      const target = e.target as HTMLElement
      if (target && (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.contentEditable === 'true' ||
        target.closest('[contenteditable="true"]')
      )) {
        // Allow shortcuts in search input fields
        const isSearchInput = target.type === 'search' || 
                             target.placeholder?.toLowerCase().includes('search') ||
                             target.id?.toLowerCase().includes('search') ||
                             target.className?.toLowerCase().includes('search')
        
        if (!isSearchInput) {
          return
        }
      }

      // Ctrl+Space for web search
      if (e.ctrlKey && e.code === 'Space' && !e.shiftKey && !e.altKey && !e.metaKey) {
        e.preventDefault()
        e.stopPropagation()
        console.log('Ctrl+Space detected - opening web search')
        setPalette('web')
        return
      }
      
      // Ctrl+Shift+Space for tool finder
      if (e.ctrlKey && e.shiftKey && e.code === 'Space' && !e.altKey && !e.metaKey) {
        e.preventDefault()
        e.stopPropagation()
        console.log('Ctrl+Shift+Space detected - opening tool finder')
        setPalette('tool')
        return
      }
    }

    // Add event listener to document with capture=true to catch it early
    document.addEventListener('keydown', handleGlobalKeydown, true)
    
    // Also listen on window for better compatibility with special pages
    window.addEventListener('keydown', handleGlobalKeydown, true)
    
    return () => {
      document.removeEventListener('keydown', handleGlobalKeydown, true)
      window.removeEventListener('keydown', handleGlobalKeydown, true)
    }
  }, [])

  const handleMessage = useCallback((message: any) => {
    try {
      console.log('Content script received message:', message)
      if (message.type === 'OPEN_WEB_SEARCH') {
        setPalette('web')
      }
      if (message.type === 'OPEN_TOOL_FINDER') {
        setPalette('tool')
      }
    } catch (error) {
      console.error('Error handling message:', error)
    }
  }, [])

  useEffect(() => {
    // Listen for messages from background script with error handling
    try {
      chrome.runtime.onMessage.addListener(handleMessage)
      return () => {
        try {
          chrome.runtime.onMessage.removeListener(handleMessage)
        } catch (error) {
          // Extension context may be invalidated
          console.log('Extension context invalidated during cleanup')
        }
      }
    } catch (error) {
      console.error('Error setting up message listener:', error)
    }
  }, [handleMessage])

  useEffect(() => {
    // Handle escape key globally to close overlay
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && palette) {
        setPalette(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [palette])

  // Update overlay pointer events based on palette state
  useEffect(() => {
    const overlay = document.getElementById('flowy-overlay')
    if (overlay) {
      overlay.style.pointerEvents = palette ? 'auto' : 'none'
      overlay.style.display = palette ? 'block' : 'none'
    }
  }, [palette])

  const handleClose = useCallback(() => {
    setPalette(null)
  }, [])

  if (!palette) return null

  return (
    <>
      {palette === 'web' && (
        <WebSearchPalette
          onClose={handleClose}
          defaultEngine={defaultEngine}
        />
      )}
      {palette === 'tool' && (
        <ToolFinderPalette
          onClose={handleClose}
          actions={actions}
        />
      )}
    </>
  )
}

// Function to safely create and inject the overlay
const initializeFlowyOverlay = () => {
  try {
    // Check if overlay already exists
    if (document.getElementById('flowy-overlay')) {
      console.log('Flowy overlay already exists')
      return
    }

    // Create overlay container
    const overlay = document.createElement('div')
    overlay.id = 'flowy-overlay'
    overlay.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 2147483647 !important;
      pointer-events: none !important;
      display: none !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    `

    // Try to inject into the best possible location
    const targetElement = document.documentElement || document.body || document.head
    if (targetElement) {
      targetElement.appendChild(overlay)
      
      // Create React root and render
      const root = createRoot(overlay)
      try {
        root.render(<ContentApp />)
      } catch (error) {
        console.error('Error rendering ContentApp:', error)
      }
      
      console.log('Flowy content script loaded with global keyboard shortcuts on:', window.location.href)
    } else {
      console.warn('Could not find suitable element to inject Flowy overlay')
    }
  } catch (error) {
    console.error('Error initializing Flowy overlay:', error)
  }
}

// Initialize when DOM is ready or immediately if already ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFlowyOverlay)
} else {
  // Use setTimeout to avoid blocking the main thread
  setTimeout(initializeFlowyOverlay, 0)
}

// Also try to initialize after a short delay to catch dynamic content
setTimeout(initializeFlowyOverlay, 1000)

export {} 