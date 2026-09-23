import { expect, test } from '@playwright/test'

const configured = Boolean(process.env.E2E_EMAIL && process.env.E2E_PASSWORD)

test.describe.configure({ mode: 'serial' })
test.skip(!configured, 'Set E2E_EMAIL/E2E_PASSWORD against a real Supabase project to run E2E')

let createdPromptTitle = ''

test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await page.fill('#login-email', process.env.E2E_EMAIL as string)
  await page.fill('#login-password', process.env.E2E_PASSWORD as string)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/app/prompts')
})

test('sign up and sign in', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Prompts' })).toBeVisible()
})

test('create, edit, search, favorite, archive, restore', async ({ page }) => {
  createdPromptTitle = `E2E prompt ${Date.now()}`

  // Create
  await page.click('button:has-text("New Prompt")')
  await page.fill('#prompt-title', createdPromptTitle)
  await page.fill('#prompt-content', 'Write about {{topic}} with tone {{tone}}.')
  await page.click('button:has-text("Save & Close")')
  await page.waitForURL('**/app/prompts/**')

  // Variable detection shows in viewer
  await expect(page.getByText('{{topic}}')).toBeVisible()

  // Test prompt flow
  await page.click('button:has-text("Test Prompt")')
  await page.fill('#var-topic', 'espresso')
  await expect(page.getByText(/Write about espresso/)).toBeVisible()
  await page.keyboard.press('Escape')

  // Edit
  await page.click('button:has-text("Edit")')
  await page.fill('#prompt-description', 'Edited by E2E.')
  await page.click('button:has-text("Save")')
  await page.waitForTimeout(800)

  // Search from the library
  await page.goto('/app/prompts')
  await page.fill('input[aria-label="Search prompts"]', createdPromptTitle)
  await expect(page.getByRole('button', { name: new RegExp(`Open prompt: ${createdPromptTitle}`) })).toBeVisible()

  // Favorite from the card
  await page
    .getByRole('button', { name: new RegExp(`Open prompt: ${createdPromptTitle}`) })
    .getByRole('button', { name: 'Add to favorites' })
    .click()
  await expect(page.getByText('Added to favorites.')).toBeVisible()

  // Appears in favorites
  await page.click('text=Favorites')
  await expect(page.getByText(createdPromptTitle)).toBeVisible()

  // Archive, then restore from archived
  await page.goto('/app/prompts')
  await page.fill('input[aria-label="Search prompts"]', createdPromptTitle)
  const card = page.getByRole('button', { name: new RegExp(`Open prompt: ${createdPromptTitle}`) })
  await card.getByRole('button', { name: new RegExp(`Actions for ${createdPromptTitle}`) }).click()
  await page.click('text=Archive')
  await expect(page.getByText('Prompt archived.')).toBeVisible()

  await page.click('text=Archived')
  await expect(page.getByText(createdPromptTitle)).toBeVisible()
  await page
    .getByRole('button', { name: new RegExp(`Open prompt: ${createdPromptTitle}`) })
    .getByRole('button', { name: new RegExp(`Actions for ${createdPromptTitle}`) })
    .click()
  await page.click('text=Restore')
  await expect(page.getByText('Prompt restored.')).toBeVisible()
})

test('theme switching persists', async ({ page }) => {
  await page.goto('/app/settings')
  await page.click('button[role="radio"][aria-label="Light theme"]')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.click('button[role="radio"][aria-label="Dark theme"]')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})
