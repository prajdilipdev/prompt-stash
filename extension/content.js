/**
 * Prompt Stash - Content Script
 * Handles inserting prompts directly into active inputs and AI chat interfaces
 * (ChatGPT, Claude, Gemini, Perplexity, Discord, etc.).
 */

(() => {
  // Listen for messages from popup or background service worker
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'INSERT_PROMPT') {
      const success = insertPromptIntoPage(request.text)
      if (success) {
        showFeedbackBadge('✨ Prompt inserted from Prompt Stash')
      }
      sendResponse({ success })
    }
    return true
  })

  function findTargetElement() {
    let active = document.activeElement

    // Check if currently focused element is valid editable
    if (active && (isEditable(active) || active.getAttribute('contenteditable') === 'true')) {
      return active
    }

    // Common AI tools target selectors
    const selectors = [
      // ChatGPT
      '#prompt-textarea',
      'div[contenteditable="true"][id="prompt-textarea"]',
      'textarea[data-id="root"]',
      // Claude.ai
      'div[contenteditable="true"].ProseMirror',
      'div[contenteditable="true"]',
      // Google Gemini
      'rich-textarea div[contenteditable="true"]',
      '.text-input-field textarea',
      // Generic inputs
      'textarea:not([disabled])',
      'div[role="textbox"]',
      'input[type="text"]:not([disabled])'
    ]

    for (const sel of selectors) {
      const el = document.querySelector(sel)
      if (el && isElementVisible(el)) {
        return el
      }
    }

    return null
  }

  function isEditable(el) {
    if (!el) return false
    const tag = el.tagName.toLowerCase()
    return tag === 'textarea' || (tag === 'input' && !['button', 'submit', 'checkbox', 'radio', 'file'].includes(el.type))
  }

  function isElementVisible(el) {
    const rect = el.getBoundingClientRect()
    return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden'
  }

  function insertPromptIntoPage(text) {
    const target = findTargetElement()
    if (!target) {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(text).catch(() => {})
      showFeedbackBadge('📋 Copied to clipboard (click in text box and paste)')
      return false
    }

    target.focus()

    // 1. ContentEditable elements (ChatGPT, Claude, rich editors)
    if (target.isContentEditable || target.getAttribute('contenteditable') === 'true') {
      const selection = window.getSelection()
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        const textNode = document.createTextNode(text)
        range.insertNode(textNode)
        range.setStartAfter(textNode)
        range.setEndAfter(textNode)
        selection.removeAllRanges()
        selection.addRange(range)
      } else {
        target.textContent = (target.textContent || '') + text
      }

      // Fire synthetic events so reactive frameworks (React, ProseMirror) catch the update
      target.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: text }))
      target.dispatchEvent(new Event('change', { bubbles: true }))
      return true
    }

    // 2. Standard Textarea or Input
    if (typeof target.selectionStart === 'number' && typeof target.selectionEnd === 'number') {
      const start = target.selectionStart
      const end = target.selectionEnd
      const val = target.value || ''
      target.value = val.slice(0, start) + text + val.slice(end)
      target.selectionStart = target.selectionEnd = start + text.length
    } else {
      target.value = (target.value || '') + text
    }

    // Dispatch input and change events
    target.dispatchEvent(new Event('input', { bubbles: true }))
    target.dispatchEvent(new Event('change', { bubbles: true }))
    return true
  }

  function showFeedbackBadge(message) {
    const existing = document.getElementById('prompt-stash-toast')
    if (existing) existing.remove()

    const toast = document.createElement('div')
    toast.id = 'prompt-stash-toast'
    toast.textContent = message
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: '9999999',
      backgroundColor: '#161928',
      color: '#f8fafc',
      border: '1px solid rgba(99, 102, 241, 0.4)',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(99, 102, 241, 0.25)',
      padding: '10px 16px',
      borderRadius: '8px',
      fontSize: '13px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontWeight: '500',
      opacity: '0',
      transform: 'translateY(8px)',
      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      pointerEvents: 'none'
    })

    document.body.appendChild(toast)

    requestAnimationFrame(() => {
      toast.style.opacity = '1'
      toast.style.transform = 'translateY(0)'
    })

    setTimeout(() => {
      toast.style.opacity = '0'
      toast.style.transform = 'translateY(8px)'
      setTimeout(() => toast.remove(), 300)
    }, 2400)
  }
})()
