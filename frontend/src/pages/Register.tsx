import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRegister } from '@/features/auth/useAuth'
import { FacebookLoginButton } from '@/features/auth/FacebookLoginButton'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/cn'
import { ShieldCheck, ShoppingBag } from 'lucide-react'

type Role = 'customer' | 'seller'

export function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<Role>('customer')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const register = useRegister()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }

    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.')
      return
    }

    register.mutate(
      { email, password, role },
      {
        onSuccess: () => {
          navigate('/login')
        },
        onError: () => {
          setError('Đăng ký thất bại. Email có thể đã được sử dụng.')
        },
      }
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8 relative"
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
              src="/img/market/cropped-Logo_Food-01-e1693969421521.png"
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
            Tạo tài khoản
          </h1>
          <p className="text-ink-mute text-sm mt-1">Tham gia nền tảng nông sản Việt Nam</p>
        </div>

        <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role selection */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">Bạn là</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                    role === 'customer'
                      ? 'border-green bg-green/5'
                      : 'border-border hover:border-green/40'
                  )}
                >
                  <ShoppingBag
                    size={22}
                    className={role === 'customer' ? 'text-green' : 'text-ink-mute'}
                  />
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      role === 'customer' ? 'text-green' : 'text-ink-soft'
                    )}
                  >
                    Người mua
                  </span>
                  <span className="text-[11px] text-ink-mute text-center leading-tight">
                    Tìm & mua nông sản
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('seller')}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                    role === 'seller'
                      ? 'border-gold bg-gold/5'
                      : 'border-border hover:border-gold/40'
                  )}
                >
                  <ShieldCheck
                    size={22}
                    className={role === 'seller' ? 'text-gold-deep' : 'text-ink-mute'}
                  />
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      role === 'seller' ? 'text-gold-deep' : 'text-ink-soft'
                    )}
                  >
                    Tiểu thương
                  </span>
                  <span className="text-[11px] text-ink-mute text-center leading-tight">
                    Bán sản phẩm của bạn
                  </span>
                </button>
              </div>
            </div>

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
                placeholder="Tối thiểu 8 ký tự"
                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green focus:ring-2 focus:ring-green/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">Xác nhận mật khẩu</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Nhập lại mật khẩu"
                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green focus:ring-2 focus:ring-green/10 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={register.isPending}
              className="w-full py-3 bg-green text-white rounded-xl font-semibold text-sm hover:bg-green-soft disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {register.isPending ? (
                <>
                  <Spinner className="w-4 h-4 border-2 border-white border-t-transparent" />
                  Đang tạo tài khoản...
                </>
              ) : (
                'Đăng ký'
              )}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-widest text-ink-mute">
            <div className="flex-1 border-t border-border" />
            <span>hoặc</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <FacebookLoginButton label="Đăng ký bằng Facebook" />

          <div className="mt-6 text-center text-sm text-ink-mute">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-green font-semibold hover:underline">
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
