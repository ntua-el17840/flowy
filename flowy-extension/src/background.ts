import hotkeys from 'hotkeys-js'
import { actionService, storageService, initializeSettings } from './lib/db'

// Initialize database and sync
async function initialize() {
  try {
    await initializeSettings()
    await storageService.syncFromStorage()
  } catch (error) {
    console.error('Failed to initialize database:', error)
  }
}

// Initialize hotkeys
hotkeys.filter = () => true // Allow hotkeys in all contexts

// Web search palette shortcut
hotkeys('ctrl+space', (event) => {
  event.preventDefault()
  chrome.runtime.sendMessage({ type: 'OPEN_WEB_SEARCH' })
})

// Tool finder palette shortcut
hotkeys('ctrl+alt+space', (event) => {
  event.preventDefault()
  chrome.runtime.sendMessage({ type: 'OPEN_TOOL_FINDER' })
})

// Listen for messages from popup/options
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_SHORTCUTS':
      actionService.getAll().then(shortcuts => {
        sendResponse({ shortcuts })
      })
      break
    case 'UPDATE_SHORTCUT':
      const { id, updates } = message.payload
      actionService.update(id, updates)
        .then(() => storageService.syncToStorage())
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }))
      break
    case 'CREATE_SHORTCUT':
      actionService.create(message.payload)
        .then(() => storageService.syncToStorage())
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }))
      break
    case 'DELETE_SHORTCUT':
      actionService.delete(message.payload.id)
        .then(() => storageService.syncToStorage())
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }))
      break
  }
  return true // Keep the message channel open for async responses
})

// Initialize when the extension starts
initialize().catch(console.error) 