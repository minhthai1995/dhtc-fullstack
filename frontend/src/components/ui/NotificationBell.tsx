import { useEffect, useRef, useState } from 'react'
import { Bell, BellRing, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMarkAllRead, useMarkRead, useNotifications, useUnreadCount } from '@/features/notifications/useNotifications'

const TYPE_ICON: Record<string, string> = {
  order_new: '🛒',
  order_confirmed: '✅',
  order_shipped: '🚚',
  order_delivered: '🎉',
  order_cancelled: '❌',
  product_approved: '✅',
  product_rejected: '❌',
  withdrawal_approved: '💰',
  withdrawal_rejected: '❌',
  review_received: '⭐',
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const { data: countData } = useUnreadCount()
  const { data: notifications = [] } = useNotifications()
  const markRead = useMarkRead()
  const markAll = useMarkAllRead()

  const unread = countData?.unread ?? 0

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg hover:bg-cream transition-colors"
        aria-label="Thông báo"
      >
        {unread > 0 ? <BellRing size={18} className="text-ink" /> : <Bell size={18} className="text-ink-mute" />}
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-semibold text-sm text-ink">Thông báo</span>
            {unread > 0 && (
              <button
                onClick={() => markAll.mutate()}
                className="text-xs text-green font-medium flex items-center gap-1 hover:underline"
              >
                <Check size={12} /> Đọc tất cả
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-sm text-ink-mute">
                <Bell size={28} className="mx-auto mb-2 opacity-30" />
                Không có thông báo
              </div>
            ) : (
              notifications.slice(0, 20).map(n => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.is_read) markRead.mutate(n.id)
                    if (n.link) { setOpen(false); navigate(n.link) }
                  }}
                  className={`px-4 py-3 cursor-pointer hover:bg-cream/60 transition-colors ${
                    !n.is_read ? 'bg-green/5 border-l-2 border-green' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg flex-shrink-0 mt-0.5">
                      {TYPE_ICON[n.type] ?? '🔔'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink leading-snug">{n.title}</div>
                      <div className="text-xs text-ink-mute mt-0.5 leading-relaxed">{n.message}</div>
                      <div className="text-[10px] text-ink-mute font-mono mt-1">
                        {new Date(n.created_at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </div>
                    {!n.is_read && <div className="w-2 h-2 bg-green rounded-full flex-shrink-0 mt-1.5" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
