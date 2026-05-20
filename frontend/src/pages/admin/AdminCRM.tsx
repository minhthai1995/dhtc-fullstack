import { useEffect, useMemo, useState } from "react"
import { KpiCard } from "@/components/ui/KpiCard"
import { PageHeader } from "@/components/ui/PageHeader"
import { Badge } from "@/components/ui/Badge"
import {
  useCRMStats, useCRMFunnel, useCRMSegments, useCRMCustomers, useCRMCustomer,
  useCRMDemographics, useCRMConversationOverview, useCRMConversations,
  useCRMConversationMessages, useCRMConversationProfile,
  useBehaviorOverview, useBehaviorSessions,
} from "@/features/admin/useAdmin"
import type {
  CustomerRow, DemographicBucket, IntentBucket, TrendPoint, ConversationSummary,
  BehaviorBucket, TopPage, BehaviorFunnelStage, SessionSummary,
} from "@/features/admin/admin.api"

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtMoney = (n: number) => {
  if (n >= 1_000_000) return `₫${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₫${(n / 1_000).toFixed(0)}K`
  return `₫${n.toFixed(0)}`
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })

const fmtRelative = (iso: string | null) => {
  if (!iso) return "—"
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "vừa xong"
  if (mins < 60) return `${mins} phút trước`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} ngày trước`
  return fmtDate(iso)
}

const display: React.CSSProperties = { fontFamily: "var(--font-display)" }
const mono: React.CSSProperties = { fontFamily: "var(--font-mono)" }

const SEGMENT_OPTS = [
  { key: "all",       label: "Tất cả" },
  { key: "new",       label: "Khách mới" },
  { key: "returning", label: "Quay lại" },
  { key: "at_risk",   label: "Nguy cơ" },
  { key: "no_order",  label: "Chưa mua" },
]

function segBadge(seg: string): { variant: "active"|"processing"|"pending"|"default"; label: string } {
  const map: Record<string, "active"|"processing"|"pending"|"default"> = {
    new: "active", returning: "processing", at_risk: "pending", no_order: "default",
  }
  const labels: Record<string, string> = {
    new: "Mới", returning: "Quay lại", at_risk: "Nguy cơ", no_order: "Chưa mua",
  }
  return { variant: map[seg] ?? "default", label: labels[seg] ?? seg }
}

// ── Reusable atoms ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold tracking-[.08em] uppercase text-ink-mute mb-3">
      {children}
    </div>
  )
}

function ThinBar({ label, pct, value }: { label: string; pct: number; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[12.5px] font-medium flex-1 truncate">{label}</span>
      <div className="flex-[2] h-1.5 bg-cream-dark rounded-full overflow-hidden">
        <div className="h-full bg-green rounded-full" style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
      <span className="text-[11px] text-ink-soft min-w-[48px] text-right" style={mono}>{value}</span>
    </div>
  )
}

function SourceBadge({ variant }: { variant: "messenger" | "web" | "lead" }) {
  const map = {
    messenger: { label: "Messenger", bg: "bg-green/10",       fg: "text-green" },
    web:       { label: "Web",       bg: "bg-cream-dark",     fg: "text-ink-soft" },
    lead:      { label: "Lead",      bg: "bg-cream-dark/60",  fg: "text-ink-mute" },
  }
  const s = map[variant]
  return (
    <span className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-[.06em] px-2 py-0.5 rounded-full ${s.bg} ${s.fg}`}>
      {s.label}
    </span>
  )
}

function CountryFlag({ code }: { code: "VN" | "OTHER" | null }) {
  if (code === "VN") return <span className="inline-flex items-center gap-1 text-[12px]"><span aria-hidden>🇻🇳</span><span className="text-ink-soft">VN</span></span>
  if (code === "OTHER") return <span className="inline-flex items-center gap-1 text-[12px]"><span aria-hidden>🌍</span><span className="text-ink-soft">Khác</span></span>
  return <span className="text-ink-mute text-[12px]">—</span>
}

function MiniBarChart({ data, highlightLast = true }: { data: TrendPoint[]; highlightLast?: boolean }) {
  if (data.length === 0) return <div className="text-[11px] text-ink-mute italic">Chưa có dữ liệu</div>
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="flex items-end gap-1.5 h-20">
      {data.map((d, i) => {
        const pct = (d.count / max) * 100
        const isLast = highlightLast && i === data.length - 1
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full flex-1 flex items-end">
              <div
                className={`w-full rounded-t-sm ${isLast ? "bg-green" : "bg-cream-dark"}`}
                style={{ height: `${Math.max(pct, 4)}%` }}
              />
            </div>
            <div className="text-[9px] text-ink-mute" style={mono}>
              {new Date(d.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
            </div>
            <div className="text-[10px] text-ink-soft font-semibold" style={mono}>{d.count}</div>
          </div>
        )
      })}
    </div>
  )
}

function HourlyBarChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-[2px] h-16">
      {data.map((v, i) => {
        const pct = (v / max) * 100
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex-1 flex items-end">
              <div
                className="w-full bg-cream-dark rounded-t-sm"
                style={{ height: `${Math.max(pct, 2)}%` }}
              />
            </div>
            {i % 4 === 0 && <span className="text-[8.5px] text-ink-mute" style={mono}>{i}h</span>}
          </div>
        )
      })}
    </div>
  )
}

function EmptyState({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <p className="text-[12px] text-ink-soft font-medium">{label}</p>
      {hint && <p className="text-[10.5px] text-ink-mute italic mt-1">{hint}</p>}
    </div>
  )
}

const INTENT_ICON: Record<string, string> = {
  product_search: "📦",
  price_inquiry: "💰",
  order_lookup: "🧾",
  shipping_inquiry: "🚚",
  complaint: "⚠️",
}

// ── Tab: Tổng quan ────────────────────────────────────────────────────────────
function OverviewTab() {
  const { data: stats, isLoading } = useCRMStats()
  const { data: funnel = [] } = useCRMFunnel()
  const { data: segments } = useCRMSegments()

  const maxFunnel = funnel.length > 0 ? Math.max(...funnel.map((s) => s.count), 1) : 1

  const segRows = segments
    ? [
        { label: "Khách mới",  count: segments.new_customers },
        { label: "Quay lại",   count: segments.returning     },
        { label: "Nguy cơ",    count: segments.at_risk       },
        { label: "Chưa mua",   count: segments.no_order      },
      ]
    : []
  const maxSeg = Math.max(...segRows.map((s) => s.count), 1)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Liên hệ Messenger"
          value={isLoading ? "—" : (stats?.messenger_contacts ?? 0)}
          delta="Unique users"
          deltaType="up"
        />
        <KpiCard
          label="Khách đăng ký"
          value={isLoading ? "—" : (stats?.total_customers ?? 0)}
          delta={stats ? `+${stats.new_this_month} tháng này` : "—"}
          deltaType="up"
        />
        <KpiCard
          label="Tỉ lệ quay lại"
          value={
            stats && stats.buyers > 0
              ? `${((stats.repeat_buyers / stats.buyers) * 100).toFixed(0)}%`
              : "—"
          }
          delta={`${stats?.repeat_buyers ?? 0} khách 2+ đơn`}
          deltaType="up"
        />
        <KpiCard
          label="AOV đơn đã giao"
          value={stats ? fmtMoney(stats.avg_order_value) : "—"}
          delta={`${stats?.buyers ?? 0} khách đã mua`}
          deltaType="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink text-sm" style={display}>Phễu khách hàng</h2>
          </div>
          <div className="space-y-2.5">
            {funnel.map((stage, i) => {
              const pct = maxFunnel > 0 ? (stage.count / maxFunnel) * 100 : 0
              const prevCount = i > 0 ? funnel[i - 1].count : stage.count
              const convPct = prevCount > 0 ? ((stage.count / prevCount) * 100).toFixed(0) : "—"
              return (
                <div key={stage.key} className="space-y-1">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-medium text-ink">{stage.stage}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink" style={display}>{stage.count.toLocaleString()}</span>
                      {i > 0 && <span className="text-[10px] text-ink-mute" style={mono}>{convPct}%</span>}
                    </div>
                  </div>
                  <div className="h-1.5 bg-cream-dark rounded-full overflow-hidden">
                    <div className="h-full bg-green rounded-full" style={{ width: `${Math.max(pct, 2)}%` }} />
                  </div>
                </div>
              )
            })}
            {funnel.length === 0 && <EmptyState label="Chưa có dữ liệu phễu" />}
          </div>
        </div>

        <div className="bg-white border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink text-sm" style={display}>Phân khúc khách hàng</h2>
          </div>
          <div className="space-y-3">
            {segRows.map((s) => (
              <ThinBar
                key={s.label}
                label={s.label}
                pct={(s.count / maxSeg) * 100}
                value={s.count.toLocaleString()}
              />
            ))}
            {segRows.length === 0 && <EmptyState label="Chưa có dữ liệu phân khúc" />}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Tab: Khách hàng ───────────────────────────────────────────────────────────
function DemographicsCard({ title, items, emptyHint }: {
  title: string; items: DemographicBucket[]; emptyHint?: string
}) {
  const total = items.reduce((sum, it) => sum + it.count, 0)
  return (
    <div className="bg-white border border-border rounded-2xl p-5">
      <SectionLabel>{title}</SectionLabel>
      {items.length === 0 ? (
        <EmptyState label="Chưa có dữ liệu tracking" hint={emptyHint} />
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <ThinBar
              key={it.key}
              label={it.label}
              pct={total > 0 ? (it.count / total) * 100 : 0}
              value={it.count.toLocaleString()}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CustomersTab() {
  const [segment, setSegment] = useState("all")
  const [q, setQ] = useState("")
  const [debouncedQ, setDebouncedQ] = useState("")
  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(t)
  }, [q])

  const params = {
    ...(segment !== "all" ? { segment } : {}),
    ...(debouncedQ ? { q: debouncedQ } : {}),
    limit: 100,
  }
  const { data: customers = [], isLoading } = useCRMCustomers(params)
  const { data: detail } = useCRMCustomer(selectedId)
  const { data: demographics } = useCRMDemographics()

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <DemographicsCard title="Theo nguồn" items={demographics?.by_source ?? []} />
        <DemographicsCard title="Theo quốc gia" items={demographics?.by_country ?? []} />
        <DemographicsCard
          title="Theo thiết bị"
          items={demographics?.by_device ?? []}
          emptyHint="Cần page tracking (P2)"
        />
      </div>

      <div className="flex gap-5 flex-col lg:flex-row" style={{ minHeight: "60vh" }}>
        <div className="flex-1 min-w-0 flex flex-col bg-white border border-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border space-y-2.5">
            <div className="flex items-center gap-2 bg-cream-dark rounded-lg px-3 py-2 border border-border">
              <svg className="w-4 h-4 text-ink-mute flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm email, tên…"
                className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-mute"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {SEGMENT_OPTS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSegment(s.key)}
                  className={`text-[11.5px] px-3 py-1 rounded-full font-medium transition-colors border ${
                    segment === s.key
                      ? "bg-green text-cream border-green"
                      : "bg-transparent text-ink-soft border-border hover:border-green/40 hover:text-ink"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="p-8 text-center text-ink-mute text-sm">Đang tải...</div>
            ) : customers.length === 0 ? (
              <div className="p-8 text-center text-ink-mute text-sm">Không có khách hàng</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-cream-dark/80 backdrop-blur border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-[.08em] text-ink-mute">Khách hàng</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-[.08em] text-ink-mute hidden sm:table-cell">Nguồn</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-[.08em] text-ink-mute hidden md:table-cell">Quốc gia</th>
                    <th className="text-right px-4 py-2.5 text-[10px] font-bold uppercase tracking-[.08em] text-ink-mute">Đơn</th>
                    <th className="text-right px-4 py-2.5 text-[10px] font-bold uppercase tracking-[.08em] text-ink-mute hidden md:table-cell">Chi tiêu</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-[.08em] text-ink-mute hidden lg:table-cell">Lần cuối</th>
                    <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[.08em] text-ink-mute">Phân khúc</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c: CustomerRow) => {
                    const { variant, label } = segBadge(c.segment)
                    const initials = (c.full_name || c.email).slice(0, 1).toUpperCase()
                    const sourceVariant: "messenger" | "web" | "lead" =
                      c.order_count > 0 ? "web" : "lead"
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedId(c.id === selectedId ? null : c.id)}
                        className={`border-b border-border cursor-pointer hover:bg-cream transition-colors ${
                          selectedId === c.id ? "bg-cream border-l-4 border-l-green" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                              style={{ background: "var(--color-green)" }}
                            >
                              {initials}
                            </div>
                            <div>
                              <div className="font-semibold text-[12.5px] text-ink leading-tight truncate max-w-[140px]">
                                {c.full_name || "—"}
                              </div>
                              <div className="text-[10.5px] text-ink-mute truncate max-w-[140px]">{c.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <SourceBadge variant={sourceVariant} />
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <CountryFlag code={c.phone ? "VN" : null} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-[13px] font-semibold text-ink" style={mono}>{c.order_count}</span>
                        </td>
                        <td className="px-4 py-3 text-right hidden md:table-cell">
                          <span className="text-[13px] text-ink" style={display}>
                            {fmtMoney(c.total_spent)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-ink-mute hidden lg:table-cell">
                          {fmtRelative(c.last_order_date)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={variant}>{label}</Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="px-4 py-2 border-t border-border">
            <span className="text-[11px] text-ink-mute" style={mono}>{customers.length} khách hàng</span>
          </div>
        </div>

        {selectedId && detail && (
          <div className="w-full lg:w-72 flex-shrink-0 bg-white border border-border rounded-2xl overflow-y-auto">
            <div className="p-5 border-b border-border">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0"
                    style={{ background: "var(--color-green)" }}
                  >
                    {(detail.full_name || detail.email).slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-[13px] text-ink leading-tight">{detail.full_name || "Khách hàng"}</div>
                    <div className="text-[10.5px] text-ink-mute mt-0.5">{detail.email}</div>
                    {detail.phone && <div className="text-[10.5px] text-ink-mute" style={mono}>{detail.phone}</div>}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  className="text-ink-mute hover:text-ink text-lg leading-none flex-shrink-0 mt-0.5"
                >×</button>
              </div>
              <Badge variant={segBadge(detail.segment).variant}>{segBadge(detail.segment).label}</Badge>
            </div>

            <div className="p-4 border-b border-border">
              <SectionLabel>Tổng quan</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-cream rounded-xl p-3 text-center">
                  <div className="text-[22px] font-semibold text-ink leading-tight" style={display}>{detail.order_count}</div>
                  <div className="text-[10px] text-ink-mute mt-0.5">Tổng đơn</div>
                </div>
                <div className="bg-cream rounded-xl p-3 text-center">
                  <div className="text-[18px] font-semibold text-green leading-tight" style={display}>{fmtMoney(detail.total_spent)}</div>
                  <div className="text-[10px] text-ink-mute mt-0.5">Chi tiêu</div>
                </div>
              </div>
              <div className="mt-2 bg-cream rounded-xl p-2.5 text-center">
                <div className="text-[10px] text-ink-mute">Ngày đăng ký</div>
                <div className="text-[12px] font-medium text-ink mt-0.5">{fmtDate(detail.created_at)}</div>
              </div>
            </div>

            <div className="p-4">
              <SectionLabel>Lịch sử đơn hàng</SectionLabel>
              {detail.orders.length === 0 ? (
                <p className="text-[12px] text-ink-mute italic">Chưa có đơn hàng</p>
              ) : (
                <div className="space-y-2.5">
                  {detail.orders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between py-2 border-b border-border/60 last:border-0">
                      <div>
                        <div className="text-[12px] font-semibold text-ink" style={mono}>#{o.id}</div>
                        <div className="text-[10.5px] text-ink-mute">{fmtDate(o.created_at)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[13px] text-green font-medium mb-0.5" style={display}>{fmtMoney(o.total_amount)}</div>
                        <Badge
                          variant={
                            o.status === "delivered" ? "delivered"
                            : o.status === "cancelled" ? "cancelled"
                            : o.status === "shipped" ? "shipped"
                            : "pending"
                          }
                        >{o.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Tab: Hội thoại ────────────────────────────────────────────────────────────
function ConversationsTab() {
  const [openSession, setOpenSession] = useState<string | null>(null)
  const { data: overview } = useCRMConversationOverview()
  const { data: conversations = [], isLoading } = useCRMConversations()

  const channelTotal = conversations.length || 1
  const maxIntent = Math.max(...(overview?.intent_breakdown.map((i) => i.count) ?? [1]), 1)
  const funnel = overview?.funnel ?? []

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Hội thoại hôm nay"
          value={overview ? overview.stats.total_today : "—"}
          delta="unique users"
          deltaType="up"
        />
        <KpiCard
          label="Tin nhắn hôm nay"
          value={overview ? overview.stats.total_messages_today : "—"}
          delta="inbound + outbound"
          deltaType="up"
        />
        <KpiCard
          label="Thời gian phản hồi"
          value="—"
          delta="Chưa đo được"
          deltaType="up"
        />
        <KpiCard
          label="Tỉ lệ chuyển đổi"
          value="—"
          delta="Chưa đo được"
          deltaType="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-border rounded-2xl p-5">
          <SectionLabel>Phân loại ý định (30 ngày)</SectionLabel>
          {!overview ? (
            <EmptyState label="Đang tải..." />
          ) : overview.intent_breakdown.every((i) => i.count === 0) ? (
            <EmptyState label="Chưa có tin nhắn để phân loại" />
          ) : (
            <div className="space-y-3">
              {overview.intent_breakdown.map((it: IntentBucket) => (
                <div key={it.key} className="flex items-center gap-2.5">
                  <span className="text-[13px] flex-shrink-0" aria-hidden>{INTENT_ICON[it.key] ?? "•"}</span>
                  <span className="text-[12px] font-medium min-w-[120px] text-ink">{it.label}</span>
                  <div className="flex-1 h-1.5 bg-cream-dark rounded-full overflow-hidden">
                    <div className="h-full bg-green rounded-full" style={{ width: `${(it.count / maxIntent) * 100}%` }} />
                  </div>
                  <span className="text-[10.5px] text-ink-mute min-w-[24px] text-right" style={mono}>{it.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-border rounded-2xl p-5">
          <SectionLabel>Tin nhắn 7 ngày qua</SectionLabel>
          {overview ? (
            <MiniBarChart data={overview.trend_7d} highlightLast />
          ) : (
            <EmptyState label="Đang tải..." />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-border rounded-2xl p-5">
          <SectionLabel>Phễu hội thoại</SectionLabel>
          {funnel.length === 0 ? (
            <EmptyState label="Chưa có dữ liệu" />
          ) : (
            <div className="space-y-2.5">
              {(() => {
                const max = Math.max(...funnel.map((f) => f.count), 1)
                return funnel.map((stage, i) => {
                  const prev = i > 0 ? funnel[i - 1].count : stage.count
                  const conv = prev > 0 ? ((stage.count / prev) * 100).toFixed(0) : "—"
                  return (
                    <div key={stage.key} className="space-y-1">
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="font-medium text-ink">{stage.stage}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink" style={display}>{stage.count.toLocaleString()}</span>
                          {i > 0 && <span className="text-[10px] text-ink-mute" style={mono}>{conv}%</span>}
                        </div>
                      </div>
                      <div className="h-1.5 bg-cream-dark rounded-full overflow-hidden">
                        <div className="h-full bg-green rounded-full" style={{ width: `${Math.max((stage.count / max) * 100, 2)}%` }} />
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          )}
        </div>

        <div className="bg-white border border-border rounded-2xl p-5">
          <SectionLabel>Phân kênh</SectionLabel>
          <ThinBar
            label="Messenger"
            pct={100}
            value={`${channelTotal === 1 && conversations.length === 0 ? 0 : conversations.length}`}
          />
          <p className="text-[10.5px] text-ink-mute italic mt-3">Web chat chưa kích hoạt</p>
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-ink text-sm" style={display}>Hội thoại gần đây</h2>
          <span className="text-[11px] text-ink-mute" style={mono}>{conversations.length} cuộc</span>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-ink-mute text-sm">Đang tải...</div>
        ) : conversations.length === 0 ? (
          <EmptyState label="Chưa có hội thoại nào" hint="Tin nhắn Messenger sẽ xuất hiện ở đây" />
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-dark/80 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-[.08em] text-ink-mute">Khách</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-[.08em] text-ink-mute hidden sm:table-cell">Kênh</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-[.08em] text-ink-mute">Tin cuối</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-[.08em] text-ink-mute hidden md:table-cell">Thời gian</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-bold uppercase tracking-[.08em] text-ink-mute">Tin nhắn</th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((c: ConversationSummary) => (
                  <tr
                    key={c.session_id}
                    onClick={() => setOpenSession(c.session_id)}
                    className="border-b border-border cursor-pointer hover:bg-cream transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                          style={{ background: "var(--color-green)" }}
                        >
                          {c.fb_user_id.slice(-2).toUpperCase()}
                        </div>
                        <span className="text-[12px] font-medium text-ink" style={mono}>…{c.fb_user_id.slice(-8)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell"><SourceBadge variant="messenger" /></td>
                    <td className="px-4 py-3 text-[12px] text-ink-soft truncate max-w-[280px]">{c.last_message || "—"}</td>
                    <td className="px-4 py-3 text-[11px] text-ink-mute hidden md:table-cell" style={mono}>{fmtTime(c.last_activity)}</td>
                    <td className="px-4 py-3 text-right text-[12px] font-semibold text-ink" style={mono}>{c.message_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {openSession && (
        <ConversationDetailDrawer
          sessionId={openSession}
          conversations={conversations}
          onSelect={setOpenSession}
          onClose={() => setOpenSession(null)}
        />
      )}
    </div>
  )
}

function ConversationDetailDrawer({ sessionId, conversations, onSelect, onClose }: {
  sessionId: string
  conversations: ConversationSummary[]
  onSelect: (sid: string) => void
  onClose: () => void
}) {
  const { data: messages = [], isLoading: loadingMsgs } = useCRMConversationMessages(sessionId)
  const { data: profile } = useCRMConversationProfile(sessionId)
  const selected = conversations.find((c) => c.session_id === sessionId)

  return (
    <div className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm flex items-stretch" onClick={onClose}>
      <div
        className="ml-auto bg-cream w-full max-w-[1200px] h-full flex shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left — inbox */}
        <div className="w-[270px] flex-shrink-0 bg-white border-r border-border flex flex-col hidden md:flex">
          <div className="px-4 py-3.5 border-b border-border flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-ink" style={display}>Inbox</span>
            <span className="text-[10.5px] text-ink-mute" style={mono}>{conversations.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((c) => (
              <div
                key={c.session_id}
                onClick={() => onSelect(c.session_id)}
                className={`flex items-start gap-2.5 px-4 py-3 border-b border-border/60 cursor-pointer hover:bg-cream transition-colors ${
                  c.session_id === sessionId ? "bg-cream border-l-4 border-l-green" : ""
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 mt-0.5"
                  style={{ background: "var(--color-green)" }}
                >
                  {c.fb_user_id.slice(-2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-[12px] font-semibold text-ink truncate">…{c.fb_user_id.slice(-8)}</span>
                    <span className="text-[9.5px] text-ink-mute whitespace-nowrap flex-shrink-0" style={mono}>
                      {fmtTime(c.last_activity)}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-mute truncate">{c.last_message || "—"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center — thread */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-5 py-3.5 border-b border-border bg-white flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-[12.5px] font-semibold text-ink truncate">User {selected?.fb_user_id ?? sessionId}</div>
              <div className="text-[10.5px] text-ink-mute truncate" style={mono}>Session: {sessionId}</div>
            </div>
            <button onClick={onClose} className="text-ink-mute hover:text-ink text-xl leading-none flex-shrink-0">×</button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-cream/30">
            {loadingMsgs ? (
              <div className="text-center text-ink-mute text-[12px] mt-10">Đang tải...</div>
            ) : messages.length === 0 ? (
              <EmptyState label="Hội thoại chưa có tin nhắn" />
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[72%] px-3.5 py-2 rounded-2xl text-[12.5px] whitespace-pre-wrap ${
                      m.direction === "outbound"
                        ? "rounded-br-sm text-white"
                        : "bg-white text-ink rounded-bl-sm shadow-sm border border-border"
                    }`}
                    style={m.direction === "outbound" ? { background: "var(--color-green)" } : {}}
                  >
                    {m.content}
                    <div className={`text-[9.5px] mt-1 ${m.direction === "outbound" ? "text-white/60" : "text-ink-mute"}`} style={mono}>
                      {new Date(m.created_at).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right — profile */}
        <div className="w-[260px] flex-shrink-0 bg-white border-l border-border flex-col overflow-y-auto hidden lg:flex">
          <div className="p-5 border-b border-border text-center">
            <div
              className="w-14 h-14 rounded-full mx-auto flex items-center justify-center text-[16px] font-bold text-white"
              style={{ background: "var(--color-green)" }}
            >
              {(selected?.fb_user_id || "??").slice(-2).toUpperCase()}
            </div>
            <div className="font-semibold text-[13px] text-ink mt-2">
              {profile?.linked_user?.full_name || `User …${(selected?.fb_user_id || "").slice(-6)}`}
            </div>
            {profile?.linked_user?.phone && (
              <div className="text-[10.5px] text-ink-mute mt-1" style={mono}>{profile.linked_user.phone}</div>
            )}
            {profile?.linked_user?.email && (
              <div className="text-[10.5px] text-ink-mute truncate">{profile.linked_user.email}</div>
            )}
            <div className="mt-2 flex items-center justify-center gap-2">
              <SourceBadge variant="messenger" />
              {profile?.linked_user && <Badge variant="active">Đã liên kết</Badge>}
            </div>
          </div>

          <div className="p-4 border-b border-border">
            <SectionLabel>Hoạt động</SectionLabel>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-cream rounded-xl p-2.5 text-center">
                <div className="text-[16px] font-semibold text-ink leading-tight" style={display}>{profile?.message_count ?? "—"}</div>
                <div className="text-[10px] text-ink-mute mt-0.5">Tin nhắn</div>
              </div>
              <div className="bg-cream rounded-xl p-2.5 text-center">
                <div className="text-[16px] font-semibold text-ink leading-tight" style={display}>
                  {profile?.linked_user?.order_count ?? "—"}
                </div>
                <div className="text-[10px] text-ink-mute mt-0.5">Đơn</div>
              </div>
            </div>
            {profile && (
              <div className="mt-2 bg-cream rounded-xl p-2.5">
                <div className="flex items-center justify-between text-[10.5px] text-ink-mute"><span>Lần đầu</span><span style={mono}>{fmtTime(profile.first_seen)}</span></div>
                <div className="flex items-center justify-between text-[10.5px] text-ink-mute mt-0.5"><span>Gần nhất</span><span style={mono}>{fmtTime(profile.last_seen)}</span></div>
              </div>
            )}
          </div>

          <div className="p-4">
            <SectionLabel>Ý định gần đây</SectionLabel>
            {!profile || profile.intent_history.length === 0 ? (
              <p className="text-[11px] text-ink-mute italic">Chưa phát hiện ý định rõ ràng</p>
            ) : (
              <div className="space-y-2">
                {profile.intent_history.map((it) => (
                  <div key={it.key} className="flex items-center justify-between text-[11.5px]">
                    <span className="flex items-center gap-1.5 text-ink">
                      <span aria-hidden>{INTENT_ICON[it.key] ?? "•"}</span>
                      {it.label}
                    </span>
                    <span className="text-ink-mute" style={mono}>{it.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Tab: Hành vi ──────────────────────────────────────────────────────────────
const DEVICE_LABELS: Record<string, string> = {
  mobile: "Mobile", desktop: "Desktop", tablet: "Tablet", unknown: "Khác",
}
const SOURCE_LABELS: Record<string, string> = {
  direct: "Direct", google: "Google", facebook: "Facebook", other: "Khác",
}
const FUNNEL_LABELS: Record<BehaviorFunnelStage["key"], string> = {
  view_product: "Xem sản phẩm",
  add_to_cart:  "Vào giỏ hàng",
  checkout:     "Tới checkout",
  complete:     "Hoàn tất đặt",
}

function bucketTotal(buckets: BehaviorBucket[]): number {
  return buckets.reduce((sum, b) => sum + b.count, 0)
}

function BehaviorTab() {
  const { data: overview, isLoading, isError } = useBehaviorOverview()
  const { data: sessions = [] } = useBehaviorSessions({ limit: 20 })
  const hourlyData = useMemo(
    () => overview?.hourly_24h.map((b) => b.count) ?? Array.from({ length: 24 }, () => 0),
    [overview],
  )

  if (isLoading) {
    return (
      <div className="space-y-5">
        <EmptyState label="Đang tải dữ liệu hành vi..." />
      </div>
    )
  }
  if (isError || !overview) {
    return (
      <div className="space-y-5">
        <EmptyState label="Không tải được dữ liệu hành vi" hint="Thử lại sau hoặc kiểm tra backend" />
      </div>
    )
  }

  const { stats, by_device, by_source, top_pages, funnel } = overview
  const totalPageviews = bucketTotal(by_device)
  const deviceTotal = totalPageviews || 1
  const sourceTotal = bucketTotal(by_source) || 1
  const topPageMax = Math.max(...top_pages.map((p) => p.count), 1)
  const funnelMax = Math.max(...funnel.map((s) => s.count), 1)

  const bounceLabel = stats.bounce_rate == null ? "—" : `${Math.round(stats.bounce_rate * 100)}%`
  const pagesPerSession = stats.pages_per_session == null
    ? "—" : stats.pages_per_session.toFixed(1)
  const avgDuration = stats.avg_duration_sec == null
    ? "—" : `${Math.round(stats.avg_duration_sec)}s`

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Phiên hôm nay"  value={String(stats.total_sessions)} delta="Hôm nay"   deltaType="up" />
        <KpiCard label="Pageviews"      value={String(totalPageviews)}       delta="Hôm nay"   deltaType="up" />
        <KpiCard label="Bounce rate"    value={bounceLabel}                  delta={`${pagesPerSession} pages/session`} deltaType="up" />
        <KpiCard label="Avg session"    value={avgDuration}                  delta="Trung bình hôm nay" deltaType="up" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white border border-border rounded-2xl p-5">
          <SectionLabel>Thiết bị</SectionLabel>
          {by_device.length === 0 ? (
            <EmptyState label="Chưa có pageview hôm nay" />
          ) : (
            <div className="space-y-2.5">
              {by_device.map((b) => (
                <ThinBar
                  key={b.key}
                  label={DEVICE_LABELS[b.key] ?? b.key}
                  pct={(b.count / deviceTotal) * 100}
                  value={String(b.count)}
                />
              ))}
            </div>
          )}
        </div>
        <div className="bg-white border border-border rounded-2xl p-5">
          <SectionLabel>Nguồn truy cập</SectionLabel>
          {by_source.length === 0 ? (
            <EmptyState label="Chưa có pageview hôm nay" />
          ) : (
            <div className="space-y-2.5">
              {by_source.map((b) => (
                <ThinBar
                  key={b.key}
                  label={SOURCE_LABELS[b.key] ?? b.key}
                  pct={(b.count / sourceTotal) * 100}
                  value={String(b.count)}
                />
              ))}
            </div>
          )}
        </div>
        <div className="bg-white border border-border rounded-2xl p-5">
          <SectionLabel>Top pages</SectionLabel>
          {top_pages.length === 0 ? (
            <EmptyState label="Chưa có pageview hôm nay" />
          ) : (
            <div className="space-y-2.5">
              {top_pages.slice(0, 8).map((p: TopPage) => (
                <ThinBar
                  key={p.path}
                  label={p.path}
                  pct={(p.count / topPageMax) * 100}
                  value={String(p.count)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-border rounded-2xl p-5">
          <SectionLabel>Phễu hành vi</SectionLabel>
          <div className="space-y-2.5">
            {funnel.map((stage) => {
              const pct = (stage.count / funnelMax) * 100
              return (
                <div key={stage.key} className="space-y-1">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-medium text-ink">{FUNNEL_LABELS[stage.key]}</span>
                    <span className="font-semibold text-ink" style={display}>{stage.count}</span>
                  </div>
                  <div className="h-1.5 bg-cream-dark rounded-full overflow-hidden">
                    <div className="h-full bg-green rounded-full" style={{ width: `${Math.max(pct, 2)}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white border border-border rounded-2xl p-5">
          <SectionLabel>Phiên theo giờ (24h)</SectionLabel>
          <HourlyBarChart data={hourlyData} />
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl p-5">
        <SectionLabel>Phiên gần đây</SectionLabel>
        {sessions.length === 0 ? (
          <EmptyState label="Chưa có session nào hôm nay" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-[.06em] text-ink-mute border-b border-border">
                  <th className="py-2.5 pr-3">Session</th>
                  <th className="py-2.5 pr-3">Visitor</th>
                  <th className="py-2.5 pr-3">User</th>
                  <th className="py-2.5 pr-3 text-right">Pages</th>
                  <th className="py-2.5 pr-3 text-right">Duration</th>
                  <th className="py-2.5 text-right">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s: SessionSummary) => (
                  <tr key={s.session_id} className="border-b border-border last:border-0">
                    <td className="py-2 pr-3 truncate max-w-[140px]" style={mono}>{s.session_id.slice(0, 8)}</td>
                    <td className="py-2 pr-3 truncate max-w-[140px]" style={mono}>{s.visitor_id.slice(0, 8)}</td>
                    <td className="py-2 pr-3 text-ink-soft">{s.user_id ?? "—"}</td>
                    <td className="py-2 pr-3 text-right" style={mono}>{s.page_count}</td>
                    <td className="py-2 pr-3 text-right" style={mono}>{s.duration_sec}s</td>
                    <td className="py-2 text-right text-ink-soft">{fmtRelative(s.last_seen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key: "overview",      label: "Tổng quan" },
  { key: "customers",     label: "Khách hàng" },
  { key: "conversations", label: "Hội thoại" },
  { key: "behavior",      label: "Hành vi" },
]

export default function AdminCRM() {
  const [tab, setTab] = useState("overview")

  return (
    <div>
      <PageHeader
        title="CRM — Phễu khách hàng"
        subtitle="Theo dõi vòng đời: Messenger → Đăng ký → Mua hàng → Trung thành"
      />

      <div className="flex gap-1 mb-5 border-b border-border overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-[12.5px] font-medium transition-all border-b-2 -mb-px whitespace-nowrap ${
              tab === t.key
                ? "border-green text-green"
                : "border-transparent text-ink-mute hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview"      && <OverviewTab />}
      {tab === "customers"     && <CustomersTab />}
      {tab === "conversations" && <ConversationsTab />}
      {tab === "behavior"      && <BehaviorTab />}
    </div>
  )
}
