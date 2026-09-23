/**
 * Visual QA helper: drives the running dev app (against the QA mock double)
 * through its main surfaces and writes screenshots to scripts/qa-shots/.
 * Development tooling only — not part of the shipped product.
 */
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const BASE = process.env.QA_BASE ?? 'http://127.0.0.1:5173'
const OUT = new URL('../scripts/qa-shots/', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })

const shots = [
  ['login', '/login'],
  ['dashboard', '/app/prompts'],
  ['favorites', '/app/favorites'],
  ['archived', '/app/archived'],
  ['trash', '/app/trash'],
  ['detail', null], // filled after creating? use first prompt id from library via API-independent route: click first card
  ['editor-new', '/app/prompts/new'],
  ['settings', '/app/settings'],
  ['about', '/app/about'],
]

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  page.on('pageerror', (err) => console.error('[pageerror]', err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.error('[console.error]', msg.text().slice(0, 300))
  })

  // Sign in through the real form against the mock.
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.screenshot({ path: `${OUT}01-login.png` })

  await page.fill('#login-email', 'qa@promptstash.dev')
  await page.fill('#login-password', 'any-password')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/app/prompts', { timeout: 15000 })
  await page.waitForTimeout(1200)
  await page.screenshot({ path: `${OUT}02-dashboard.png`, fullPage: false })

  // Search
  await page.fill('input[aria-label="Search prompts"]', 'code')
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${OUT}03-search.png` })
  await page.fill('input[aria-label="Search prompts"]', '')
  await page.waitForTimeout(400)

  // Open first card → detail
  await page.click('div[role="button"][aria-label^="Open prompt"]')
  await page.waitForTimeout(900)
  await page.screenshot({ path: `${OUT}04-detail.png` })

  // Tester
  await page.click('button:has-text("Test Prompt")')
  await page.waitForTimeout(500)
  await page.fill('#var-product_name', 'Espresso Machine').catch(() => {})
  const firstVarInput = page.locator('input[id^="var-"]').first()
  if (await firstVarInput.count()) await firstVarInput.fill('Espresso Machine')
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${OUT}05-tester.png` })
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)

  // Editor (edit the open prompt)
  await page.click('button:has-text("Edit")')
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${OUT}06-editor.png` })

  // New prompt editor
  await page.goto(`${BASE}/app/prompts/new`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${OUT}07-editor-new.png` })

  // Command palette
  await page.keyboard.press('Control+k')
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${OUT}08-palette.png` })
  await page.keyboard.press('Escape')

  // Favorites / archived / trash
  for (const [name, path] of [
    ['09-favorites', '/app/favorites'],
    ['10-archived', '/app/archived'],
    ['11-trash', '/app/trash'],
  ]) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(600)
    await page.screenshot({ path: `${OUT}${name}.png` })
  }

  // Settings
  await page.goto(`${BASE}/app/settings`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT}12-settings.png` })

  // Light theme via settings
  await page.click('button[role="radio"][aria-label="Light theme"]')
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT}13-settings-light.png` })
  await page.click('button[role="radio"][aria-label="Dark theme"]')

  // About page (long)
  await page.goto(`${BASE}/app/about`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
  await page.screenshot({ path: `${OUT}14-about-top.png` })
  await page.mouse.wheel(0, 1600)
  await page.waitForTimeout(900)
  await page.screenshot({ path: `${OUT}15-about-mid.png` })
  await page.mouse.wheel(0, 2400)
  await page.waitForTimeout(900)
  await page.screenshot({ path: `${OUT}16-about-low.png` })

  // Mobile viewport sanity
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE}/app/prompts`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${OUT}17-mobile-dashboard.png` })

  await browser.close()
  console.log('QA screenshots written to', OUT)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
