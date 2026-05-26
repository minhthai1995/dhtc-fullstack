import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { FacebookLoginButton } from '@/features/auth/FacebookLoginButton'
import { FacebookReturnPage } from '@/pages/auth/FacebookReturnPage'

function withProviders(ui: React.ReactElement, initialEntries: string[] = ['/']) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('FacebookLoginButton', () => {
  beforeEach(() => {
    // jsdom: window.location is a real Location, replace href with a spy-able setter
    // The simplest mock here is to redefine window.location with a writable href.
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { href: '' },
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders default Vietnamese label', () => {
    render(withProviders(<FacebookLoginButton />))
    expect(
      screen.getByRole('button', { name: /tiếp tục với facebook/i })
    ).toBeInTheDocument()
  })

  it('navigates to /api/v1/auth/facebook/start when clicked', async () => {
    const user = userEvent.setup()
    render(withProviders(<FacebookLoginButton />))
    await user.click(screen.getByRole('button'))
    expect(window.location.href).toBe('/api/v1/auth/facebook/start')
  })

  it('does not navigate when disabled', async () => {
    const user = userEvent.setup()
    render(withProviders(<FacebookLoginButton disabled />))
    await user.click(screen.getByRole('button'))
    expect(window.location.href).toBe('')
  })
})

describe('FacebookReturnPage — token (happy path)', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    cleanup()
    sessionStorage.clear()
  })

  it('persists token to sessionStorage and navigates to /app', async () => {
    render(
      withProviders(
        <Routes>
          <Route path="/auth/fb-return" element={<FacebookReturnPage />} />
          <Route path="/app" element={<div>APP</div>} />
        </Routes>,
        ['/auth/fb-return?token=jwt.payload.sig']
      )
    )

    await waitFor(() => {
      expect(sessionStorage.getItem('access_token')).toBe('jwt.payload.sig')
    })
    // Replace-navigated to "/app" (RoleRedirect entry — picks admin/seller dashboard)
    await waitFor(() => {
      expect(screen.getByText('APP')).toBeInTheDocument()
    })
  })
})

describe('FacebookReturnPage — error paths', () => {
  beforeEach(() => sessionStorage.clear())
  afterEach(() => {
    cleanup()
    sessionStorage.clear()
  })

  it('renders Vietnamese message for invalid_state with back link', async () => {
    render(
      withProviders(
        <Routes>
          <Route path="/auth/fb-return" element={<FacebookReturnPage />} />
          <Route path="/login" element={<div>LOGIN PAGE</div>} />
        </Routes>,
        ['/auth/fb-return?error=invalid_state']
      )
    )

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
    expect(
      screen.getByText(/phiên đăng nhập đã hết hạn hoặc không hợp lệ/i)
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /quay lại đăng nhập/i })
    ).toHaveAttribute('href', '/login')
    // token NOT persisted on error
    expect(sessionStorage.getItem('access_token')).toBeNull()
  })

  it('renders user_cancelled message', async () => {
    render(
      withProviders(
        <Routes>
          <Route path="/auth/fb-return" element={<FacebookReturnPage />} />
        </Routes>,
        ['/auth/fb-return?error=user_cancelled']
      )
    )
    await waitFor(() => {
      expect(screen.getByText(/bạn đã hủy đăng nhập/i)).toBeInTheDocument()
    })
  })

  it('falls back to generic message for unknown error codes', async () => {
    render(
      withProviders(
        <Routes>
          <Route path="/auth/fb-return" element={<FacebookReturnPage />} />
        </Routes>,
        ['/auth/fb-return?error=weird_unknown_code']
      )
    )
    await waitFor(() => {
      expect(
        screen.getByText(/đăng nhập thất bại \(weird_unknown_code\)/i)
      ).toBeInTheDocument()
    })
  })
})
