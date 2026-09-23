/**
 * Prompt Stash - Background Service Worker
 * Manages context menus and background commands for quick prompt capture.
 */

chrome.runtime.onInstalled.addListener(() => {
  // Create context menu item for selected text
  chrome.contextMenus.create({
    id: 'save-to-prompt-stash',
    title: 'Save "%s" to Prompt Stash',
    contexts: ['selection']
  })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'save-to-prompt-stash' && info.selectionText) {
    const text = info.selectionText.trim()
    if (!text) return

    // Store in staged capture buffer
    chrome.storage.local.get(['promptstash_staged_prompt'], (res) => {
      chrome.storage.local.set({
        promptstash_staged_prompt: {
          text: text,
          sourceUrl: tab?.url || '',
          timestamp: Date.now()
        }
      }, () => {
        // Show visual badge on extension icon
        chrome.action.setBadgeText({ text: 'NEW' })
        chrome.action.setBadgeBackgroundColor({ color: '#6366f1' })
      })
    })
  }
})
