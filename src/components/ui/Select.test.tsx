import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Select } from './Select'

describe('Select Component', () => {
  const options = [
    { value: 'updated', label: 'Recently updated' },
    { value: 'created', label: 'Recently created' },
    { value: 'alpha', label: 'Alphabetical (A–Z)' },
  ]

  it('renders trigger with current selected label', () => {
    render(<Select options={options} value="updated" />)
    expect(screen.getByRole('combobox')).toHaveTextContent('Recently updated')
  })

  it('opens options list when clicked and selects new option', () => {
    const handleChange = vi.fn()
    render(<Select options={options} value="updated" onChange={handleChange} />)

    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger)

    expect(screen.getByRole('listbox')).toBeInTheDocument()
    const optionCreated = screen.getByText('Recently created')
    fireEvent.click(optionCreated)

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({ target: { value: 'created' } }),
    )
  })

  it('closes on Escape key press', () => {
    render(<Select options={options} value="updated" />)

    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger)
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
