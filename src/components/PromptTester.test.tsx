import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { PromptTester } from './PromptTester'
import { ToastProvider } from './Toast'
import type { Prompt } from '@/types'

const copyMock = vi.fn().mockResolvedValue(true)

vi.mock('@/lib/clipboard', () => ({
  copyToClipboard: (text: string) => copyMock(text),
}))

const prompt: Prompt = {
  id: 'p1',
  userId: 'u1',
  title: 'Description writer',
  description: '',
  content: 'Write a product description for:\nProduct: {{product_name}}\nTone: {{tone}}',
  notes: '',
  isFavorite: false,
  tags: [],
  createdAt: '',
  updatedAt: '',
  archivedAt: null,
  deletedAt: null,
}

function renderTester() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ToastProvider>
        <PromptTester prompt={prompt} onClose={() => {}} />
      </ToastProvider>
    </MemoryRouter>,
  )
}

describe('PromptTester', () => {
  beforeEach(() => {
    copyMock.mockClear()
  })

  it('detects variables from the prompt content', () => {
    renderTester()
    expect(screen.getByText('{{product_name}}')).toBeInTheDocument()
    expect(screen.getByText('{{tone}}')).toBeInTheDocument()
  })

  it('keeps unfilled placeholders visible', () => {
    renderTester()
    expect(screen.getByText(/Product: \{\{product_name\}\}/)).toBeInTheDocument()
  })

  it('substitutes entered values in the resolved preview', async () => {
    const user = userEvent.setup()
    renderTester()
    await user.type(screen.getByLabelText(/product_name/), 'Wireless Headphones')
    expect(screen.getByText(/Product: Wireless Headphones/)).toBeInTheDocument()
  })

  it('copies the resolved prompt', async () => {
    const user = userEvent.setup()
    renderTester()
    await user.type(screen.getByLabelText(/product_name/), 'Headphones')
    await user.type(screen.getByLabelText(/tone/), 'friendly')
    await user.click(screen.getByRole('button', { name: /Copy Result/i }))
    expect(copyMock).toHaveBeenCalledTimes(1)
    const copied = copyMock.mock.calls[0][0] as string
    expect(copied).toContain('Product: Headphones')
    expect(copied).toContain('Tone: friendly')
  })

  it('reset restores placeholders', async () => {
    const user = userEvent.setup()
    renderTester()
    await user.type(screen.getByLabelText(/product_name/), 'X')
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    expect(screen.getByText(/Product: \{\{product_name\}\}/)).toBeInTheDocument()
  })
})
