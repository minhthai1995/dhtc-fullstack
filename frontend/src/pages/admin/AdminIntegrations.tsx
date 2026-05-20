import { useState, useRef, useEffect } from 'react'
import { useIntegrations } from '@/features/admin/useAdmin'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { RefreshCw, ExternalLink, CheckCircle, AlertTriangle, XCircle, MessageCircle } from 'lucide-react'
import { api } from '@/lib/axios'
import { useToast } from '@/components/ui/Toast'

interface IntegrationCard {
  name: string
  description: string
  status: 'online' | 'degraded' | 'offline'
  uptime: number
  latency: number
  lastCheck: string
  apiVersion: string
  icon: string
}

interface WebhookStatus {
  page_token_configured: boolean
  app_secret_configured: boolean
  verify_token: string
  agno_available: string
  ai_provider: string
}

interface ChatMessage {
  role: 'user' | 'bot'
  text: string
}

const MOCK_INTEGRATIONS: IntegrationCard[] = [
  {
    name: 'Vietcombank VietQR',
    description: 'Thanh toán QR Code & chuyển khoản ngân hàng',
    status: 'online',
    uptime: 99.9,
    latency: 142,
    lastCheck: '2026-05-15 14:32',
    apiVersion: 'v2.1',
    icon: '🏦',
  },
  {
    name: 'DHL Express API',
    description: 'Vận chuyển quốc tế & in waybill tự động',
    status: 'online',
    uptime: 99.7,
    latency: 238,
    lastCheck: '2026-05-15 14:31',
    apiVersion: 'v3.0',
    icon: '✈️',
  },
  {
    name: 'Messenger Webhook',
    description: 'Hỗ trợ khách hàng qua Facebook Messenger',
    status: 'online',
    uptime: 98.5,
    latency: 89,
    lastCheck: '2026-05-15 14:30',
    apiVersion: 'v18.0',
    icon: '💬',
  },
  {
    name: 'Zalo OA API',
    description: 'Thông báo đơn hàng & marketing qua Zalo',
    status: 'degraded',
    uptime: 95.2,
    latency: 520,
    lastCheck: '2026-05-15 14:29',
    apiVersion: 'v2.0',
    icon: '📱',
  },
  {
    name: 'AI Chatbot (Gemini)',
    description: 'Chatbot tự động hỗ trợ tư vấn sản phẩm',
    status: 'online',
    uptime: 99.1,
    latency: 320,
    lastCheck: '2026-05-15 14:32',
    apiVersion: 'gemini-1.5',
    icon: '🤖',
  },
  {
    name: 'VNPOST Tracking',
    description: 'Theo dõi vận đơn nội địa VNPOST',
    status: 'offline',
    uptime: 87.3,
    latency: 0,
    lastCheck: '2026-05-15 13:00',
    apiVersion: 'v1.2',
    icon: '📦',
  },
]

function statusIcon(status: 'online' | 'degraded' | 'offline') {
  if (status === 'online') return <CheckCircle size={16} className="text-success" />
  if (status === 'degraded') return <AlertTriangle size={16} className="text-warning" />
  return <XCircle size={16} className="text-danger" />
}

function statusBadge(status: 'online' | 'degraded' | 'offline') {
  if (status === 'online') return <Badge variant="active">Online</Badge>
  if (status === 'degraded') return <Badge variant="pending">Degraded</Badge>
  return <Badge variant="cancelled">Offline</Badge>
}

const SETUP_STEPS = [
  {
    step: 1,
    title: 'Tạo Facebook App',
    desc: 'Vào developers.facebook.com → Create App → Business → thêm Messenger product',
  },
  {
    step: 2,
    title: 'Cấu hình Webhook URL',
    desc: (verifyToken: string) =>
      `Callback URL: https://yourdomain.com/api/v1/webhook/facebook\nVerify Token: ${verifyToken}`,
  },
  {
    step: 3,
    title: 'Cập nhật .env',
    desc: 'FACEBOOK_PAGE_ACCESS_TOKEN=...\nFACEBOOK_APP_SECRET=...',
  },
  {
    step: 4,
    title: 'Đăng ký Get Started + Menu',
    desc: 'Nhấn nút "Setup Messenger Profile" bên dưới để đăng ký tự động',
  },
]

export function AdminIntegrations() {
  const { data: integrations } = useIntegrations()
  const toast = useToast()

  // Webhook status
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus | null>(null)

  // Messenger setup
  const [isSettingUp, setIsSettingUp] = useState(false)

  // Chat test
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'bot', text: 'Xin chào! Tôi là AI chatbot của DHTC. Hãy thử nhắn tin bên dưới!' },
  ])
  const [chatInput, setChatInput] = useState('')
  const [isBotTyping, setIsBotTyping] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  // Load webhook status on mount
  useEffect(() => {
    api
      .get('/webhook/facebook/status')
      .then((r) => setWebhookStatus(r.data))
      .catch(() => {})
  }, [])

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [chatMessages, isBotTyping])

  const handleSetupMessenger = async () => {
    setIsSettingUp(true)
    try {
      const { data } = await api.post('/webhook/facebook/setup')
      if (data.result === 'success') {
        toast('Messenger Profile đã được cài đặt!', 'success')
      } else {
        toast(`Kết quả: ${JSON.stringify(data)}`, 'info')
      }
    } catch {
      toast('Lỗi khi cài đặt Messenger Profile', 'error')
    } finally {
      setIsSettingUp(false)
    }
  }

  const handleSendTest = async () => {
    const msg = chatInput.trim()
    if (!msg || isBotTyping) return
    setChatInput('')
    setChatMessages((prev) => [...prev, { role: 'user', text: msg }])
    setIsBotTyping(true)
    try {
      const { data } = await api.post('/webhook/facebook/test-chat', {
        message: msg,
        user_id: 'admin_test',
      })
      setChatMessages((prev) => [...prev, { role: 'bot', text: data.response }])
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: 'bot', text: 'Lỗi kết nối chatbot. Vui lòng kiểm tra ANTHROPIC_API_KEY.' },
      ])
    } finally {
      setIsBotTyping(false)
    }
  }

  const source = integrations
    ? integrations.map((i) => {
        const mock = MOCK_INTEGRATIONS.find((m) => m.name === i.name)
        return { ...MOCK_INTEGRATIONS[0], ...i, ...(mock ?? {}) }
      })
    : MOCK_INTEGRATIONS

  const onlineCount = source.filter((i) => i.status === 'online').length
  const degradedCount = source.filter((i) => i.status === 'degraded').length
  const offlineCount = source.filter((i) => i.status === 'offline').length

  const verifyToken = webhookStatus?.verify_token ?? 'dhtc_webhook_2026'

  return (
    <div>
      <PageHeader
        title="Tích hợp API"
        subtitle="Giám sát trạng thái các kết nối bên thứ ba"
        actions={
          <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm font-semibold text-ink-soft hover:border-green hover:text-green transition-colors">
            <RefreshCw size={14} />
            Làm mới
          </button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green/10 flex items-center justify-center">
            <CheckCircle size={18} className="text-success" />
          </div>
          <div>
            <div className="text-2xl font-medium text-ink" style={{ fontFamily: 'var(--font-display)' }}>
              {onlineCount}
            </div>
            <div className="text-xs text-ink-mute">Online</div>
          </div>
        </div>
        <div className="bg-white border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <AlertTriangle size={18} className="text-warning" />
          </div>
          <div>
            <div className="text-2xl font-medium text-ink" style={{ fontFamily: 'var(--font-display)' }}>
              {degradedCount}
            </div>
            <div className="text-xs text-ink-mute">Suy giảm</div>
          </div>
        </div>
        <div className="bg-white border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <XCircle size={18} className="text-danger" />
          </div>
          <div>
            <div className="text-2xl font-medium text-ink" style={{ fontFamily: 'var(--font-display)' }}>
              {offlineCount}
            </div>
            <div className="text-xs text-ink-mute">Offline</div>
          </div>
        </div>
      </div>

      {/* Integration cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {source.map((int) => (
          <div key={int.name} className="bg-white border border-border rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="text-3xl flex-shrink-0">{int.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-ink">{int.name}</h3>
                  {statusBadge(int.status)}
                </div>
                <p className="text-xs text-ink-mute mb-3">{int.description}</p>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-[10px] text-ink-mute uppercase tracking-wider mb-1">Uptime</div>
                    <div
                      className="text-sm font-semibold text-ink"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {int.uptime}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-ink-mute uppercase tracking-wider mb-1">Latency</div>
                    <div
                      className="text-sm font-semibold text-ink"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {int.latency > 0 ? `${int.latency}ms` : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-ink-mute uppercase tracking-wider mb-1">Version</div>
                    <div
                      className="text-sm font-semibold text-ink"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {int.apiVersion}
                    </div>
                  </div>
                </div>

                {/* Uptime bar */}
                <div className="mt-3">
                  <div className="h-1.5 bg-cream-dark rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        int.status === 'online'
                          ? 'bg-success'
                          : int.status === 'degraded'
                          ? 'bg-warning'
                          : 'bg-danger'
                      }`}
                      style={{ width: `${int.uptime}%` }}
                    />
                  </div>
                </div>
              </div>

              <button className="text-ink-mute hover:text-ink transition-colors flex-shrink-0">
                <ExternalLink size={14} />
              </button>
            </div>

            <div
              className="mt-3 pt-3 border-t border-border text-[11px] text-ink-mute flex items-center gap-1"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {statusIcon(int.status)}
              <span>Kiểm tra lần cuối: {int.lastCheck}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Facebook Messenger Setup ─────────────────────────────────── */}
      <div className="bg-white border border-border rounded-2xl p-5 mt-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <MessageCircle size={20} className="text-blue-600" />
          </div>
          <div>
            <h2
              className="font-semibold text-ink"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Facebook Messenger Chatbot
            </h2>
            <p className="text-xs text-ink-mute">Kết nối AI chatbot với Fanpage DHTC</p>
          </div>
          <div className="ml-auto flex flex-col items-end gap-1">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                webhookStatus?.page_token_configured
                  ? 'bg-green/10 text-green'
                  : 'bg-amber-50 text-amber-600'
              }`}
            >
              {webhookStatus?.page_token_configured ? '● Facebook OK' : '○ Chưa cấu hình Facebook'}
            </span>
            {webhookStatus?.ai_provider && (
              <span className="text-[11px] text-ink-mute px-2">
                AI: {webhookStatus.ai_provider}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Setup steps */}
          <div>
            <h3 className="text-sm font-bold text-ink mb-3">Hướng dẫn cài đặt</h3>
            <ol className="space-y-3 text-sm">
              {SETUP_STEPS.map(({ step, title, desc }) => (
                <li key={step} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green text-white text-xs font-bold flex items-center justify-center">
                    {step}
                  </span>
                  <div>
                    <div className="font-semibold text-ink">{title}</div>
                    <div className="text-ink-mute text-xs whitespace-pre-line mt-0.5">
                      {typeof desc === 'function' ? desc(verifyToken) : desc}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            <button
              onClick={handleSetupMessenger}
              disabled={!webhookStatus?.page_token_configured || isSettingUp}
              className="mt-4 w-full py-2.5 px-4 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSettingUp ? 'Đang cài đặt...' : 'Setup Messenger Profile'}
            </button>
            {!webhookStatus?.page_token_configured && (
              <p className="text-xs text-amber-600 mt-2">
                Cần cấu hình FACEBOOK_PAGE_ACCESS_TOKEN trước
              </p>
            )}
          </div>

          {/* Live test panel */}
          <div>
            <h3 className="text-sm font-bold text-ink mb-3">Test Chatbot</h3>
            <div className="border border-border rounded-xl overflow-hidden">
              {/* Chat messages */}
              <div className="h-48 overflow-y-auto p-3 space-y-2 bg-cream" ref={chatRef}>
                {chatMessages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                        m.role === 'user'
                          ? 'bg-green text-white rounded-br-none'
                          : 'bg-white border border-border text-ink rounded-bl-none'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                {isBotTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-border px-3 py-2 rounded-2xl rounded-bl-none text-ink-mute text-xs">
                      Đang trả lời...
                    </div>
                  </div>
                )}
              </div>
              {/* Input */}
              <div className="border-t border-border flex">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendTest()}
                  placeholder="Nhắn tin thử... (vd: tìm cà phê)"
                  className="flex-1 px-3 py-2.5 text-sm bg-white focus:outline-none"
                />
                <button
                  onClick={handleSendTest}
                  disabled={!chatInput.trim() || isBotTyping}
                  className="px-4 py-2.5 bg-green text-white text-sm font-semibold hover:bg-green-soft transition-colors disabled:opacity-50"
                >
                  Gửi
                </button>
              </div>
            </div>
            <p className="text-xs text-ink-mute mt-2">
              Test trực tiếp chatbot AI, không cần Facebook credentials
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
