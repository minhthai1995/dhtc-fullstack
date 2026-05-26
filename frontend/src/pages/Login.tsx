import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLogin } from '@/features/auth/useAuth'
import { FacebookLoginButton } from '@/features/auth/FacebookLoginButton'
import { Spinner } from '@/components/ui/Spinner'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const login = useLogin()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    login.mutate(
      { username: email, password },
      {
        onSuccess: () => {
          navigate('/app')
        },
        onError: () => {
          setError('Email hoặc mật khẩu không đúng. Vui lòng thử lại.')
        },
      }
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative"
      style={{ background: 'var(--color-cream)' }}
    >
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `
            radial-gradient(ellipse 600px 400px at 20% 0%, rgba(201,169,97,0.1), transparent),
            radial-gradient(ellipse 500px 500px at 80% 100%, rgba(45,106,79,0.08), transparent)
          `,
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img
              src="https://dhtcdanang.com/wp-content/uploads/2023/07/cropped-Logo_Food-01-e1693969421521.png"
              alt="DHTC"
              className="w-12 h-12 rounded-xl object-contain border border-border bg-white p-1.5"
            />
            <div className="text-left">
              <div
                className="text-xl font-semibold text-green leading-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                DHTC Đà Nẵng
              </div>
              <div className="text-[10px] text-gold-deep uppercase tracking-widest font-bold">
                Platform
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-medium text-ink" style={{ fontFamily: 'var(--font-display)' }}>
            Đăng nhập
          </h1>
          <p className="text-ink-mute text-sm mt-1">Chào mừng quay lại</p>
        </div>

        <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green focus:ring-2 focus:ring-green/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green focus:ring-2 focus:ring-green/10 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={login.isPending}
              className="w-full py-3 bg-green text-white rounded-xl font-semibold text-sm hover:bg-green-soft disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {login.isPending ? (
                <>
                  <Spinner className="w-4 h-4 border-2 border-white border-t-transparent" />
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-widest text-ink-mute">
            <div className="flex-1 border-t border-border" />
            <span>hoặc</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <FacebookLoginButton />

          <div className="mt-6 text-center text-sm text-ink-mute">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-green font-semibold hover:underline">
              Đăng ký ngay
            </Link>
          </div>
        </div>

        <div className="text-center mt-4 text-xs text-ink-mute">
          Bằng cách đăng nhập, bạn đồng ý với{' '}
          <span className="text-green cursor-pointer hover:underline">Điều khoản sử dụng</span>
        </div>
      </div>
    </div>
  )
}
