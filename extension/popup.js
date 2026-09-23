/**
 * Prompt Stash - Chrome Extension Popup Logic
 * Supports Supabase Auth, Live Multi-Token Search, One-Click Copy,
 * Dynamic Variable Substitution, In-Page Tab Insertion, and Quick Prompt Saving.
 */

const DEFAULT_CONFIG = {
  supabaseUrl: 'https://yympelyhebrcfbuunitr.supabase.co',
  supabaseKey: 'sb_publishable_4ajrjJBrvAaVzNVAOuY5sw_qZt44iSa',
  webappUrl: 'http://localhost:5173'
}

let appConfig = { ...DEFAULT_CONFIG }
let currentSession = null
let allPrompts = []
let activeFilter = 'all'
let selectedTag = null
let recentCopiedIds = []
let authMode = 'signin' // 'signin' or 'signup'

// DOM Elements
const views = {
  auth: document.getElementById('view-auth'),
  main: document.getElementById('view-main'),
  create: document.getElementById('view-create'),
  settings: document.getElementById('view-settings')
}

// -------------------------------------------------------------
// Initialization
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  await loadConfiguration()
  setupEventListeners()
  await checkSession()
  checkStagedPrompt()
})

async function loadConfiguration() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['promptstash_config', 'promptstash_recent_copied'], (res) => {
      if (res.promptstash_config) {
        appConfig = { ...DEFAULT_CONFIG, ...res.promptstash_config }
      }
      if (res.promptstash_recent_copied) {
        recentCopiedIds = res.promptstash_recent_copied
      }
      // Update link to web app
      const webappLink = document.getElementById('link-open-webapp')
      if (webappLink) webappLink.href = appConfig.webappUrl
      resolve()
    })
  })
}

function showView(viewName) {
  Object.keys(views).forEach((key) => {
    if (views[key]) {
      if (key === viewName) {
        views[key].classList.remove('hidden')
      } else {
        views[key].classList.add('hidden')
      }
    }
  })
}

// -------------------------------------------------------------
// Authentication
// -------------------------------------------------------------
async function checkSession() {
  chrome.storage.local.get(['promptstash_session', 'promptstash_cached_prompts'], async (res) => {
    if (res.promptstash_session && res.promptstash_session.access_token) {
      currentSession = res.promptstash_session
      
      // If we have cached prompts, render them immediately for 0-latency UI
      if (res.promptstash_cached_prompts) {
        allPrompts = res.promptstash_cached_prompts
        renderPromptList()
      }

      showView('main')
      updateUserUI()

      // Verify token in background
      const valid = await verifyOrRefreshToken()
      if (valid) {
        fetchPrompts()
      } else {
        showView('auth')
      }
    } else {
      showView('auth')
    }
  })
}

async function verifyOrRefreshToken() {
  if (!currentSession || !currentSession.access_token) return false

  try {
    const res = await fetch(`${appConfig.supabaseUrl}/auth/v1/user`, {
      headers: {
        'apikey': appConfig.supabaseKey,
        'Authorization': `Bearer ${currentSession.access_token}`
      }
    })

    if (res.ok) {
      const user = await res.json()
      currentSession.user = user
      saveSession(currentSession)
      return true
    }

    // Try refresh token if expired
    if (currentSession.refresh_token) {
      const refreshRes = await fetch(`${appConfig.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
          'apikey': appConfig.supabaseKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: currentSession.refresh_token })
      })

      if (refreshRes.ok) {
        const data = await refreshRes.json()
        currentSession = {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          user: data.user
        }
        saveSession(currentSession)
        return true
      }
    }
  } catch (err) {
    console.error('Session verify error:', err)
  }

  // Session invalid
  clearSession()
  return false
}

function saveSession(session) {
  chrome.storage.local.set({ promptstash_session: session })
}

function clearSession() {
  currentSession = null
  chrome.storage.local.remove(['promptstash_session', 'promptstash_cached_prompts'])
}

function updateUserUI() {
  const badge = document.getElementById('user-email-badge')
  if (badge && currentSession?.user?.email) {
    badge.textContent = currentSession.user.email.split('@')[0]
    badge.title = currentSession.user.email
  }
}

// -------------------------------------------------------------
// Prompts Data Fetching
// -------------------------------------------------------------
async function fetchPrompts() {
  if (!currentSession?.access_token) return

  try {
    const url = `${appConfig.supabaseUrl}/rest/v1/prompts?select=id,title,description,content,notes,is_favorite,updated_at,prompt_tags(tag_id,tags(id,name))&deleted_at=is.null&archived_at=is.null&order=updated_at.desc`
    const res = await fetch(url, {
      headers: {
        'apikey': appConfig.supabaseKey,
        'Authorization': `Bearer ${currentSession.access_token}`
      }
    })

    if (res.ok) {
      const data = await res.json()
      allPrompts = data.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        content: row.content,
        notes: row.notes || '',
        isFavorite: row.is_favorite,
        updatedAt: row.updated_at,
        tags: (row.prompt_tags || [])
          .map((pt) => pt.tags)
          .filter(Boolean)
          .map((t) => t.name)
      }))

      // Cache prompts locally
      chrome.storage.local.set({ promptstash_cached_prompts: allPrompts })
      renderPromptList()
      renderTagsBar()
    }
  } catch (err) {
    console.error('Error fetching prompts:', err)
  }
}

// -------------------------------------------------------------
// Multi-Token Search & Filtering
// -------------------------------------------------------------
function getFilteredPrompts() {
  let list = [...allPrompts]

  // Filter tab
  if (activeFilter === 'favorites') {
    list = list.filter((p) => p.isFavorite)
  } else if (activeFilter === 'recent') {
    list = list.filter((p) => recentCopiedIds.includes(p.id))
    list.sort((a, b) => recentCopiedIds.indexOf(a.id) - recentCopiedIds.indexOf(b.id))
  }

  // Tag filter
  if (selectedTag) {
    list = list.filter((p) => p.tags.includes(selectedTag))
  }

  // Search query (Multi-token match)
  const searchInput = document.getElementById('search-input')
  const query = searchInput?.value?.trim().toLowerCase() || ''

  if (query) {
    const tokens = query.split(/\s+/).filter(Boolean)
    list = list.filter((p) => {
      const searchTarget = `${p.title} ${p.description} ${p.content} ${p.tags.join(' ')}`.toLowerCase()
      // All tokens must be matched
      return tokens.every((token) => searchTarget.includes(token))
    })

    // Rank title matches higher
    list.sort((a, b) => {
      const aTitle = a.title.toLowerCase()
      const bTitle = b.title.toLowerCase()
      if (aTitle.includes(query) && !bTitle.includes(query)) return -1
      if (!aTitle.includes(query) && bTitle.includes(query)) return 1
      return 0
    })
  }

  return list
}

// -------------------------------------------------------------
// Rendering
// -------------------------------------------------------------
function renderPromptList() {
  const container = document.getElementById('prompt-list')
  if (!container) return

  const filtered = getFilteredPrompts()

  // Update counts
  const countAll = document.getElementById('count-all')
  const countFav = document.getElementById('count-fav')
  if (countAll) countAll.textContent = allPrompts.length
  if (countFav) countFav.textContent = allPrompts.filter((p) => p.isFavorite).length

  if (filtered.length === 0) {
    const query = document.getElementById('search-input')?.value?.trim()
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${query ? '🔍' : activeFilter === 'favorites' ? '★' : '📦'}</div>
        <div class="empty-title">${query ? 'No matching prompts' : activeFilter === 'favorites' ? 'No favorites yet' : 'Your stash is empty'}</div>
        <div class="empty-desc">${query ? `Try a different keyword or check your tags` : `Click "+ New" above to save your first prompt.`}</div>
      </div>
    `
    return
  }

  container.innerHTML = ''
  filtered.forEach((prompt) => {
    const card = document.createElement('div')
    card.className = 'prompt-card'
    card.dataset.id = prompt.id

    const vars = extractVariables(prompt.content)
    const hasVars = vars.length > 0

    card.innerHTML = `
      <div class="card-top">
        <div class="card-title-row">
          <button class="btn-star ${prompt.isFavorite ? 'starred' : ''}" title="${prompt.isFavorite ? 'Unfavorite' : 'Favorite'}" data-action="star">★</button>
          <span class="card-title">${escapeHtml(prompt.title)}</span>
        </div>
      </div>

      <div class="card-meta">
        ${prompt.tags.map((t) => `<span class="card-tag">#${escapeHtml(t)}</span>`).join('')}
        ${hasVars ? `<span class="vars-badge">{{${vars.length}}} vars</span>` : ''}
      </div>

      <div class="card-preview">${escapeHtml(prompt.content)}</div>

      <div class="card-actions">
        ${hasVars ? `<button class="action-btn fill" data-action="fill" title="Fill variables and copy">⚡ Fill & Copy</button>` : ''}
        <button class="action-btn" data-action="insert" title="Insert into active tab text field">↗ Insert</button>
        <button class="action-btn primary" data-action="copy" title="Copy prompt to clipboard">📋 Copy</button>
      </div>

      <div class="var-expander hidden" data-var-panel></div>
    `

    // Card Action Events
    const copyBtn = card.querySelector('[data-action="copy"]')
    copyBtn.addEventListener('click', () => copyToClipboard(prompt.content, copyBtn, prompt.id))

    const insertBtn = card.querySelector('[data-action="insert"]')
    insertBtn.addEventListener('click', () => insertIntoActiveTab(prompt.content, insertBtn))

    const starBtn = card.querySelector('[data-action="star"]')
    starBtn.addEventListener('click', () => toggleFavorite(prompt.id, !prompt.isFavorite))

    if (hasVars) {
      const fillBtn = card.querySelector('[data-action="fill"]')
      const varPanel = card.querySelector('[data-var-panel]')
      fillBtn.addEventListener('click', () => toggleVarPanel(prompt, varPanel, fillBtn))
    }

    container.appendChild(card)
  })
}

function renderTagsBar() {
  const bar = document.getElementById('tags-bar')
  if (!bar) return

  // Collect unique tags
  const tagsSet = new Set()
  allPrompts.forEach((p) => p.tags.forEach((t) => tagsSet.add(t)))
  const tags = Array.from(tagsSet).sort()

  if (tags.length === 0) {
    bar.classList.add('hidden')
    return
  }

  bar.classList.remove('hidden')
  bar.innerHTML = ''

  tags.forEach((tag) => {
    const chip = document.createElement('button')
    chip.type = 'button'
    chip.className = `tag-chip ${selectedTag === tag ? 'active' : ''}`
    chip.textContent = `#${tag}`
    chip.addEventListener('click', () => {
      selectedTag = selectedTag === tag ? null : tag
      renderTagsBar()
      renderPromptList()
    })
    bar.appendChild(chip)
  })
}

// -------------------------------------------------------------
// Variable Expander Logic
// -------------------------------------------------------------
function extractVariables(content) {
  const matches = content.match(/\{\{([a-zA-Z0-9_ -]+)\}\}/g)
  if (!matches) return []
  return Array.from(new Set(matches.map((m) => m.slice(2, -2).trim())))
}

function toggleVarPanel(prompt, panel, triggerBtn) {
  if (!panel.classList.contains('hidden')) {
    panel.classList.add('hidden')
    return
  }

  const vars = extractVariables(prompt.content)
  panel.classList.remove('hidden')
  panel.innerHTML = `
    <div style="font-size:11px; font-weight:600; color:var(--text-muted); margin-bottom:2px;">Fill prompt variables:</div>
    ${vars.map((v) => `
      <div class="var-input-row">
        <label class="var-label">{{${escapeHtml(v)}}}</label>
        <input type="text" class="var-field" data-var="${escapeHtml(v)}" placeholder="Value for ${escapeHtml(v)}...">
      </div>
    `).join('')}
    <div class="var-actions">
      <button type="button" class="btn btn-xs btn-secondary" data-var-cancel>Close</button>
      <button type="button" class="btn btn-xs btn-primary" data-var-copy>📋 Copy Substituted</button>
    </div>
  `

  panel.querySelector('[data-var-cancel]').addEventListener('click', () => panel.classList.add('hidden'))
  
  const varCopyBtn = panel.querySelector('[data-var-copy]')
  varCopyBtn.addEventListener('click', () => {
    let resolved = prompt.content
    panel.querySelectorAll('.var-field').forEach((input) => {
      const vName = input.dataset.var
      const val = input.value || `{{${vName}}}`
      const reg = new RegExp(`\\{\\{\\s*${escapeRegExp(vName)}\\s*\\}\\}`, 'g')
      resolved = resolved.replace(reg, val)
    })
    copyToClipboard(resolved, varCopyBtn, prompt.id)
  })

  // Auto focus first variable input
  const firstInput = panel.querySelector('.var-field')
  if (firstInput) firstInput.focus()
}

// -------------------------------------------------------------
// Clipboard & Active Tab Actions
// -------------------------------------------------------------
function copyToClipboard(text, btnElement, promptId) {
  navigator.clipboard.writeText(text).then(() => {
    // Save to recent copied
    if (promptId) {
      recentCopiedIds = [promptId, ...recentCopiedIds.filter((id) => id !== promptId)].slice(0, 30)
      chrome.storage.local.set({ promptstash_recent_copied: recentCopiedIds })
    }

    if (btnElement) {
      const originalText = btnElement.innerHTML
      btnElement.classList.add('copied')
      btnElement.innerHTML = '✓ Copied!'
      setTimeout(() => {
        btnElement.classList.remove('copied')
        btnElement.innerHTML = originalText
      }, 1800)
    }
  }).catch((err) => {
    console.error('Clipboard copy failed:', err)
  })
}

async function insertIntoActiveTab(text, btnElement) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) return
    const activeTab = tabs[0]

    chrome.tabs.sendMessage(activeTab.id, { action: 'INSERT_PROMPT', text: text }, (response) => {
      if (chrome.runtime.lastError || !response?.success) {
        // Fallback: Copy to clipboard and notify
        copyToClipboard(text, btnElement)
      } else {
        if (btnElement) {
          const orig = btnElement.innerHTML
          btnElement.classList.add('copied')
          btnElement.innerHTML = '✓ Inserted!'
          setTimeout(() => {
            btnElement.classList.remove('copied')
            btnElement.innerHTML = orig
          }, 1800)
        }
      }
    })
  })
}

async function toggleFavorite(promptId, newStatus) {
  if (!currentSession?.access_token) return

  // Optimistic UI update
  const p = allPrompts.find((item) => item.id === promptId)
  if (p) {
    p.isFavorite = newStatus
    renderPromptList()
  }

  try {
    await fetch(`${appConfig.supabaseUrl}/rest/v1/prompts?id=eq.${promptId}`, {
      method: 'PATCH',
      headers: {
        'apikey': appConfig.supabaseKey,
        'Authorization': `Bearer ${currentSession.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ is_favorite: newStatus })
    })
    chrome.storage.local.set({ promptstash_cached_prompts: allPrompts })
  } catch (err) {
    console.error('Failed to toggle favorite:', err)
  }
}

// -------------------------------------------------------------
// Staged Prompt Handling (Context Menu Capture)
// -------------------------------------------------------------
function checkStagedPrompt() {
  chrome.storage.local.get(['promptstash_staged_prompt'], (res) => {
    const banner = document.getElementById('staged-prompt-banner')
    if (res.promptstash_staged_prompt && res.promptstash_staged_prompt.text) {
      if (banner) banner.classList.remove('hidden')
      chrome.action.setBadgeText({ text: '' })
    } else {
      if (banner) banner.classList.add('hidden')
    }
  })
}

// -------------------------------------------------------------
// Event Listeners Setup
// -------------------------------------------------------------
function setupEventListeners() {
  // Auth Form & Tabs
  const authTabSignin = document.getElementById('auth-tab-signin')
  const authTabSignup = document.getElementById('auth-tab-signup')
  const authSubmitBtn = document.getElementById('auth-submit-btn')
  const authForm = document.getElementById('auth-form')

  authTabSignin?.addEventListener('click', () => {
    authMode = 'signin'
    authTabSignin.classList.add('active')
    authTabSignup?.classList.remove('active')
    if (authSubmitBtn) authSubmitBtn.querySelector('.btn-text').textContent = 'Sign In'
    hideAuthMessages()
  })

  authTabSignup?.addEventListener('click', () => {
    authMode = 'signup'
    authTabSignup.classList.add('active')
    authTabSignin?.classList.remove('active')
    if (authSubmitBtn) authSubmitBtn.querySelector('.btn-text').textContent = 'Create Account'
    hideAuthMessages()
  })

  authForm?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = document.getElementById('auth-email').value.trim()
    const password = document.getElementById('auth-password').value
    if (!email || !password) return

    setLoading(authSubmitBtn, true)
    hideAuthMessages()

    try {
      if (authMode === 'signin') {
        const res = await fetch(`${appConfig.supabaseUrl}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'apikey': appConfig.supabaseKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        })

        const data = await res.json()
        if (res.ok && data.access_token) {
          currentSession = {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            user: data.user
          }
          saveSession(currentSession)
          showView('main')
          updateUserUI()
          fetchPrompts()
        } else {
          showAuthError(data.error_description || data.msg || 'Invalid login credentials')
        }
      } else {
        const res = await fetch(`${appConfig.supabaseUrl}/auth/v1/signup`, {
          method: 'POST',
          headers: {
            'apikey': appConfig.supabaseKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        })

        const data = await res.json()
        if (res.ok) {
          if (data.session) {
            currentSession = {
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              user: data.user
            }
            saveSession(currentSession)
            showView('main')
            updateUserUI()
            fetchPrompts()
          } else {
            showAuthSuccess('Account created! Please check your email to confirm.')
          }
        } else {
          showAuthError(data.msg || data.error_description || 'Signup failed')
        }
      }
    } catch (err) {
      showAuthError('Connection error. Check your Supabase settings.')
    } finally {
      setLoading(authSubmitBtn, false)
    }
  })

  // Navigation Buttons
  document.getElementById('btn-nav-logout')?.addEventListener('click', () => {
    clearSession()
    showView('auth')
  })

  document.getElementById('btn-nav-create')?.addEventListener('click', () => {
    showView('create')
    document.getElementById('create-title')?.focus()
  })

  document.getElementById('btn-nav-settings')?.addEventListener('click', () => {
    openSettingsView()
  })

  document.getElementById('btn-open-settings-from-auth')?.addEventListener('click', () => {
    openSettingsView()
  })

  document.getElementById('btn-back-from-create')?.addEventListener('click', () => showView('main'))
  document.getElementById('btn-cancel-create')?.addEventListener('click', () => showView('main'))
  document.getElementById('btn-back-from-settings')?.addEventListener('click', () => {
    showView(currentSession ? 'main' : 'auth')
  })

  // Search input
  const searchInput = document.getElementById('search-input')
  const searchClear = document.getElementById('search-clear-btn')

  searchInput?.addEventListener('input', () => {
    if (searchClear) {
      if (searchInput.value.length > 0) {
        searchClear.classList.remove('hidden')
      } else {
        searchClear.classList.add('hidden')
      }
    }
    renderPromptList()
  })

  searchClear?.addEventListener('click', () => {
    if (searchInput) {
      searchInput.value = ''
      searchClear.classList.add('hidden')
      searchInput.focus()
      renderPromptList()
    }
  })

  // Filter Tabs
  document.querySelectorAll('.filter-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach((t) => t.classList.remove('active'))
      tab.classList.add('active')
      activeFilter = tab.dataset.filter || 'all'
      renderPromptList()
    })
  })

  // Staged prompt banner buttons
  document.getElementById('btn-review-staged')?.addEventListener('click', () => {
    chrome.storage.local.get(['promptstash_staged_prompt'], (res) => {
      if (res.promptstash_staged_prompt) {
        showView('create')
        const contentField = document.getElementById('create-content')
        if (contentField) {
          contentField.value = res.promptstash_staged_prompt.text
          updateCreateVarsBadge(res.promptstash_staged_prompt.text)
        }
        chrome.storage.local.remove(['promptstash_staged_prompt'])
        checkStagedPrompt()
      }
    })
  })

  document.getElementById('btn-discard-staged')?.addEventListener('click', () => {
    chrome.storage.local.remove(['promptstash_staged_prompt'])
    checkStagedPrompt()
  })

  // Create prompt form
  const createForm = document.getElementById('create-prompt-form')
  const createContent = document.getElementById('create-content')

  createContent?.addEventListener('input', () => {
    updateCreateVarsBadge(createContent.value)
  })

  createForm?.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (!currentSession?.access_token) return

    const title = document.getElementById('create-title').value.trim()
    const content = document.getElementById('create-content').value.trim()
    const description = document.getElementById('create-desc').value.trim()
    const isFav = document.getElementById('create-fav').checked
    const tagsInput = document.getElementById('create-tags').value.trim()

    const submitBtn = document.getElementById('btn-submit-create')
    setLoading(submitBtn, true)

    try {
      // 1. Insert prompt
      const res = await fetch(`${appConfig.supabaseUrl}/rest/v1/prompts`, {
        method: 'POST',
        headers: {
          'apikey': appConfig.supabaseKey,
          'Authorization': `Bearer ${currentSession.access_token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          title,
          content,
          description,
          is_favorite: isFav,
          user_id: currentSession.user.id
        })
      })

      if (res.ok) {
        createForm.reset()
        updateCreateVarsBadge('')
        showView('main')
        await fetchPrompts()
      } else {
        const err = await res.json()
        const errEl = document.getElementById('create-error')
        if (errEl) {
          errEl.textContent = err.message || 'Failed to save prompt'
          errEl.classList.remove('hidden')
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(submitBtn, false)
    }
  })

  // Settings form
  const settingsForm = document.getElementById('settings-form')
  settingsForm?.addEventListener('submit', (e) => {
    e.preventDefault()
    const newConfig = {
      supabaseUrl: document.getElementById('setting-supabase-url').value.trim(),
      supabaseKey: document.getElementById('setting-supabase-key').value.trim(),
      webappUrl: document.getElementById('setting-webapp-url').value.trim()
    }
    appConfig = newConfig
    chrome.storage.local.set({ promptstash_config: newConfig }, () => {
      const statusEl = document.getElementById('settings-status')
      if (statusEl) {
        statusEl.textContent = 'Settings saved!'
        statusEl.classList.remove('hidden')
        setTimeout(() => statusEl.classList.add('hidden'), 2000)
      }
    })
  })

  document.getElementById('btn-reset-settings')?.addEventListener('click', () => {
    appConfig = { ...DEFAULT_CONFIG }
    chrome.storage.local.remove(['promptstash_config'], () => {
      openSettingsView()
      const statusEl = document.getElementById('settings-status')
      if (statusEl) {
        statusEl.textContent = 'Reset to defaults!'
        statusEl.classList.remove('hidden')
        setTimeout(() => statusEl.classList.add('hidden'), 2000)
      }
    })
  })
}

function openSettingsView() {
  showView('settings')
  document.getElementById('setting-supabase-url').value = appConfig.supabaseUrl
  document.getElementById('setting-supabase-key').value = appConfig.supabaseKey
  document.getElementById('setting-webapp-url').value = appConfig.webappUrl
}

function updateCreateVarsBadge(text) {
  const badge = document.getElementById('create-vars-badge')
  if (!badge) return
  const vars = extractVariables(text)
  if (vars.length > 0) {
    badge.textContent = `{{${vars.length}}} variables`
    badge.classList.remove('hidden')
  } else {
    badge.classList.add('hidden')
  }
}

function setLoading(btn, isLoading) {
  if (!btn) return
  const text = btn.querySelector('.btn-text')
  const spinner = btn.querySelector('.spinner')
  if (isLoading) {
    btn.disabled = true
    if (text) text.classList.add('hidden')
    if (spinner) spinner.classList.remove('hidden')
  } else {
    btn.disabled = false
    if (text) text.classList.remove('hidden')
    if (spinner) spinner.classList.add('hidden')
  }
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error')
  if (el) {
    el.textContent = msg
    el.classList.remove('hidden')
  }
}

function showAuthSuccess(msg) {
  const el = document.getElementById('auth-success')
  if (el) {
    el.textContent = msg
    el.classList.remove('hidden')
  }
}

function hideAuthMessages() {
  document.getElementById('auth-error')?.classList.add('hidden')
  document.getElementById('auth-success')?.classList.add('hidden')
}

function escapeHtml(str) {
  if (!str) return ''
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
