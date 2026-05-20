import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { Badge } from '@/components/ui/Badge'
import { renderWithProviders } from '../test-utils'

describe('Badge', () => {
  it('renders children text', () => {
    renderWithProviders(<Badge>Chờ xử lý</Badge>)
    expect(screen.getByText('Chờ xử lý')).toBeInTheDocument()
  })

  it('renders with default variant when no variant given', () => {
    renderWithProviders(<Badge>Default</Badge>)
    const badge = screen.getByText('Default')
    expect(badge).toBeInTheDocument()
    expect(badge.tagName).toBe('SPAN')
  })

  it('renders pending variant', () => {
    renderWithProviders(<Badge variant="pending">Chờ xử lý</Badge>)
    const badge = screen.getByText('Chờ xử lý')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toMatch(/amber/)
  })

  it('renders processing variant', () => {
    renderWithProviders(<Badge variant="processing">Đang xử lý</Badge>)
    const badge = screen.getByText('Đang xử lý')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toMatch(/blue/)
  })

  it('renders shipped variant', () => {
    renderWithProviders(<Badge variant="shipped">Đang giao</Badge>)
    const badge = screen.getByText('Đang giao')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toMatch(/purple/)
  })

  it('renders delivered variant', () => {
    renderWithProviders(<Badge variant="delivered">Đã giao</Badge>)
    const badge = screen.getByText('Đã giao')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toMatch(/green/)
  })

  it('renders cancelled variant', () => {
    renderWithProviders(<Badge variant="cancelled">Đã hủy</Badge>)
    const badge = screen.getByText('Đã hủy')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toMatch(/red/)
  })

  it('renders verified variant', () => {
    renderWithProviders(<Badge variant="verified">Đã xác minh</Badge>)
    const badge = screen.getByText('Đã xác minh')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toMatch(/green/)
  })

  it('renders active variant', () => {
    renderWithProviders(<Badge variant="active">Hoạt động</Badge>)
    const badge = screen.getByText('Hoạt động')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toMatch(/green/)
  })

  it('renders suspended variant', () => {
    renderWithProviders(<Badge variant="suspended">Tạm khóa</Badge>)
    const badge = screen.getByText('Tạm khóa')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toMatch(/red/)
  })

  it('renders gold variant', () => {
    renderWithProviders(<Badge variant="gold">Vàng</Badge>)
    const badge = screen.getByText('Vàng')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toMatch(/gold/)
  })

  it('renders silver variant', () => {
    renderWithProviders(<Badge variant="silver">Bạc</Badge>)
    const badge = screen.getByText('Bạc')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toMatch(/gray/)
  })

  it('renders bronze variant', () => {
    renderWithProviders(<Badge variant="bronze">Đồng</Badge>)
    const badge = screen.getByText('Đồng')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toMatch(/orange/)
  })

  it('accepts additional className', () => {
    renderWithProviders(<Badge className="custom-class">Test</Badge>)
    const badge = screen.getByText('Test')
    expect(badge.className).toContain('custom-class')
  })

  it('renders as inline-flex span', () => {
    renderWithProviders(<Badge>Status</Badge>)
    const badge = screen.getByText('Status')
    expect(badge.tagName).toBe('SPAN')
    expect(badge.className).toMatch(/inline-flex/)
  })
})
