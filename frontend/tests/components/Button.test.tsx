import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { Button } from '@/components/ui/Button'
import { renderWithProviders } from '../test-utils'

describe('Button', () => {
  it('renders children', () => {
    renderWithProviders(<Button>Lưu</Button>)
    expect(screen.getByRole('button', { name: /lưu/i })).toBeInTheDocument()
  })

  it('shows spinner and disables when loading', () => {
    renderWithProviders(<Button loading>Lưu</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('disables when disabled prop', () => {
    renderWithProviders(<Button disabled>Xóa</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
