import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { useCurrentUser, useLogout } from '@/features/auth/useAuth'
import { useCart } from '@/features/cart/useCart'
import { ShoppingCart, Search, User, Menu, X, ChevronDown } from 'lucide-react'
import { NotificationBell } from '@/components/ui/NotificationBell'
import { useNotificationSocket } from '@/lib/useNotificationSocket'
import { useTracking } from '@/features/tracking/useTracking'

const navLinks = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Mua sắm', href: '/shop' },
  { label: 'Cẩm nang', href: '/shop' },
  { label: 'Liên hệ', href: '/shop' },
]

const categories = [
  'Tất cả', 'Cà phê', 'Hồ tiêu', 'Sâm & thảo dược', 'Trái cây sấy', 'Mật ong', 'Nước mắm', 'Gạo đặc sản'
]

export function CustomerLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [lang, setLang] = useState<'vi' | 'en'>('vi')
  const { data: user } = useCurrentUser()
  const { data: cart } = useCart()
  const logout = useLogout()
  const navigate = useNavigate()
  useNotificationSocket()
  useTracking()

  const cartCount = cart?.length ?? 0

  const handleLogout = () => {
    logout.mutate(undefined, { onSuccess: () => navigate('/login') })
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      {/* Sticky nav */}
      <nav
        className="sticky top-0 z-50 border-b border-border"
        style={{ background: 'rgba(250,247,242,0.92)', backdropFilter: 'blur(10px)' }}
      >
        <div className="max-w-[1320px] mx-auto px-7 flex items-center gap-2 h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0 no-underline">
            <img
              src="https://dhtcdanang.com/wp-content/uploads/2023/07/cropped-Logo_Food-01-e1693969421521.png"
              alt="DHTC"
              className="h-9 rounded-lg object-contain"
            />
            <div className="flex flex-col">
              <strong
                className="text-green text-base font-semibold leading-tight tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                DHTC
              </strong>
              <span className="text-[9px] text-gold-deep uppercase tracking-[0.2em] font-bold">
                Đà Nẵng
              </span>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-0.5 ml-5">
            {navLinks.map((link) => (
              <NavLink
                key={link.href + link.label}
                to={link.href}
                className={({ isActive }) =>
                  cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all no-underline',
                    isActive
                      ? 'text-green font-semibold'
                      : 'text-ink-soft hover:bg-cream-dark hover:text-ink'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="flex-1" />

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Lang toggle */}
            <div className="hidden md:flex items-center text-xs font-semibold rounded-lg overflow-hidden border border-border">
              <button
                onClick={() => setLang('vi')}
                className={cn(
                  'px-2.5 py-1.5 transition-colors',
                  lang === 'vi' ? 'bg-green text-white' : 'text-ink-mute hover:bg-cream-dark'
                )}
              >
                VI
              </button>
              <button
                onClick={() => setLang('en')}
                className={cn(
                  'px-2.5 py-1.5 transition-colors',
                  lang === 'en' ? 'bg-green text-white' : 'text-ink-mute hover:bg-cream-dark'
                )}
              >
                EN
              </button>
            </div>

            {/* Search */}
            <button className="w-10 h-10 rounded-lg bg-white border border-border flex items-center justify-center text-ink-soft hover:border-green transition-colors">
              <Search size={16} />
            </button>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative w-10 h-10 rounded-lg bg-white border border-border flex items-center justify-center text-ink-soft hover:border-green transition-colors"
            >
              <ShoppingCart size={16} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-vermillion text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 border-2 border-cream">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Notifications */}
            {user && <NotificationBell />}

            {/* Account */}
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green text-cream text-sm font-semibold hover:bg-green-soft transition-colors">
                  <User size={14} />
                  <span className="hidden sm:inline max-w-[80px] truncate">{user.email.split('@')[0]}</span>
                  <ChevronDown size={12} />
                </button>
                <div className="absolute right-0 top-full pt-1 hidden group-hover:block">
                  <div className="bg-white border border-border rounded-xl shadow-lg py-1 min-w-[140px]">
                    <Link to="/account" className="block px-4 py-2 text-sm text-ink-soft hover:bg-cream-dark hover:text-ink no-underline">
                      Tài khoản
                    </Link>
                    <Link to="/account" className="block px-4 py-2 text-sm text-ink-soft hover:bg-cream-dark hover:text-ink no-underline">
                      Đơn hàng
                    </Link>
                    <hr className="my-1 border-border" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-cream-dark"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg bg-green text-cream text-sm font-semibold hover:bg-green-soft transition-colors no-underline"
              >
                Đăng nhập
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden w-10 h-10 flex items-center justify-center text-ink-soft"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-border px-4 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href + link.label}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2.5 text-sm font-medium text-ink-soft hover:text-ink no-underline border-b border-border last:border-0"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Category pills */}
      <div className="border-b border-border bg-white">
        <div className="max-w-[1320px] mx-auto px-7">
          <div className="flex gap-2.5 py-3 overflow-x-auto scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                className={cn(
                  'px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-all flex-shrink-0',
                  cat === 'Tất cả'
                    ? 'border-green bg-green/6 text-green font-semibold'
                    : 'border-border bg-white text-ink-soft hover:border-green hover:text-green'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-green-deep text-cream/80 mt-auto">
        <div className="max-w-[1320px] mx-auto px-7 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div
                className="text-cream font-bold text-lg mb-3"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                DHTC Đà Nẵng
              </div>
              <p className="text-sm text-cream/60 leading-relaxed">
                Nền tảng thương mại nông sản đặc sản Việt Nam, kết nối tiểu thương và khách hàng toàn cầu.
              </p>
            </div>
            <div>
              <div className="text-cream font-semibold text-sm mb-3 uppercase tracking-wider">Sản phẩm</div>
              <ul className="space-y-2 text-sm">
                {['Cà phê Đắk Lắk', 'Hồ tiêu Gia Lai', 'Sâm Ngọc Linh', 'Mật ong rừng'].map((item) => (
                  <li key={item}>
                    <Link to="/shop" className="text-cream/60 hover:text-cream no-underline transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-cream font-semibold text-sm mb-3 uppercase tracking-wider">Hỗ trợ</div>
              <ul className="space-y-2 text-sm">
                {['Chính sách giao hàng', 'Đổi trả hàng', 'Thanh toán an toàn', 'Liên hệ DHTC'].map((item) => (
                  <li key={item}>
                    <Link to="/" className="text-cream/60 hover:text-cream no-underline transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-cream font-semibold text-sm mb-3 uppercase tracking-wider">Liên hệ</div>
              <div className="text-sm text-cream/60 space-y-1">
                <div>Đà Nẵng, Việt Nam</div>
                <div>info@dhtcdanang.com</div>
                <div>+84 236 XXX XXXX</div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-cream/40">
            <div>© 2026 DHTC Đà Nẵng. All rights reserved.</div>
            <div className="font-mono">v2.0 · Platform Mockup</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
