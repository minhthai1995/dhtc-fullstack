import { useState, useRef, useEffect } from 'react'
import { useIntegrations } from '@/features/admin/useAdmin'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import {
  RefreshCw,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  XCircle,
  MessageCircle,
  MinusCircle,
} from 'lucide-react'
import { api } from '@/lib/axios'
import { useToast } from '@/components/ui/Toast'
import { useT } from '@/i18n/useT'
import type { IntegrationHealth } from '@/types/api'

type IntegrationStatus = IntegrationHealth['status']

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

const KEY_TO_DESC_KEY: Record<string, string> = {
  messenger_webhook: 'adminIntegrations.descMessenger',
  facebook_oauth: 'adminIntegrations.descFbOauth',
  ai_chatbot: 'adminIntegrations.descGemini',
  proactive_reply: 'adminIntegrations.descProactive',
}

const STATUS_BADGE_KEY: Record<IntegrationStatus, string> = {
  online: 'adminIntegrations.badgeOnline',
  degraded: 'adminIntegrations.badgeDegraded',
  offline: 'adminIntegrations.badgeOffline',
  not_configured: 'adminIntegrations.badgeNotConfigured',
}

const STATUS_BAR_PCT: Record<IntegrationStatus, number> = {
  online: 100,
  degraded: 60,
  offline: 30,
  not_configured: 0,
}

const SETUP_STEP_KEYS = [
  {
    step: 1,
    titleKey: 'adminIntegrations.step1Title',
    descKey: 'adminIntegrations.step1Desc',
    needsToken: false,
  },
  {
    step: 2,
    titleKey: 'adminIntegrations.step2Title',
    descKey: 'adminIntegrations.step2Desc',
    needsToken: true,
  },
  {
    step: 3,
    titleKey: 'adminIntegrations.step3Title',
    descKey: 'adminIntegrations.step3Desc',
    needsToken: false,
  },
  {
    step: 4,
    titleKey: 'adminIntegrations.step4Title',
    descKey: 'adminIntegrations.step4Desc',
    needsToken: false,
  },
] as const

function statusIcon(status: IntegrationStatus) {
  if (status === 'online') return <CheckCircle size={16} className="text-success" />
  if (status === 'degraded') return <AlertTriangle size={16} className="text-warning" />
  if (status === 'offline') return <XCircle size={16} className="text-danger" />
  return <MinusCircle size={16} className="text-ink-mute" />
}

function formatLastCheck(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString()
}

export function AdminIntegrations() {
  const { t } = useT()
  const { data: integrations, refetch, isFetching } = useIntegrations()
  const toast = useToast()

  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus | null>(null)
  const [isSettingUp, setIsSettingUp] = useState(false)

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'bot', text: t('adminIntegrations.testGreeting') },
  ])
  const [chatInput, setChatInput] = useState('')
  const [isBotTyping, setIsBotTyping] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api
      .get('/webhook/facebook/status')
      .then((r) => setWebhookStatus(r.data))
      .catch(() => {})
  }, [])

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
        toast(t('adminIntegrations.setupSuccess'), 'success')
      } else {
        toast(t('adminIntegrations.setupResult').replace('{data}', JSON.stringify(data)), 'info')
      }
    } catch {
      toast(t('adminIntegrations.setupError'), 'error')
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
        { role: 'bot', text: t('adminIntegrations.testError') },
      ])
    } finally {
      setIsBotTyping(false)
    }
  }

  const source: IntegrationHealth[] = integrations ?? []
  const onlineCount = source.filter((i) => i.status === 'online').length
  const degradedCount = source.filter((i) => i.status === 'degraded').length
  const offlineCount = source.filter(
    (i) => i.status === 'offline' || i.status === 'not_configured',
  ).length

  const verifyToken = webhookStatus?.verify_token || '<VERIFY_TOKEN>'

  const statusBadge = (status: IntegrationStatus) => {
    const variant =
      status === 'online'
        ? 'active'
        : status === 'degraded'
          ? 'pending'
          : status === 'offline'
            ? 'cancelled'
            : 'default'
    return <Badge variant={variant}>{t(STATUS_BADGE_KEY[status])}</Badge>
  }

  return (
    <div>
      <PageHeader
        title={t('adminIntegrations.title')}
        subtitle={t('adminIntegrations.subtitle')}
        actions={
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm font-semibold text-ink-soft hover:border-green hover:text-green transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            {t('adminIntegrations.refresh')}
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
            <div className="text-xs text-ink-mute">{t('adminIntegrations.statusOnline')}</div>
          </div>
        </div>
        <div className="bg-white border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
            <AlertTriangle size={18} className="text-warning" />
          </div>
          <div>
            <div className="text-2xl font-medium text-ink" style={{ fontFamily: 'var(--font-display)' }}>
              {degradedCount}
            </div>
            <div className="text-xs text-ink-mute">{t('adminIntegrations.statusDegraded')}</div>
          </div>
        </div>
        <div className="bg-white border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center">
            <XCircle size={18} className="text-danger" />
          </div>
          <div>
            <div className="text-2xl font-medium text-ink" style={{ fontFamily: 'var(--font-display)' }}>
              {offlineCount}
            </div>
            <div className="text-xs text-ink-mute">{t('adminIntegrations.statusOffline')}</div>
          </div>
        </div>
      </div>

      {/* Integration cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {source.length === 0 ? (
          <div className="md:col-span-2 bg-white border border-border rounded-2xl p-8 text-center text-sm text-ink-mute">
            {t('adminIntegrations.empty')}
          </div>
        ) : (
          source.map((int) => (
            <div key={int.key} className="bg-white border border-border rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className="text-3xl flex-shrink-0">{int.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-ink">{int.name}</h3>
                    {statusBadge(int.status)}
                  </div>
                  <p className="text-xs text-ink-mute mb-3">
                    {KEY_TO_DESC_KEY[int.key] ? t(KEY_TO_DESC_KEY[int.key]) : ''}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[10px] text-ink-mute uppercase tracking-wider mb-1">
                        {t('adminIntegrations.configured')}
                      </div>
                      <div
                        className="text-sm font-semibold text-ink"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {int.configured ? t('adminIntegrations.yes') : t('adminIntegrations.no')}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-ink-mute uppercase tracking-wider mb-1">
                        {t('adminIntegrations.version')}
                      </div>
                      <div
                        className="text-sm font-semibold text-ink"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {int.api_version ?? '—'}
                      </div>
                    </div>
                  </div>

                  {/* Status bar */}
                  <div className="mt-3">
                    <div className="h-1.5 bg-cream-dark rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          int.status === 'online'
                            ? 'bg-success'
                            : int.status === 'degraded'
                              ? 'bg-warning'
                              : int.status === 'offline'
                                ? 'bg-danger'
                                : 'bg-ink-mute/40'
                        }`}
                        style={{ width: `${STATUS_BAR_PCT[int.status]}%` }}
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
                <span>
                  {t('adminIntegrations.lastCheck').replace('{date}', formatLastCheck(int.last_check))}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Facebook Messenger Setup ─────────────────────────────────── */}
      <div className="bg-white border border-border rounded-2xl p-5 mt-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-green/10 flex items-center justify-center">
            <MessageCircle size={20} className="text-green" />
          </div>
          <div>
            <h2
              className="font-semibold text-ink"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t('adminIntegrations.fbTitle')}
            </h2>
            <p className="text-xs text-ink-mute">{t('adminIntegrations.fbSubtitle')}</p>
          </div>
          <div className="ml-auto flex flex-col items-end gap-1">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                webhookStatus?.page_token_configured
                  ? 'bg-green/10 text-green'
                  : 'bg-warning/10 text-warning'
              }`}
            >
              {webhookStatus?.page_token_configured ? t('adminIntegrations.fbOk') : t('adminIntegrations.fbNotConfigured')}
            </span>
            {webhookStatus?.ai_provider && (
              <span className="text-[11px] text-ink-mute px-2">
                {t('adminIntegrations.aiLabel').replace('{provider}', webhookStatus.ai_provider)}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Setup steps */}
          <div>
            <h3 className="text-sm font-bold text-ink mb-3">{t('adminIntegrations.setupGuide')}</h3>
            <ol className="space-y-3 text-sm">
              {SETUP_STEP_KEYS.map(({ step, titleKey, descKey, needsToken }) => {
                const desc = needsToken
                  ? t(descKey).replace('{token}', verifyToken)
                  : t(descKey)
                return (
                  <li key={step} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green text-white text-xs font-bold flex items-center justify-center">
                      {step}
                    </span>
                    <div>
                      <div className="font-semibold text-ink">{t(titleKey)}</div>
                      <div className="text-ink-mute text-xs whitespace-pre-line mt-0.5">{desc}</div>
                    </div>
                  </li>
                )
              })}
            </ol>
            <button
              onClick={handleSetupMessenger}
              disabled={!webhookStatus?.page_token_configured || isSettingUp}
              className="mt-4 w-full py-2.5 px-4 bg-green text-white text-sm font-semibold rounded-xl hover:bg-green-soft transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSettingUp ? t('adminIntegrations.setupBtnLoading') : t('adminIntegrations.setupBtn')}
            </button>
            {!webhookStatus?.page_token_configured && (
              <p className="text-xs text-warning mt-2">
                {t('adminIntegrations.setupHint')}
              </p>
            )}
          </div>

          {/* Live test panel */}
          <div>
            <h3 className="text-sm font-bold text-ink mb-3">{t('adminIntegrations.testTitle')}</h3>
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
                      {t('adminIntegrations.testTyping')}
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
                  placeholder={t('adminIntegrations.testInputPlaceholder')}
                  className="flex-1 px-3 py-2.5 text-sm bg-white focus:outline-none"
                />
                <button
                  onClick={handleSendTest}
                  disabled={!chatInput.trim() || isBotTyping}
                  className="px-4 py-2.5 bg-green text-white text-sm font-semibold hover:bg-green-soft transition-colors disabled:opacity-50"
                >
                  {t('adminIntegrations.testSend')}
                </button>
              </div>
            </div>
            <p className="text-xs text-ink-mute mt-2">
              {t('adminIntegrations.testHint')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
