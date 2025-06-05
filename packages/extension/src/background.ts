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

// Send message to active tab
async function sendMessageToActiveTab(message: any) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) {
      await chrome.tabs.sendMessage(tab.id, message)
    }
  } catch (error) {
    console.error('Failed to send message to active tab:', error)
  }
}

// Listen for command shortcuts
if (chrome.commands && chrome.commands.onCommand) {
  chrome.commands.onCommand.addListener((command) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        if (command === "open-web-search") {
          chrome.tabs.sendMessage(tabs[0].id, { type: "OPEN_WEB_SEARCH" })
        } else if (command === "open-tool-finder") {
          chrome.tabs.sendMessage(tabs[0].id, { type: "OPEN_TOOL_FINDER" })
        }
      }
    })
  })
}

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
        .catch(error => sendResponse({ success: false, error: error.message }))
      break
    case 'DELETE_SHORTCUT':
      actionService.delete(message.payload.id)
        .then(() => storageService.syncToStorage())
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }))
      break
    case 'OPEN_TAB':
      chrome.tabs.create({ url: message.url })
      break
  }
  return true // Keep the message channel open for async responses
})

// Initialize when the extension starts
initialize().catch(console.error)

console.log('Background script loaded')

export {} 