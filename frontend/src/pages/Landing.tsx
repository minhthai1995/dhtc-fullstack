import { Link } from 'react-router-dom'
import { ArrowUpRight, ShieldCheck, ShoppingBag, Globe } from 'lucide-react'

const roleCards = [
  {
    role: 'admin',
    num: 'SYSTEM 01',
    pages: '9 trang',
    icon: <ShieldCheck size={24} />,
    iconBg: 'rgba(139,38,53,0.1)',
    iconColor: '#8b2635',
    title: 'Admin Console',
    desc: 'Cấp quyền, giám sát doanh thu, quản lý 300 gian hàng và phê duyệt sản phẩm.',
    features: ['Dashboard · Tiểu thương · Sản phẩm', 'Phê duyệt · Đơn hàng · Báo cáo', 'Tích hợp API · Cài đặt hệ thống'],
    href: '/login',
  },
  {
    role: 'seller',
    num: 'SYSTEM 02',
    pages: '9 trang',
    icon: <ShoppingBag size={24} />,
    iconBg: 'rgba(201,169,97,0.18)',
    iconColor: '#9a7c3f',
    title: 'Seller Studio',
    desc: 'Tiểu thương đăng SKU, định giá theo khối lượng, in vận đơn và quản lý tài chính.',
    features: ['Sản phẩm · Đơn hàng · DHL Waybill', 'Ví & rút tiền · Khuyến mãi', 'Hồ sơ gian hàng · Phân tích'],
    href: '/login',
  },
  {
    role: 'customer',
    num: 'SYSTEM 03',
    pages: '7 trang',
    icon: <Globe size={24} />,
    iconBg: 'rgba(27,59,47,0.1)',
    iconColor: '#2d6a4f',
    title: 'Customer Store',
    desc: 'Khách hàng quốc tế tìm kiếm, thanh toán VietQR và theo dõi đơn hàng real-time.',
    features: ['Cửa hàng · Chi tiết sản phẩm', 'Giỏ hàng · Thanh toán', 'Theo dõi đơn · Tài khoản'],
    href: '/shop',
  },
]

const stats = [
  { num: '300', unit: '+', label: 'TIỂU THƯƠNG' },
  { num: '15', unit: 'K', label: 'SẢN PHẨM SKU' },
  { num: '27', unit: '', label: 'TRANG GIAO DIỆN' },
  { num: '6', unit: '', label: 'TÍCH HỢP API' },
]


export function Landing() {
  return (
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{ background: 'var(--color-cream)' }}
    >
      {/* Background decorative */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `
            radial-gradient(ellipse 800px 400px at 10% 0%, rgba(201,169,97,0.12), transparent),
            radial-gradient(ellipse 600px 600px at 100% 100%, rgba(27,59,47,0.08), transparent)
          `,
        }}
      />

      <div className="relative z-10 max-w-[1240px] mx-auto px-8 py-9">
        {/* Header */}
        <header className="flex justify-between items-center pb-7 border-b border-border mb-0">
          <div className="flex items-center gap-3.5">
            <img
              src="https://dhtcdanang.com/wp-content/uploads/2023/07/cropped-Logo_Food-01-e1693969421521.png"
              alt="DHTC"
              className="w-14 h-14 rounded-xl object-contain bg-white p-1.5 border border-border"
            />
            <div>
              <strong
                className="block text-lg font-semibold tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                DHTC Đà Nẵng
              </strong>
              <span className="text-[10.5px] text-ink-mute uppercase tracking-[0.16em] font-semibold">
                Platform Mockup · v0.2
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-ink-soft hover:text-ink no-underline transition-colors"
            >
              Đăng nhập
            </Link>
            <Link
              to="/shop"
              className="px-4 py-2 bg-green text-cream text-sm font-semibold rounded-xl hover:bg-green-soft transition-colors no-underline"
            >
              Khám phá
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="py-16 max-w-[920px]">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-px bg-green" />
            <span
              className="text-[11px] text-green font-bold uppercase tracking-[0.2em]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Hệ sinh thái thương mại nông sản
            </span>
          </div>
          <h1
            className="font-normal text-ink leading-[1.02] tracking-[-0.035em] mb-5"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(44px, 6.5vw, 80px)',
            }}
          >
            Một nền tảng.{' '}
            <em className="italic not-italic" style={{ color: 'var(--color-vermillion)', fontWeight: 300 }}>
              Ba vai trò.
            </em>
            <br />
            Ba trăm{' '}
            <span style={{ color: 'var(--color-gold)', fontWeight: 600 }}>tiểu thương</span>.
          </h1>
          <p className="text-lg text-ink-soft leading-relaxed max-w-[640px]">
            Mockup tương tác đầy đủ — chọn vai trò để khám phá{' '}
            <strong>27 trang</strong> giao diện thiết kế cho DHTC Đà Nẵng. Tích hợp Vietcombank VietQR,
            DHL Express, Messenger + Zalo, và AI Chatbot.
          </p>
        </section>

        {/* Section label */}
        <div className="flex items-baseline gap-3.5 mt-0 mb-6">
          <span
            className="text-xs font-semibold text-gold-deep tracking-[0.08em]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            01 / 03
          </span>
          <span
            className="text-[22px] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Chọn vai trò để xem demo
          </span>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
          {roleCards.map((card) => (
            <Link
              key={card.role}
              to={card.href}
              className={`
                relative bg-white border border-border rounded-[18px] p-7 no-underline text-ink
                flex flex-col min-h-[380px] overflow-hidden
                transition-all duration-[250ms] cubic-bezier(0.2,0.8,0.2,1)
                hover:-translate-y-1 hover:border-green hover:shadow-[0_20px_40px_-16px_rgba(27,59,47,0.16)]
                group
              `}
            >
              {/* Arrow */}
              <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-cream flex items-center justify-center text-ink-mute transition-all duration-[250ms] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-green">
                <ArrowUpRight size={14} />
              </div>

              <div
                className="text-[11.5px] font-mono mb-3.5 text-ink-mute tracking-[0.08em]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {card.num}
                <span className="ml-2.5 text-[10.5px] text-gold-deep font-bold uppercase tracking-[0.08em] bg-cream border border-border px-2 py-0.5 rounded-full">
                  {card.pages}
                </span>
              </div>

              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: card.iconBg, color: card.iconColor }}
              >
                {card.icon}
              </div>

              <h3
                className="text-[26px] font-medium tracking-tight mb-1.5 leading-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {card.title}
              </h3>
              <p className="text-[13.5px] text-ink-soft leading-relaxed flex-1 mb-4">
                {card.desc}
              </p>
              <ul className="text-xs text-ink-soft mb-0 list-none">
                {card.features.map((f) => (
                  <li key={f} className="py-1.5 border-t border-dashed border-border">
                    <span className="text-gold font-bold mr-1">·</span>
                    {f}
                  </li>
                ))}
              </ul>
            </Link>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-16">
          {stats.map((stat) => (
            <div key={stat.label} className="pl-4 border-l-2 border-gold">
              <div
                className="text-[40px] font-normal tracking-tight leading-none text-green"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {stat.num}
                <small className="text-base text-gold">{stat.unit}</small>
              </div>
              <div className="text-[11.5px] text-ink-mute mt-2 uppercase tracking-[0.06em] font-semibold">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Architecture panel */}
        <div
          className="rounded-3xl p-9 relative overflow-hidden mb-14"
          style={{ background: 'var(--color-green)' }}
        >
          <div
            className="absolute -top-24 -right-24 w-72 h-72 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(201,169,97,0.2), transparent 70%)' }}
          />
          <div
            className="text-xs font-bold uppercase tracking-[0.15em] mb-7 relative"
            style={{ color: 'var(--color-gold)' }}
          >
            Tech Stack & Integrations
          </div>
          <h2
            className="text-3xl font-normal tracking-tight mb-2 relative"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-cream)' }}
          >
            Kiến trúc hệ thống
          </h2>
          <p className="text-cream/60 text-sm mb-6 relative">
            FastAPI + React 19 + TanStack Query · PostgreSQL · Redis
          </p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 relative">
            {[
              { label: 'REACT 19', sub: 'Vite + TS' },
              { label: 'FASTAPI', sub: 'Python 3.12' },
              { label: 'POSTGRESQL', sub: 'SQLAlchemy' },
              { label: 'VIETCOMBANK', sub: 'VietQR API' },
              { label: 'DHL EXPRESS', sub: 'Waybill API' },
            ].map((node) => (
              <div
                key={node.label}
                className="text-center p-3.5 rounded-xl border text-[11.5px] text-cream/90"
                style={{
                  background: 'rgba(245,239,224,0.06)',
                  borderColor: 'rgba(201,169,97,0.3)',
                }}
              >
                <strong
                  className="block mb-1 text-[10.5px] tracking-[0.1em]"
                  style={{ color: 'var(--color-gold)' }}
                >
                  {node.label}
                </strong>
                <em
                  className="not-italic text-[9.5px]"
                  style={{ fontFamily: 'var(--font-mono)', color: 'rgba(245,239,224,0.6)' }}
                >
                  {node.sub}
                </em>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="flex justify-between items-center pt-6 border-t border-border text-[11.5px] text-ink-mute">
          <span style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
            DHTC Đà Nẵng · Platform Mockup v0.2
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
            27 pages · 3 roles · 6 integrations
          </span>
        </footer>
      </div>
    </div>
  )
}
