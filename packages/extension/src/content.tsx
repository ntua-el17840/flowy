import React, { useEffect, useState, useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import { WebSearchPalette } from './components/WebSearchPalette'
import { ToolFinderPalette } from './components/ToolFinderPalette'
import { Action } from './types/action'
import { db } from './lib/db'
import './styles.css'

const ContentApp = () => {
  const [palette, setPalette] = useState<null | 'web' | 'tool'>(null)
  const [actions, setActions] = useState<Action[]>([])
  const [defaultEngine, setDefaultEngine] = useState('google')

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

// Create overlay container with better styling
const createOverlay = () => {
  const overlay = document.createElement('div')
  overlay.id = 'flowy-overlay'
  overlay.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    z-index: 2147483647 !important;
    pointer-events: none !important;
    display: none !important;
    font-family: system-ui, -apple-system, sans-serif !important;
  `
  
  document.body.appendChild(overlay)
  return overlay
}

// Initialize content script
const init = () => {
  // Check if already initialized
  if (document.getElementById('flowy-overlay')) {
    return
  }

  const overlay = createOverlay()
  const root = createRoot(overlay)
  root.render(<ContentApp />)
  
  console.log('Flowy content script initialized')
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}

// Default export for Plasmo
export default ContentApp 