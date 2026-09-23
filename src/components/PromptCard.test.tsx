import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { PromptCard } from './PromptCard'
import { ToastProvider } from './Toast'
import type { Prompt } from '@/types'

const mutateMock = vi.fn((_vars: unknown, opts?: { onSuccess?: () => void }) => opts?.onSuccess?.())
const copyMock = vi.fn().mockResolvedValue(true)

vi.mock('@/hooks/usePrompts', () => ({
  useToggleFavorite: () => ({ mutate: mutateMock }),
  useArchivePrompt: () => ({ mutate: vi.fn() }),
  useTrashPrompt: () => ({ mutate: vi.fn() }),
  useDuplicatePrompt: () => ({ mutate: vi.fn() }),
}))

vi.mock('@/lib/clipboard', () => ({
  copyToClipboard: (text: string) => copyMock(text),
}))

const prompt: Prompt = {
  id: 'p1',
  userId: 'u1',
  title: 'Product Description Optimizer',
  description: 'Enhance product descriptions for e-commerce platforms.',
  content: 'Write a description for {{product_name}}.',
  notes: '',
  isFavorite: false,
  tags: [
    { id: 't1', name: 'Marketing', createdAt: '' },
    { id: 't2', name: 'E-commerce', createdAt: '' },
  ],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-09-20T00:00:00Z',
  archivedAt: null,
  deletedAt: null,
}

function renderCard() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ToastProvider>
        <PromptCard prompt={prompt} />
      </ToastProvider>
    </MemoryRouter>,
  )
}

describe('PromptCard', () => {
  beforeEach(() => {
    mutateMock.mockClear()
    copyMock.mockClear()
  })

  it('renders title, description, tags and updated time', () => {
    renderCard()
    expect(screen.getByText('Product Description Optimizer')).toBeInTheDocument()
    expect(screen.getByText(/Enhance product descriptions/)).toBeInTheDocument()
    expect(screen.getByText('Marketing')).toBeInTheDocument()
    expect(screen.getByText('E-commerce')).toBeInTheDocument()
    expect(screen.getByText(/Updated/)).toBeInTheDocument()
  })

  it('favorites the prompt from the card action', async () => {
    const user = userEvent.setup()
    renderCard()
    await user.click(screen.getByRole('button', { name: 'Add to favorites' }))
    expect(mutateMock).toHaveBeenCalledWith(
      { id: 'p1', isFavorite: true },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })

  it('copies the prompt content to the clipboard', async () => {
    const user = userEvent.setup()
    renderCard()
    await user.click(screen.getByRole('button', { name: 'Copy prompt' }))
    expect(copyMock).toHaveBeenCalledWith('Write a description for {{product_name}}.')
  })

  it('truncates tag display beyond three tags', () => {
    const manyTags: Prompt = {
      ...prompt,
      tags: Array.from({ length: 5 }, (_, i) => ({ id: `t${i}`, name: `Tag ${i}`, createdAt: '' })),
    }
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ToastProvider>
          <PromptCard prompt={manyTags} />
        </ToastProvider>
      </MemoryRouter>,
    )
    expect(screen.getByText('+2')).toBeInTheDocument()
  })
})
