import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { authKeys } from '@/features/auth/useAuth'
import { Spinner } from '@/components/ui/Spinner'

/**
 * /auth/fb-return — landing after BE callback redirects with ?token=… or ?error=…
 *
 * Success: persist token to sessionStorage (same key the rest of the app reads),
 * invalidate the auth/me query so RoleRedirect picks up the new identity, then
 * navigate to /. Failure: render a Vietnamese error card with a "Quay lại" link.
 *
 * KHÔNG persist token vào localStorage hay log nó ra console.
 */

const ERROR_MESSAGES: Record<string, string> = {
  invalid_state: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng thử lại.',
  user_cancelled: 'Bạn đã hủy đăng nhập bằng Facebook.',
  fb_unavailable: 'Không kết nối được Facebook. Vui lòng thử lại sau ít phút.',
}

function vietnameseError(code: string | null): string {
  if (!code) return 'Đã có lỗi xảy ra. Vui lòng thử lại.'
  return ERROR_MESSAGES[code] ?? `Đăng nhập thất bại (${code}).`
}

export function FacebookReturnPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const token = searchParams.get('token')
  const error = searchParams.get('error')
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending')

  useEffect(() => {
    if (token) {
      sessionStorage.setItem('access_token', token)
      queryClient.invalidateQueries({ queryKey: authKeys.me })
      setStatus('success')
      navigate('/', { replace: true })
      return
    }
    if (error) {
      setStatus('error')
      return
    }
    // Neither — treat as malformed redirect
    setStatus('error')
  }, [token, error, navigate, queryClient])

  if (status === 'error') {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'var(--color-cream)' }}
      >
        <div
          role="alert"
          className="bg-white border border-border rounded-2xl p-8 max-w-md w-full text-center shadow-sm"
        >
          <h1
            className="text-xl font-semibold text-ink mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Đăng nhập không thành công
          </h1>
          <p className="text-sm text-ink-soft mb-6">{vietnameseError(error)}</p>
          <Link
            to="/login"
            className="inline-block px-6 py-2.5 bg-green text-white rounded-xl font-semibold text-sm hover:bg-green-soft transition-colors"
          >
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--color-cream)' }}
    >
      <div className="flex items-center gap-3 text-ink-soft">
        <Spinner className="w-5 h-5 border-2 border-green border-t-transparent" />
        <span className="text-sm">Đang hoàn tất đăng nhập…</span>
      </div>
    </div>
  )
}
