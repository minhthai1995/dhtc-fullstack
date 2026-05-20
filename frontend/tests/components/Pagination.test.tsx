import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pagination } from '@/components/ui/Pagination'
import { renderWithProviders } from '../test-utils'

describe('Pagination', () => {
  it('returns null when total <= pageSize (single page)', () => {
    const { container } = renderWithProviders(
      <Pagination page={1} pageSize={10} total={5} onPage={() => {}} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('returns null when total equals pageSize exactly', () => {
    const { container } = renderWithProviders(
      <Pagination page={1} pageSize={10} total={10} onPage={() => {}} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders when total > pageSize', () => {
    renderWithProviders(
      <Pagination page={1} pageSize={10} total={25} onPage={() => {}} />
    )
    // Should show prev/next buttons
    expect(screen.getByText('←')).toBeInTheDocument()
    expect(screen.getByText('→')).toBeInTheDocument()
  })

  it('shows correct page X / totalPages display', () => {
    renderWithProviders(
      <Pagination page={2} pageSize={10} total={30} onPage={() => {}} />
    )
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
  })

  it('shows correct record range', () => {
    renderWithProviders(
      <Pagination page={2} pageSize={10} total={25} onPage={() => {}} />
    )
    // page 2: records 11–20 out of 25
    expect(screen.getByText('11–20 trong 25')).toBeInTheDocument()
  })

  it('shows correct range on last page (partial)', () => {
    renderWithProviders(
      <Pagination page={3} pageSize={10} total={25} onPage={() => {}} />
    )
    // page 3: records 21–25 out of 25
    expect(screen.getByText('21–25 trong 25')).toBeInTheDocument()
  })

  it('disables prev button on first page', () => {
    renderWithProviders(
      <Pagination page={1} pageSize={10} total={25} onPage={() => {}} />
    )
    const prevBtn = screen.getByText('←')
    expect(prevBtn).toBeDisabled()
  })

  it('disables next button on last page', () => {
    renderWithProviders(
      <Pagination page={3} pageSize={10} total={25} onPage={() => {}} />
    )
    const nextBtn = screen.getByText('→')
    expect(nextBtn).toBeDisabled()
  })

  it('enables both buttons on a middle page', () => {
    renderWithProviders(
      <Pagination page={2} pageSize={10} total={30} onPage={() => {}} />
    )
    expect(screen.getByText('←')).not.toBeDisabled()
    expect(screen.getByText('→')).not.toBeDisabled()
  })

  it('calls onPage with page - 1 when prev clicked', async () => {
    const user = userEvent.setup()
    const onPage = vi.fn()
    renderWithProviders(
      <Pagination page={3} pageSize={10} total={50} onPage={onPage} />
    )
    await user.click(screen.getByText('←'))
    expect(onPage).toHaveBeenCalledWith(2)
  })

  it('calls onPage with page + 1 when next clicked', async () => {
    const user = userEvent.setup()
    const onPage = vi.fn()
    renderWithProviders(
      <Pagination page={2} pageSize={10} total={50} onPage={onPage} />
    )
    await user.click(screen.getByText('→'))
    expect(onPage).toHaveBeenCalledWith(3)
  })

  it('does not call onPage when prev clicked on first page', async () => {
    const user = userEvent.setup()
    const onPage = vi.fn()
    renderWithProviders(
      <Pagination page={1} pageSize={10} total={25} onPage={onPage} />
    )
    await user.click(screen.getByText('←'))
    expect(onPage).not.toHaveBeenCalled()
  })

  it('does not call onPage when next clicked on last page', async () => {
    const user = userEvent.setup()
    const onPage = vi.fn()
    renderWithProviders(
      <Pagination page={3} pageSize={10} total={25} onPage={onPage} />
    )
    await user.click(screen.getByText('→'))
    expect(onPage).not.toHaveBeenCalled()
  })
})
