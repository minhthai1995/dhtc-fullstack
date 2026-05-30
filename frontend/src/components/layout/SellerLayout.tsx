import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { useCurrentUser, useLogout } from '@/features/auth/useAuth'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tag,
  Truck,
  Wallet,
  User,
  Menu,
  X,
  LogOut,
  Star,
  RotateCcw,
} from 'lucide-react'
import { NotificationBell } from '@/components/ui/NotificationBell'
import { useNotificationSocket } from '@/lib/useNotificationSocket'
import { useT } from '@/i18n/useT'

const navGroups = [
  {
    labelKey: 'sellerLayout.groupSales',
    items: [
      { labelKey: 'sellerLayout.navDashboard', href: '/seller/dashboard', icon: <LayoutDashboard size={18} /> },
      { labelKey: 'sellerLayout.navProducts', href: '/seller/products', icon: <Package size={18} />, badge: '8' },
      { labelKey: 'sellerLayout.navOrders', href: '/seller/orders', icon: <ShoppingCart size={18} />, badge: '14' },
      { labelKey: 'sellerLayout.navReturns', href: '/seller/returns', icon: <RotateCcw size={18} /> },
      { labelKey: 'sellerLayout.navPromotions', href: '/seller/promotions', icon: <Tag size={18} /> },
    ],
  },
  {
    labelKey: 'sellerLayout.groupFinance',
    items: [
      { labelKey: 'sellerLayout.navWallet', href: '/seller/wallet', icon: <Wallet size={18} /> },
    ],
  },
  {
    labelKey: 'sellerLayout.groupShipping',
    items: [
      { labelKey: 'sellerLayout.navShipping', href: '/seller/shipping', icon: <Truck size={18} /> },
    ],
  },
  {
    labelKey: 'sellerLayout.groupSettings',
    items: [
      { labelKey: 'sellerLayout.navProfile', href: '/seller/profile', icon: <User size={18} /> },
    ],
  },
]

export function SellerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: user } = useCurrentUser()
  const logout = useLogout()
  const navigate = useNavigate()
  const { t } = useT()
  useNotificationSocket()

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => navigate('/login'),
    })
  }

  const Sidebar = () => (
    <aside
      className={cn(
        'fixed top-0 left-0 h-full w-[248px] flex flex-col z-40 transition-transform duration-300',
        'bg-white border-r border-border',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <img
          src="/img/market/cropped-Logo_Food-01-e1693969421521.png"
          alt="DHTC"
          className="w-9 h-9 rounded-lg object-contain border border-border p-1"
        />
        <div>
          <div className="font-bold text-green text-sm leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
            DHTC
          </div>
          <div className="text-ink-mute text-[10px] uppercase tracking-widest">{t('sellerLayout.brandSubtitle')}</div>
        </div>
        <button
          className="ml-auto lg:hidden text-ink-mute hover:text-ink"
          onClick={() => setSidebarOpen(false)}
        >
          <X size={18} />
        </button>
      </div>

      {/* Store card */}
      <div className="mx-3 my-3 p-3 bg-cream rounded-xl border border-border">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Star size={11} className="text-gold fill-gold" />
          <span className="text-[10px] font-bold text-gold-deep uppercase tracking-wider">{t('sellerLayout.goldTier')}</span>
        </div>
        <div className="text-xs font-semibold text-ink leading-tight mb-1">
          {user?.email ?? t('sellerLayout.fallbackStore')}
        </div>
        <div className="text-[11px] text-ink-mute">{t('sellerLayout.verified')}</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-3">
        {navGroups.map((group) => (
          <div key={group.labelKey} className="mb-1">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-ink-mute">
              {t(group.labelKey)}
            </div>
            {group.items.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-0.5',
                    isActive
                      ? 'bg-green/10 text-green'
                      : 'text-ink-soft hover:bg-cream-dark hover:text-ink'
                  )
                }
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="flex-1">{t(item.labelKey)}</span>
                {item.badge && (
                  <span className="text-[10px] bg-green/10 text-green px-1.5 py-0.5 rounded-full font-mono font-bold">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User card */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green/15 flex items-center justify-center text-green text-sm font-bold flex-shrink-0">
            {user?.email?.[0]?.toUpperCase() ?? 'S'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-ink text-xs font-semibold truncate">{user?.email ?? t('sellerLayout.fallbackUser')}</div>
            <div className="text-ink-mute text-[10px]">{t('sellerLayout.merchant')}</div>
          </div>
          <button
            onClick={handleLogout}
            className="text-ink-mute hover:text-danger transition-colors"
            title={t('sellerLayout.logout')}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar />

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-[248px] flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-border">
          <button onClick={() => setSidebarOpen(true)} className="text-ink-soft">
            <Menu size={22} />
          </button>
          <span
            className="text-green font-semibold text-sm"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('sellerLayout.mobileTitle')}
          </span>
          <div className="ml-auto">
            <NotificationBell />
          </div>
        </div>

        <main className="flex-1 p-5 lg:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
