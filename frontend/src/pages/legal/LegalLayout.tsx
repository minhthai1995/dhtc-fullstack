import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

interface LegalLayoutProps {
  title: string
  subtitle?: string
  effectiveDate: string
  children: ReactNode
}

export function LegalLayout({ title, subtitle, effectiveDate, children }: LegalLayoutProps) {
  return (
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{ background: 'var(--color-cream)' }}
    >
      <div className="max-w-[860px] mx-auto px-6 sm:px-8 py-9">
        <header className="flex justify-between items-center pb-6 border-b border-border mb-10">
          <Link to="/" className="flex items-center gap-3 no-underline text-ink">
            <img
              src="/img/market/cropped-Logo_Food-01-e1693969421521.png"
              alt="Chợ Đêm Sơn Trà"
              className="w-12 h-12 rounded-xl object-contain bg-white p-1.5 border border-border"
            />
            <div>
              <strong
                className="block text-base font-semibold tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Chợ Đêm Sơn Trà
              </strong>
              <span className="text-[10.5px] text-ink-mute uppercase tracking-[0.16em] font-semibold">
                Đà Nẵng · dhtcdanang.com
              </span>
            </div>
          </Link>
          <Link
            to="/"
            className="text-sm font-semibold text-ink-soft hover:text-ink no-underline transition-colors"
          >
            ← Về trang chủ
          </Link>
        </header>

        <article>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-px bg-green" />
            <span
              className="text-[11px] text-green font-bold uppercase tracking-[0.2em]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Tài liệu pháp lý · Legal document
            </span>
          </div>
          <h1
            className="font-normal text-ink leading-[1.05] tracking-tight mb-3"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(34px, 5vw, 52px)',
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-base text-ink-soft leading-relaxed mb-3 max-w-[640px]">
              {subtitle}
            </p>
          )}
          <p
            className="text-[12px] text-ink-mute uppercase tracking-[0.1em] font-semibold mb-10"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Hiệu lực từ · Effective from {effectiveDate}
          </p>

          <div className="legal-prose text-ink-soft leading-relaxed">{children}</div>
        </article>

        <footer className="mt-16 pt-6 border-t border-border flex flex-col sm:flex-row sm:justify-between gap-4 text-[12px] text-ink-mute">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Link to="/" className="hover:text-ink no-underline">
              Trang chủ
            </Link>
            <Link to="/privacy" className="hover:text-ink no-underline">
              Chính sách bảo mật
            </Link>
            <Link to="/terms" className="hover:text-ink no-underline">
              Điều khoản
            </Link>
            <Link to="/data-deletion" className="hover:text-ink no-underline">
              Xoá dữ liệu
            </Link>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
            © 2026 Chợ Đêm Sơn Trà · Đà Nẵng
          </span>
        </footer>
      </div>

      <style>{`
        .legal-prose h2 {
          font-family: var(--font-display);
          font-size: 24px;
          font-weight: 500;
          color: var(--color-ink);
          margin-top: 40px;
          margin-bottom: 12px;
          line-height: 1.2;
          letter-spacing: -0.01em;
        }
        .legal-prose h3 {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 500;
          color: var(--color-ink);
          margin-top: 24px;
          margin-bottom: 8px;
        }
        .legal-prose p {
          margin-bottom: 14px;
          font-size: 15px;
        }
        .legal-prose ul, .legal-prose ol {
          margin: 0 0 16px 24px;
          padding: 0;
        }
        .legal-prose li {
          margin-bottom: 6px;
          font-size: 15px;
        }
        .legal-prose ul li { list-style: disc; }
        .legal-prose ol li { list-style: decimal; }
        .legal-prose strong { color: var(--color-ink); font-weight: 600; }
        .legal-prose a {
          color: var(--color-green);
          text-decoration: underline;
          text-decoration-color: rgba(45, 106, 79, 0.3);
          text-underline-offset: 3px;
        }
        .legal-prose a:hover {
          text-decoration-color: var(--color-green);
        }
        .legal-prose .callout {
          background: rgba(201, 169, 97, 0.08);
          border-left: 3px solid var(--color-gold);
          padding: 14px 18px;
          margin: 18px 0;
          border-radius: 0 8px 8px 0;
          font-size: 14px;
        }
        .legal-prose .callout strong { color: var(--color-gold-deep); }
        .legal-prose code {
          font-family: var(--font-mono);
          font-size: 13px;
          background: rgba(0, 0, 0, 0.04);
          padding: 2px 6px;
          border-radius: 4px;
          color: var(--color-green-deep);
        }
        .legal-prose hr {
          border: none;
          border-top: 1px dashed var(--color-border);
          margin: 32px 0;
        }
      `}</style>
    </div>
  )
}
