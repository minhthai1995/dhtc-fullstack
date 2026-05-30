import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { useCurrentUser, useLogout } from '@/features/auth/useAuth'
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Package,
  CheckSquare,
  ShoppingCart,
  Wallet,
  Zap,
  Settings,
  Menu,
  X,
  LogOut,
  UserCircle2,
  Tag,
  RotateCcw,
  MessageSquare,
} from 'lucide-react'
import { NotificationBell } from '@/components/ui/NotificationBell'
import { useNotificationSocket } from '@/lib/useNotificationSocket'
import { useT } from '@/i18n/useT'

const navGroups = [
  {
    labelKey: 'adminNav.groupOverview',
    items: [
      { labelKey: 'adminNav.dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
      { labelKey: 'adminNav.reports', href: '/admin/reports', icon: <TrendingUp size={18} /> },
    ],
  },
  {
    labelKey: 'adminNav.groupManage',
    items: [
      { labelKey: 'adminNav.merchants', href: '/admin/merchants', icon: <Users size={18} />, badge: '287' },
      { labelKey: 'adminNav.products', href: '/admin/products', icon: <Package size={18} />, badge: '15k' },
      { labelKey: 'adminNav.categories', href: '/admin/categories', icon: <Tag size={18} /> },
      { labelKey: 'adminNav.approvals', href: '/admin/approvals', icon: <CheckSquare size={18} />, badge: '8' },
      { labelKey: 'adminNav.orders', href: '/admin/orders', icon: <ShoppingCart size={18} /> },
      { labelKey: 'adminNav.returns', href: '/admin/returns', icon: <RotateCcw size={18} /> },
      { labelKey: 'adminNav.customers', href: '/admin/customers', icon: <UserCircle2 size={18} /> },
      { labelKey: 'adminNav.withdrawals', href: '/admin/withdrawals', icon: <Wallet size={18} /> },
    ],
  },
  {
    labelKey: 'adminNav.groupOps',
    items: [
      { labelKey: 'adminNav.crm', href: '/admin/crm', icon: <MessageSquare size={18} /> },
      { labelKey: 'adminNav.integrations', href: '/admin/integrations', icon: <Zap size={18} /> },
      { labelKey: 'adminNav.settings', href: '/admin/settings', icon: <Settings size={18} /> },
    ],
  },
]

export function AdminLayout() {
  const { t } = useT()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: user } = useCurrentUser()
  const logout = useLogout()
  const navigate = useNavigate()
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
        'bg-[#1a2e1e]',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <img
          src="/img/market/cropped-Logo_Food-01-e1693969421521.png"
          alt="DHTC"
          className="w-9 h-9 rounded-lg object-contain bg-white/10 p-1"
        />
        <div>
          <div className="font-bold text-white text-sm leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
            DHTC
          </div>
          <div className="text-white/50 text-[10px] uppercase tracking-widest">{t('adminNav.console')}</div>
        </div>
        <button
          className="ml-auto lg:hidden text-white/60 hover:text-white"
          onClick={() => setSidebarOpen(false)}
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navGroups.map((group) => (
          <div key={group.labelKey} className="mb-1">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white/35">
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
                      ? 'bg-green/20 text-white'
                      : 'text-white/70 hover:bg-white/8 hover:text-white'
                  )
                }
              >
                <span className="flex-shrink-0 opacity-80">{item.icon}</span>
                <span className="flex-1">{t(item.labelKey)}</span>
                {item.badge && (
                  <span className="text-[10px] bg-white/15 text-white/70 px-1.5 py-0.5 rounded-full font-mono">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User card */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green/40 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.email?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-semibold truncate">{user?.email ?? 'Admin'}</div>
            <div className="text-white/50 text-[10px]">{t('adminNav.role')}</div>
          </div>
          <button
            onClick={handleLogout}
            className="text-white/40 hover:text-white/80 transition-colors"
            title={t('adminNav.logout')}
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
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-[#1a2e1e] border-b border-white/10">
          <button onClick={() => setSidebarOpen(true)} className="text-white">
            <Menu size={22} />
          </button>
          <span
            className="text-white font-semibold text-sm"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('adminNav.brandShort')}
          </span>
          <div className="ml-auto flex items-center gap-2">
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
