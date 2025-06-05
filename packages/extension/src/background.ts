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

// Optional: Keep Chrome commands API as fallback for users who prefer to set them manually
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
    case 'OPEN_POPUP_WITH_TOOL':
      console.log('🔔 Background received OPEN_POPUP_WITH_TOOL message for tool:', message.toolId)
      
      // Store the selected tool ID for the popup to retrieve
      chrome.storage.local.set({ selectedToolId: message.toolId })
        .then(async () => {
          console.log('💾 Tool ID stored in local storage')
          
          try {
            // Try chrome.action.openPopup() without parameters first
            // This lets Chrome automatically handle window selection
            console.log('🚀 Attempting chrome.action.openPopup() without parameters...')
            await chrome.action.openPopup()
            console.log('🎉 SUCCESS! Extension popup opened automatically!')
            
          } catch (error) {
            console.error('❌ chrome.action.openPopup() failed:', error.message)
            
            // Only if the basic API fails, try with current window
            if (error.message.includes('toolbar')) {
              console.log('🔧 Toolbar error detected, trying with current window ID...')
              
              try {
                const currentWindow = await chrome.windows.getCurrent()
                await chrome.action.openPopup({ windowId: currentWindow.id })
                console.log('🎉 SUCCESS! Extension popup opened with current window ID!')
                
              } catch (secondError) {
                console.error('❌ Second attempt failed:', secondError.message)
                console.log('ℹ️ The browser window may not support automatic popup opening.')
                console.log('💡 User can manually click the extension icon to access the selected tool.')
              }
            } else {
              console.error('❌ Unexpected error:', error.message)
            }
          }
        })
        .catch(error => {
          console.error('❌ Failed to store tool ID:', error)
        })
      break
    case 'GET_SELECTED_TOOL':
      // Get and clear the selected tool ID
      chrome.storage.local.get(['selectedToolId']).then(result => {
        if (result.selectedToolId) {
          // Clear it after retrieval so it doesn't persist
          chrome.storage.local.remove(['selectedToolId'])
          sendResponse({ toolId: result.selectedToolId })
        } else {
          sendResponse({ toolId: null })
        }
      })
      break
  }
  return true // Keep the message channel open for async responses
})

// Initialize when the extension starts
initialize().catch(console.error)

console.log('Flowy background script loaded with automatic shortcuts')

export {} 