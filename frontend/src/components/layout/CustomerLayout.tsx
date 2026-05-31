import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { useCurrentUser, useLogout } from '@/features/auth/useAuth'
import { MessageCircle, User, Menu, X, ChevronDown } from 'lucide-react'
import { NotificationBell } from '@/components/ui/NotificationBell'
import { useNotificationSocket } from '@/lib/useNotificationSocket'
import { useTracking } from '@/features/tracking/useTracking'
import { useT } from '@/i18n/useT'

const NAV_LINKS = [
  { key: 'home', href: '/' },
  { key: 'story', href: '/#story' },
  { key: 'visit', href: '/#visit' },
] as const

const MESSENGER_URL = 'https://m.me/sontra.night.market.danang'
const FANPAGE_URL = 'https://www.facebook.com/sontra.night.market.danang/'

export function CustomerLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { t, lang, setLang } = useT()
  const { data: user } = useCurrentUser()
  const logout = useLogout()
  const navigate = useNavigate()
  useNotificationSocket()
  useTracking()

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
              src="/img/market/cropped-Logo_Food-01-e1693969421521.png"
              alt="Chợ đêm Sơn Trà"
              className="h-9 rounded-lg object-contain"
            />
            <div className="flex flex-col">
              <strong
                className="text-green text-base font-semibold leading-tight tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {t('cust.foot.brand')}
              </strong>
              <span className="text-[9px] text-gold-deep uppercase tracking-[0.2em] font-bold">
                Đà Nẵng
              </span>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-0.5 ml-5">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.key}
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
                {t(`cust.nav.${link.key}`)}
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

            {/* Messenger CTA */}
            <a
              href={MESSENGER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green text-cream text-sm font-semibold hover:bg-green-soft transition-colors no-underline"
            >
              <MessageCircle size={14} />
              {t('cust.nav.messenger')}
            </a>

            {/* Notifications */}
            {user && <NotificationBell />}

            {/* Account */}
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-border text-ink-soft text-sm font-semibold hover:border-green hover:text-green transition-colors">
                  <User size={14} />
                  <span className="hidden sm:inline max-w-[80px] truncate">{user.email.split('@')[0]}</span>
                  <ChevronDown size={12} />
                </button>
                <div className="absolute right-0 top-full pt-1 hidden group-hover:block">
                  <div className="bg-white border border-border rounded-xl shadow-lg py-1 min-w-[140px]">
                    <Link to="/account" className="block px-4 py-2 text-sm text-ink-soft hover:bg-cream-dark hover:text-ink no-underline">
                      {t('cust.acc.account')}
                    </Link>
                    <hr className="my-1 border-border" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-cream-dark"
                    >
                      {t('cust.acc.logout')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg bg-white border border-border text-ink-soft text-sm font-semibold hover:border-green hover:text-green transition-colors no-underline"
              >
                {t('cust.acc.login')}
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
            {NAV_LINKS.map((link) => (
              <Link
                key={link.key}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2.5 text-sm font-medium text-ink-soft hover:text-ink no-underline border-b border-border last:border-0"
              >
                {t(`cust.nav.${link.key}`)}
              </Link>
            ))}
            <a
              href={MESSENGER_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 mt-3 py-2.5 px-3 rounded-lg bg-green text-cream text-sm font-semibold no-underline"
            >
              <MessageCircle size={14} />
              {t('cust.nav.messenger')}
            </a>
          </div>
        )}
      </nav>

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
                {t('cust.foot.brand')}
              </div>
              <p className="text-sm text-cream/60 leading-relaxed">{t('cust.foot.tagline')}</p>
            </div>
            <div>
              <div className="text-cream font-semibold text-sm mb-3 uppercase tracking-wider">
                {t('cust.foot.visitLabel')}
              </div>
              <div className="text-sm text-cream/60 space-y-2">
                <div>
                  <div className="text-cream/40 text-xs uppercase tracking-wider mb-0.5">
                    {t('cust.foot.hoursLabel')}
                  </div>
                  <div>{t('cust.foot.hoursValue')}</div>
                </div>
                <div>
                  <div className="text-cream/40 text-xs uppercase tracking-wider mb-0.5">
                    {t('cust.foot.addressLabel')}
                  </div>
                  <div>{t('cust.foot.address')}</div>
                </div>
              </div>
            </div>
            <div>
              <div className="text-cream font-semibold text-sm mb-3 uppercase tracking-wider">
                {t('cust.foot.contactLabel')}
              </div>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href={MESSENGER_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cream/60 hover:text-cream no-underline transition-colors"
                  >
                    {t('cust.foot.messengerCTA')}
                  </a>
                </li>
                <li>
                  <a
                    href={FANPAGE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cream/60 hover:text-cream no-underline transition-colors"
                  >
                    {t('cust.foot.fanpageCTA')}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <div className="text-cream font-semibold text-sm mb-3 uppercase tracking-wider">
                {t('cust.foot.legalLabel')}
              </div>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/privacy" className="text-cream/60 hover:text-cream no-underline transition-colors">
                    {t('cust.foot.privacyLink')}
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-cream/60 hover:text-cream no-underline transition-colors">
                    {t('cust.foot.termsLink')}
                  </Link>
                </li>
                <li>
                  <Link to="/data-deletion" className="text-cream/60 hover:text-cream no-underline transition-colors">
                    {t('cust.foot.dataDeleteLink')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-cream/40">
            <div>{t('cust.foot.copyright')}</div>
            <div className="font-mono">v2.0</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
