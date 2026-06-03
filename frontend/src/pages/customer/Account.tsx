import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurrentUser, useLogout } from '@/features/auth/useAuth'
import { useMyOrders } from '@/features/orders/useOrders'
import { useAddresses, useCreateAddress, useDeleteAddress, useSetDefaultAddress } from '@/features/customer/useAddress'
import { useWishlist, useRemoveFromWishlist } from '@/features/customer/useWishlist'
import { useProfile, useUpdateProfile, useChangePassword } from '@/features/customer/useProfile'
import { useAddToCart } from '@/features/cart/useCart'
import { Package, MapPin, Heart, Store, Settings, LogOut, User, Lock } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import type { OrderStatus } from '@/types/api'
import { productImageSrc } from '@/types/api'
import { useT } from '@/i18n/useT'

type AccountSection = 'dashboard' | 'orders' | 'addresses' | 'wishlist' | 'following' | 'settings'

const STATUS_KEY: Record<OrderStatus, string> = {
  pending: 'tracking.statusPending',
  processing: 'tracking.statusProcessing',
  shipped: 'tracking.statusShipped',
  delivered: 'tracking.statusDelivered',
  cancelled: 'tracking.statusCancelled',
}

const STATUS_VARIANT: Record<OrderStatus, 'pending' | 'active' | 'shipped' | 'delivered' | 'cancelled'> = {
  pending: 'pending',
  processing: 'active',
  shipped: 'shipped',
  delivered: 'delivered',
  cancelled: 'cancelled',
}

const NAV_ITEMS: { key: AccountSection; labelKey: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', labelKey: 'account.navDashboard', icon: <User size={15} /> },
  { key: 'orders', labelKey: 'account.navOrders', icon: <Package size={15} /> },
  { key: 'addresses', labelKey: 'account.navAddresses', icon: <MapPin size={15} /> },
  { key: 'wishlist', labelKey: 'account.navWishlist', icon: <Heart size={15} /> },
  { key: 'following', labelKey: 'account.navFollowing', icon: <Store size={15} /> },
  { key: 'settings', labelKey: 'account.navSettings', icon: <Settings size={15} /> },
]

export function Account() {
  const navigate = useNavigate()
  const { data: user } = useCurrentUser()
  const { data: ordersData } = useMyOrders()
  const logout = useLogout()

  const { data: addresses = [] } = useAddresses()
  const createAddress = useCreateAddress()
  const deleteAddress = useDeleteAddress()
  const setDefault = useSetDefaultAddress()

  const { data: wishlist = [] } = useWishlist()
  const removeFromWishlist = useRemoveFromWishlist()
  const addToCart = useAddToCart()

  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()
  const { t, lang, setLang } = useT()
  const locale = lang === 'vi' ? 'vi-VN' : 'en-US'

  const [section, setSection] = useState<AccountSection>('dashboard')
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [newAddr, setNewAddr] = useState({ label: t('account.addressDefaultLabel'), name: '', phone: '', address: '', city: '', country: t('account.addressDefaultCountry') })
  const [profileSaved, setProfileSaved] = useState(false)
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    email: '',
    phone: '',
    language: lang,
    currency: localStorage.getItem('pref_currency') ?? 'VND',
    timezone: localStorage.getItem('pref_timezone') ?? 'Asia/Ho_Chi_Minh',
    notifyOrderEmail: localStorage.getItem('pref_notify_order') !== 'false',
    notifyDeliverySms: localStorage.getItem('pref_notify_delivery') !== 'false',
    notifyPromos: localStorage.getItem('pref_notify_promos') === 'true',
  })

  // Sync settings form when profile loads
  useEffect(() => {
    if (profile) {
      setSettingsForm((f) => ({
        ...f,
        name: profile.full_name ?? '',
        email: profile.email ?? '',
        phone: profile.phone ?? '',
      }))
    }
  }, [profile])

  const orders = ordersData ?? []
  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? '—'
  const displayEmail = profile?.email ?? user?.email ?? '—'
  const avatarInitial = displayName.charAt(0).toUpperCase()

  const totalSpent = orders.filter((o) => o.status === 'delivered').reduce((sum, o) => sum + o.total_amount, 0)

  const handleLogout = () => {
    logout.mutate(undefined)
    navigate('/login')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
      {/* Sidebar */}
      <div className="lg:sticky lg:top-24 h-fit">
        <div className="bg-white border border-border rounded-2xl p-5">
          {/* Avatar + identity */}
          <div className="flex flex-col items-center text-center pb-5 border-b border-border mb-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-3"
              style={{ background: 'var(--color-green)', color: 'var(--color-gold)', fontFamily: 'var(--font-display)' }}
            >
              {avatarInitial}
            </div>
            <div className="font-medium text-ink" style={{ fontFamily: 'var(--font-display)', fontSize: '15px' }}>
              {displayName}
            </div>
            <div className="text-xs text-ink-mute mt-0.5">{displayEmail}</div>
            <div
              className="mt-2 text-[10px] font-bold px-2.5 py-1 rounded"
              style={{ color: 'var(--color-gold-deep)', background: 'rgba(201,169,97,0.12)' }}
            >
              {t('account.goldMember')}
            </div>
          </div>

          {/* Nav links */}
          <nav className="space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => setSection(item.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                  section === item.key
                    ? 'bg-green text-white'
                    : 'text-ink-soft hover:bg-cream'
                }`}
              >
                {item.icon}
                {t(item.labelKey)}
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-colors mt-2"
              style={{ color: 'var(--color-vermillion)' }}
            >
              <LogOut size={15} />
              {t('account.logout')}
            </button>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="space-y-6">
        {/* DASHBOARD */}
        {section === 'dashboard' && (
          <>
            <div>
              <h1 className="text-3xl font-medium tracking-tight text-ink mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                {t('account.title')}
              </h1>
              <p className="text-ink-mute text-sm">{t('account.greeting').replace('{name}', displayName)}</p>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-border rounded-2xl p-5 text-center">
                <div className="text-3xl font-semibold text-green" style={{ fontFamily: 'var(--font-display)' }}>
                  {orders.length}
                </div>
                <div className="text-xs text-ink-mute mt-1 font-medium uppercase tracking-wider">{t('account.kpiOrdersPlaced')}</div>
              </div>
              <div className="bg-white border border-border rounded-2xl p-5 text-center">
                <div className="text-3xl font-semibold text-green" style={{ fontFamily: 'var(--font-display)' }}>
                  {(totalSpent / 1_000_000).toLocaleString(locale, { maximumFractionDigits: 2 })}M
                </div>
                <div className="text-xs text-ink-mute mt-1 font-medium uppercase tracking-wider">{t('account.kpiSpent')}</div>
              </div>
              <div className="bg-white border border-border rounded-2xl p-5 text-center">
                <div className="text-3xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold-deep)' }}>
                  —
                </div>
                <div className="text-xs text-ink-mute mt-1 font-medium uppercase tracking-wider">{t('account.kpiPoints')}</div>
                <div className="text-[10px] text-ink-mute mt-0.5">{t('account.kpiPointsHint')}</div>
              </div>
            </div>

            {/* Recent orders */}
            <div className="bg-white border border-border rounded-2xl p-5">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
                  {t('account.recentOrders')}
                </h2>
                <button
                  onClick={() => setSection('orders')}
                  className="text-xs text-green font-semibold hover:underline"
                >
                  {t('account.viewAll')}
                </button>
              </div>
              <div className="space-y-3">
                {orders.slice(0, 4).map((order) => (
                  <div key={order.id} className="flex items-center justify-between gap-4 py-2.5 border-b border-border last:border-0">
                    <div>
                      <div className="text-sm font-mono font-semibold text-green">
                        O{order.created_at.slice(0, 10).replace(/-/g, '')}–{String(order.id).padStart(4, '0')}
                      </div>
                      <div className="text-xs text-ink-mute mt-0.5">
                        {new Date(order.created_at).toLocaleDateString(locale)}
                      </div>
                    </div>
                    <Badge variant={STATUS_VARIANT[order.status]}>{t(STATUS_KEY[order.status])}</Badge>
                    <div className="text-sm font-semibold font-mono text-ink">
                      {order.total_amount.toLocaleString(locale)}₫
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ORDERS */}
        {section === 'orders' && (
          <div>
            <h1 className="text-3xl font-medium tracking-tight text-ink mb-5" style={{ fontFamily: 'var(--font-display)' }}>
              {t('account.ordersTitle')}
            </h1>
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="bg-white border border-border rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                    <div>
                      <div className="text-sm font-mono font-semibold text-green">
                        O{order.created_at.slice(0, 10).replace(/-/g, '')}–{String(order.id).padStart(4, '0')}
                      </div>
                      <div className="text-xs text-ink-mute mt-0.5">
                        {t('account.orderPlacedAt').replace('{date}', new Date(order.created_at).toLocaleString(locale))}
                      </div>
                    </div>
                    <Badge variant={STATUS_VARIANT[order.status]}>{t(STATUS_KEY[order.status])}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-ink-mute">{t('account.shipTo')}</span>
                      <span className="font-medium">{order.shipping_address.city}, {order.shipping_address.country}</span>
                    </div>
                    <div className="font-semibold text-green font-mono" style={{ fontFamily: 'var(--font-display)' }}>
                      {order.total_amount.toLocaleString(locale)}₫
                    </div>
                  </div>
                  {order.tracking_number && (
                    <div className="mt-2 text-xs text-ink-mute">
                      {t('account.awbLabel')}: <span className="font-mono font-semibold text-green">{order.tracking_number}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ADDRESSES */}
        {section === 'addresses' && (
          <div>
            <div className="flex items-baseline justify-between mb-5">
              <h1 className="text-3xl font-medium tracking-tight text-ink" style={{ fontFamily: 'var(--font-display)' }}>
                {t('account.addressesTitle')}
              </h1>
              <button
                onClick={() => setShowAddressForm(s => !s)}
                className="text-sm font-semibold text-white bg-green px-4 py-2 rounded-xl hover:bg-green-soft transition-colors"
              >
                {showAddressForm ? t('account.addressFormClose') : t('account.addressFormOpen')}
              </button>
            </div>

            {showAddressForm && (
              <div className="bg-white border border-border rounded-2xl p-5 mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder={t('account.addressPhLabel')} value={newAddr.label}
                    onChange={e => setNewAddr(a => ({...a, label: e.target.value}))}
                    className="px-3 py-2 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green" />
                  <input placeholder={t('account.addressPhName')} value={newAddr.name}
                    onChange={e => setNewAddr(a => ({...a, name: e.target.value}))}
                    className="px-3 py-2 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green" />
                  <input placeholder={t('account.addressPhPhone')} value={newAddr.phone}
                    onChange={e => setNewAddr(a => ({...a, phone: e.target.value}))}
                    className="px-3 py-2 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green" />
                  <input placeholder={t('account.addressPhCity')} value={newAddr.city}
                    onChange={e => setNewAddr(a => ({...a, city: e.target.value}))}
                    className="px-3 py-2 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green" />
                </div>
                <input placeholder={t('account.addressPhDetail')} value={newAddr.address}
                  onChange={e => setNewAddr(a => ({...a, address: e.target.value}))}
                  className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green" />
                <button
                  onClick={() => {
                    if (!newAddr.name || !newAddr.phone || !newAddr.address || !newAddr.city) return
                    createAddress.mutate({ ...newAddr, is_default: addresses.length === 0 }, {
                      onSuccess: () => { setShowAddressForm(false); setNewAddr({ label: t('account.addressDefaultLabel'), name: '', phone: '', address: '', city: '', country: t('account.addressDefaultCountry') }) }
                    })
                  }}
                  disabled={createAddress.isPending}
                  className="px-4 py-2 bg-green text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                >
                  {t('account.addressSave')}
                </button>
              </div>
            )}

            <div className="space-y-3">
              {addresses.length === 0 ? (
                <div className="bg-white border border-border rounded-2xl p-10 text-center text-ink-mute text-sm">
                  {t('account.addressEmpty')}
                </div>
              ) : addresses.map((addr) => (
                <div key={addr.id} className="bg-white rounded-2xl p-5 border-2"
                  style={{ borderColor: addr.is_default ? 'var(--color-green)' : 'var(--color-border)' }}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-ink">{addr.label}</span>
                        {addr.is_default && (
                          <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(201,169,97,0.2)', color: 'var(--color-gold-deep)' }}>
                            {t('account.addressDefaultBadge')}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-ink">{addr.name}</div>
                      <div className="text-sm text-ink-soft mt-0.5">{addr.phone}</div>
                      <div className="text-sm text-ink-soft">{addr.address}</div>
                      <div className="text-sm text-ink-soft">{addr.city}, {addr.country}</div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {!addr.is_default && (
                        <button onClick={() => setDefault.mutate(addr.id)} disabled={setDefault.isPending}
                          className="text-xs font-semibold text-green hover:underline disabled:opacity-50">
                          {t('account.addressMakeDefault')}
                        </button>
                      )}
                      {!addr.is_default && (
                        <button onClick={() => deleteAddress.mutate(addr.id)} disabled={deleteAddress.isPending}
                          className="text-xs font-semibold text-ink-mute hover:text-danger transition-colors disabled:opacity-50">
                          {t('account.addressDelete')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WISHLIST */}
        {section === 'wishlist' && (
          <div>
            <h1 className="text-3xl font-medium tracking-tight text-ink mb-5" style={{ fontFamily: 'var(--font-display)' }}>
              {t('account.wishlistTitle')}
            </h1>
            <p className="text-ink-mute text-sm mb-5">{t('account.wishlistCount').replace('{count}', String(wishlist.length))}</p>
            {wishlist.length === 0 ? (
              <div className="bg-white border border-border rounded-2xl p-16 text-center text-ink-mute">
                {t('account.wishlistEmpty')}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {wishlist.map((item) => {
                  const primaryImg = item.product.images?.find((i) => i.is_primary) ?? item.product.images?.[0]
                  const primaryImage = primaryImg ? productImageSrc(primaryImg, 'medium') : null
                  const pName = lang === 'en' && item.product.name_en ? item.product.name_en : item.product.name_vi
                  return (
                    <div key={item.id} className="bg-white border border-border rounded-2xl overflow-hidden hover:-translate-y-1 hover:border-green hover:shadow-lg transition-all duration-200">
                      <div className="h-36 bg-cream flex items-center justify-center overflow-hidden">
                        {primaryImage ? (
                          <img src={primaryImage} alt={pName} className="w-full h-full object-cover" />
                        ) : (
                          <Package size={28} className="text-ink-mute" />
                        )}
                      </div>
                      <div className="p-3">
                        <div className="text-xs text-ink-mute mb-1 truncate">{item.product.origin}</div>
                        <div className="text-sm font-medium text-ink mb-2 line-clamp-2" style={{ fontFamily: 'var(--font-display)' }}>
                          {pName}
                        </div>
                        <div className="text-sm font-semibold text-green" style={{ fontFamily: 'var(--font-display)' }}>
                          {item.product.price.toLocaleString(locale)}₫
                        </div>
                        <div className="mt-2 flex gap-1">
                          <button
                            onClick={() => addToCart.mutate({ productId: item.product_id, quantity: 1 })}
                            disabled={addToCart.isPending}
                            className="flex-1 py-1.5 bg-cream border border-green text-green rounded-lg text-xs font-medium hover:bg-green hover:text-cream transition-all disabled:opacity-50"
                          >
                            {t('shop.addToCart')}
                          </button>
                          <button
                            onClick={() => removeFromWishlist.mutate(item.product_id)}
                            disabled={removeFromWishlist.isPending}
                            className="p-1.5 border border-border rounded-lg text-ink-mute hover:border-danger hover:text-danger transition-colors disabled:opacity-50"
                            title={t('account.wishlistRemove')}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* FOLLOWING */}
        {section === 'following' && (
          <div>
            <h1 className="text-3xl font-medium tracking-tight text-ink mb-5" style={{ fontFamily: 'var(--font-display)' }}>
              {t('account.followingTitle')}
            </h1>
            <div className="bg-white border border-border rounded-2xl p-10 text-center">
              <div className="text-sm font-semibold text-ink mb-1.5">{t('account.followingEmpty')}</div>
              <div className="text-xs text-ink-mute mb-3">{t('account.followingHint')}</div>
              <div className="inline-block text-[10.5px] font-bold uppercase tracking-widest px-2.5 py-1 rounded" style={{ background: 'var(--color-cream-dark)', color: 'var(--color-ink-soft)' }}>
                {t('account.followingComingSoon')}
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {section === 'settings' && (
          <div>
            <h1 className="text-3xl font-medium tracking-tight text-ink mb-1" style={{ fontFamily: 'var(--font-display)' }}>
              {t('account.settingsTitle')}
            </h1>
            <p className="text-ink-mute text-sm mb-6">{t('account.settingsSubtitle')}</p>

            <div className="space-y-5">
              {/* Personal info */}
              <div className="bg-white border border-border rounded-2xl p-5">
                <h3 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                  {t('account.personalInfo')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">{t('account.fullName')}</label>
                    <input
                      type="text"
                      value={settingsForm.name}
                      onChange={(e) => setSettingsForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">{t('account.email')}</label>
                    <input
                      type="email"
                      value={settingsForm.email}
                      onChange={(e) => setSettingsForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-ink mb-1.5">{t('account.phone')}</label>
                    <input
                      type="tel"
                      value={settingsForm.phone}
                      onChange={(e) => setSettingsForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div className="bg-white border border-border rounded-2xl p-5">
                <h3 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                  {t('account.prefs')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">{t('account.prefLanguage')}</label>
                    <select
                      value={settingsForm.language}
                      onChange={(e) => {
                        const v = e.target.value as 'vi' | 'en'
                        setSettingsForm((f) => ({ ...f, language: v }))
                        setLang(v)
                      }}
                      className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                    >
                      <option value="vi">Tiếng Việt</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">{t('account.prefCurrency')}</label>
                    <select
                      value={settingsForm.currency}
                      onChange={(e) => {
                        const v = e.target.value
                        setSettingsForm((f) => ({ ...f, currency: v }))
                        localStorage.setItem('pref_currency', v)
                      }}
                      className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                    >
                      <option value="VND">VND ₫</option>
                      <option value="USD">USD $</option>
                      <option value="JPY">JPY ¥</option>
                      <option value="EUR">EUR €</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">{t('account.prefTimezone')}</label>
                    <select
                      value={settingsForm.timezone}
                      onChange={(e) => {
                        const v = e.target.value
                        setSettingsForm((f) => ({ ...f, timezone: v }))
                        localStorage.setItem('pref_timezone', v)
                      }}
                      className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                    >
                      <option value="Asia/Ho_Chi_Minh">ICT +07:00</option>
                      <option value="Asia/Tokyo">JST +09:00</option>
                      <option value="Europe/London">GMT +00:00</option>
                      <option value="America/New_York">EST -05:00</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="bg-white border border-border rounded-2xl p-5">
                <h3 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                  {t('account.notifications')}
                </h3>
                <div className="space-y-3">
                  {[
                    { key: 'notifyOrderEmail' as const, labelKey: 'account.notifyOrderEmail', subKey: 'account.notifyOrderEmailSub' },
                    { key: 'notifyDeliverySms' as const, labelKey: 'account.notifyDeliverySms', subKey: 'account.notifyDeliverySmsSub' },
                    { key: 'notifyPromos' as const, labelKey: 'account.notifyPromos', subKey: 'account.notifyPromosSub' },
                  ].map((item) => (
                    <label key={item.key} className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settingsForm[item.key]}
                        onChange={(e) => {
                          const v = e.target.checked
                          setSettingsForm((f) => ({ ...f, [item.key]: v }))
                          const lsKey = item.key === 'notifyOrderEmail' ? 'pref_notify_order' : item.key === 'notifyDeliverySms' ? 'pref_notify_delivery' : 'pref_notify_promos'
                          localStorage.setItem(lsKey, String(v))
                        }}
                        className="mt-0.5 accent-green"
                      />
                      <div>
                        <div className="text-sm font-semibold text-ink">{t(item.labelKey)}</div>
                        <div className="text-xs text-ink-mute">{t(item.subKey)}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {profileSaved && (
                <div className="text-sm text-green font-semibold text-center">
                  {t('account.profileSaved')}
                </div>
              )}
              <button
                onClick={() => {
                  updateProfile.mutate(
                    { full_name: settingsForm.name, phone: settingsForm.phone },
                    {
                      onSuccess: () => {
                        setProfileSaved(true)
                        setTimeout(() => setProfileSaved(false), 3000)
                      },
                    },
                  )
                }}
                disabled={updateProfile.isPending}
                className="w-full py-3 bg-green text-white rounded-xl font-semibold hover:bg-green-soft transition-colors disabled:opacity-60"
              >
                {updateProfile.isPending ? t('account.saving') : t('account.saveChanges')}
              </button>

              {/* Password change */}
              <div className="bg-white border border-border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Lock size={16} className="text-ink-mute" />
                  <h3 className="font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
                    {t('account.changePassword')}
                  </h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">{t('account.currentPassword')}</label>
                    <input
                      type="password"
                      value={pwForm.current}
                      onChange={(e) => { setPwForm((f) => ({ ...f, current: e.target.value })); setPwError('') }}
                      className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">{t('account.newPassword')}</label>
                    <input
                      type="password"
                      value={pwForm.next}
                      onChange={(e) => { setPwForm((f) => ({ ...f, next: e.target.value })); setPwError('') }}
                      className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">{t('account.confirmPassword')}</label>
                    <input
                      type="password"
                      value={pwForm.confirm}
                      onChange={(e) => { setPwForm((f) => ({ ...f, confirm: e.target.value })); setPwError('') }}
                      className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  {pwError && <p className="text-xs text-danger font-medium">{pwError}</p>}
                  <button
                    onClick={() => {
                      if (!pwForm.current || !pwForm.next) return
                      if (pwForm.next !== pwForm.confirm) {
                        setPwError(t('account.pwMismatch'))
                        return
                      }
                      changePassword.mutate(
                        { currentPassword: pwForm.current, newPassword: pwForm.next },
                        { onSuccess: () => setPwForm({ current: '', next: '', confirm: '' }) },
                      )
                    }}
                    disabled={changePassword.isPending}
                    className="w-full py-2.5 bg-green text-white rounded-xl font-semibold text-sm hover:bg-green-soft transition-colors disabled:opacity-60"
                  >
                    {changePassword.isPending ? t('account.pwChanging') : t('account.pwChange')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
