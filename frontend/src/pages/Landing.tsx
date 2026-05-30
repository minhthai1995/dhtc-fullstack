import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import {
  ArrowUpRight,
  ArrowRight,
  Star,
  MapPin,
  Clock,
  Users,
  Award,
  Sparkles,
  Music,
  Flame,
  Soup,
  Coffee,
  Car,
  Bike,
  Footprints,
  Phone,
  Mail,
  Facebook,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Utensils,
  Gift,
  Shirt,
  Briefcase,
  Menu,
  X,
  Ruler,
  ShieldCheck,
  FileText,
  Trash2,
  IceCream,
  Shell,
  Fish,
  Cookie,
  Egg,
} from 'lucide-react'
import { useT } from '@/i18n/useT'
import { LangSwitcher } from '@/components/LangSwitcher'

/* ────────────────────────────────────────────────────────────────────────────
 * Landing — Chợ Đêm Sơn Trà · Đà Nẵng
 * VI/EN locale-aware (custom i18n) · editorial typography · zero auth surface.
 * ─────────────────────────────────────────────────────────────────────────── */

const LOGO = '/img/market/cropped-Logo_Food-01-e1693969421521.png'

/* Authentic Chợ Đêm Sơn Trà photos, self-hosted from the legacy WordPress site
 * into /public/img/market. These are low-res interim shots and will be swapped
 * for the owner's high-res originals — see frontend/PHOTOS-NEEDED.md. */
const IMG_LIGHTS = '/img/market/anhsang1.jpg' // heart-light installation at night
const IMG_ENTRANCE = '/img/market/091704-cho-dem-son-tra.jpg' // main entrance arch
const IMG_OPENING = '/img/market/1-1552259562.jpg' // 2018 opening day

const HERO_SLIDES = [
  { src: IMG_LIGHTS, altKey: 'hero.slide1.alt' },
  { src: IMG_ENTRANCE, altKey: 'hero.slide2.alt' },
  { src: IMG_OPENING, altKey: 'hero.slide3.alt' },
]

const STORY_IMG = IMG_OPENING

// ─── Static structural data (text comes from i18n) ─────────────────────────

const navLinks = [
  { href: '#story', key: 'nav.story' },
  { href: '#flavors', key: 'nav.flavors' },
  { href: '#zones', key: 'nav.zones' },
  { href: '#events', key: 'nav.events' },
  { href: '#visit', key: 'nav.visit' },
  { href: '#faq', key: 'nav.faq' },
]

const heroFacts = [1, 2, 3] as const
const statsMeta = [
  { numRaw: 150, num: '150', unit: 'stats.1.unit', label: 'stats.1.label', Icon: Users },
  { numRaw: 1500, num: '1.500', unit: 'stats.2.unit', label: 'stats.2.label', Icon: Ruler },
  { numRaw: 4, num: '4', unit: 'stats.3.unit', label: 'stats.3.label', Icon: Sparkles },
  { numRaw: 8, num: '8', unit: 'stats.4.unit', label: 'stats.4.label', Icon: Award },
] as const

const gallery = [
  { src: IMG_ENTRANCE, key: 'gallery.1', span: 'col-span-2 md:col-span-2 md:row-span-2', w: 771, h: 516 },
  { src: IMG_LIGHTS, key: 'gallery.2', span: 'md:col-span-2', w: 700, h: 394 },
  { src: IMG_OPENING, key: 'gallery.3', span: 'md:col-span-2', w: 1024, h: 492 },
]

const dishMeta = [
  { n: 1, Icon: Flame },
  { n: 2, Icon: Soup },
  { n: 3, Icon: Egg },
  { n: 4, Icon: Cookie },
  { n: 5, Icon: Shell },
  { n: 6, Icon: Fish },
  { n: 7, Icon: IceCream },
  { n: 8, Icon: Gift },
] as const

const zonesMeta = [
  { code: 'A', Icon: Utensils },
  { code: 'B', Icon: Gift },
  { code: 'C', Icon: Briefcase },
  { code: 'D', Icon: Shirt },
] as const

const eventsMeta = [
  { n: 1, Icon: Sparkles },
  { n: 2, Icon: Music },
  { n: 3, Icon: Soup },
  { n: 4, Icon: Flame },
  { n: 5, Icon: Gift },
  { n: 6, Icon: Coffee },
] as const

const testimonials = [
  { n: 1, name: 'Erico T.',    flag: '🇸🇬', source: 'Tripadvisor' },
  { n: 2, name: 'Silvia C.',   flag: '🇮🇹', source: 'Tripadvisor' },
  { n: 3, name: 'Pek Jenny',   flag: '🇸🇬', source: 'Tripadvisor' },
  { n: 4, name: 'Minh Hoàng',  flag: '🇻🇳', source: 'Google Maps' },
  { n: 5, name: 'Trần Thu Hà', flag: '🇻🇳', source: 'Google Maps' },
  { n: 6, name: 'Sarah K.',    flag: '🇦🇺', source: 'Tripadvisor' },
] as const

const tipsMeta = [1, 2, 3, 4, 5, 6] as const
const faqsMeta = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const

// ─── Helpers ───────────────────────────────────────────────────────────────

function computeOpenNow(now: Date): boolean {
  const day = now.getDay() // 0 Sun, 6 Sat
  const isWeekend = day === 0 || day === 6
  const minutes = now.getHours() * 60 + now.getMinutes()
  const open = isWeekend ? 17 * 60 : 17 * 60 + 30
  const close = isWeekend ? 23 * 60 + 59 : 23 * 60 + 45
  return minutes >= open && minutes <= close
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function CountUp({ end, format = 'auto', duration = 1400 }: { end: number; format?: 'auto' | 'plain'; duration?: number }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let started = false
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !started) {
            started = true
            const start = performance.now()
            const tick = (now: number) => {
              const t = Math.min(1, (now - start) / duration)
              setVal(Math.round(end * easeOutCubic(t)))
              if (t < 1) requestAnimationFrame(tick)
            }
            requestAnimationFrame(tick)
            io.disconnect()
          }
        })
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [end, duration])
  const formatted = format === 'plain' || end < 1000 ? String(val) : val.toLocaleString('de-DE')
  return <span ref={ref}>{formatted}</span>
}

// ─── Small subcomponents ───────────────────────────────────────────────────

function SectionLabel({ no, title }: { no: string; title: string }) {
  return (
    <div className="flex items-baseline gap-3.5 mb-6" data-reveal>
      <span
        className="text-xs font-semibold text-gold-deep tracking-[0.08em]"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {no}
      </span>
      <span className="text-[22px] sm:text-[26px] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
        {title}
      </span>
    </div>
  )
}

function Pill({ children, tone = 'cream' }: { children: React.ReactNode; tone?: 'cream' | 'gold' | 'green' }) {
  const tones = {
    cream: 'bg-white/10 text-cream border-cream/20',
    gold: 'bg-gold/15 text-gold border-gold/30',
    green: 'bg-green/10 text-green border-green/20',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11.5px] font-semibold rounded-full border ${tones[tone]}`}
      style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}
    >
      {children}
    </span>
  )
}

// ─── Main component ────────────────────────────────────────────────────────

export function Landing() {
  const { t, lang } = useT()
  const [scrolled, setScrolled] = useState(false)
  const [scrollPct, setScrollPct] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [heroSlide, setHeroSlide] = useState(0)
  const [heroPaused, setHeroPaused] = useState(false)
  const [isOpenNow, setIsOpenNow] = useState<boolean>(() => computeOpenNow(new Date()))

  // Scroll tracking — combined scrolled flag + scroll-progress bar (rAF-throttled)
  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = window.requestAnimationFrame(() => {
        const y = window.scrollY
        setScrolled(y > 60)
        const doc = document.documentElement
        const total = doc.scrollHeight - window.innerHeight
        setScrollPct(total > 0 ? Math.min(100, (y / total) * 100) : 0)
        raf = 0
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [])

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  // Hero carousel — auto-advance every 6s; pause on hover. No-op for a single slide.
  useEffect(() => {
    if (heroPaused || HERO_SLIDES.length <= 1) return
    const id = window.setInterval(() => {
      setHeroSlide((s) => (s + 1) % HERO_SLIDES.length)
    }, 6000)
    return () => window.clearInterval(id)
  }, [heroPaused])

  // Open-now status — refresh every 60s
  useEffect(() => {
    const tick = () => setIsOpenNow(computeOpenNow(new Date()))
    tick()
    const id = window.setInterval(tick, 60_000)
    return () => window.clearInterval(id)
  }, [])

  // Reveal-on-scroll: single observer watching every [data-reveal] element.
  // Adds `.js-reveal` to <html> so the hidden-by-default CSS only applies once
  // we know JS is alive. A 1500ms safety net reveals anything still hidden,
  // so a stalled observer (slow device, headless screenshot tool) can't trap
  // content invisible.
  useEffect(() => {
    const html = document.documentElement
    html.classList.add('js-reveal')
    const els = document.querySelectorAll<HTMLElement>('[data-reveal]')
    if (!els.length) return
    if (typeof IntersectionObserver === 'undefined') {
      els.forEach((el) => el.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in')
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.05, rootMargin: '0px 0px 25% 0px' },
    )
    els.forEach((el) => io.observe(el))
    const safety = window.setTimeout(() => {
      els.forEach((el) => el.classList.add('is-in'))
    }, 1500)
    return () => {
      io.disconnect()
      window.clearTimeout(safety)
    }
  }, [lang])

  const nextHero = () => setHeroSlide((s) => (s + 1) % HERO_SLIDES.length)
  const prevHero = () => setHeroSlide((s) => (s - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)

  return (
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{ background: 'var(--color-cream)', scrollBehavior: 'smooth' }}
    >
      {/* Reveal-on-scroll + Ken Burns animations.
          Progressive enhancement: content is visible by default; the hidden→reveal
          animation only kicks in when JS has added `.js-reveal` to <html>. This
          guarantees content shows even if IntersectionObserver fails to fire
          (slow devices, headless renderers, SEO crawlers). */}
      <style>{`
        .js-reveal [data-reveal]:not(.is-in){opacity:0;transform:translateY(14px);transition:opacity 700ms ease,transform 700ms cubic-bezier(.2,.7,.2,1)}
        .js-reveal [data-reveal].is-in{opacity:1;transform:none;transition:opacity 700ms ease,transform 700ms cubic-bezier(.2,.7,.2,1)}
        @media (prefers-reduced-motion: reduce){.js-reveal [data-reveal]{opacity:1;transform:none;transition:none}}
        @keyframes dhtc-kenburns{0%{transform:scale(1.04) translateY(0)}100%{transform:scale(1.12) translateY(-1.5%)}}
        .dhtc-kenburns-active{animation:dhtc-kenburns 9s ease-out forwards}
        @media (prefers-reduced-motion: reduce){.dhtc-kenburns-active{animation:none;transform:none}}
      `}</style>

      {/* Scroll progress bar */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 z-[60] h-[2px] bg-gold transition-[width] duration-100 ease-out"
        style={{ width: `${scrollPct}%` }}
      />

      {/* ── Top notice strip ──────────────────────────────────────────── */}
      <div
        className="text-cream text-[11px] sm:text-[12px] text-center py-2 px-4"
        style={{ background: 'var(--color-green-deep)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}
      >
        <span className="inline-flex items-center gap-2 flex-wrap justify-center">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              isOpenNow ? 'bg-gold animate-pulse' : 'bg-cream/40'
            }`}
          />
          <span className="font-bold">{isOpenNow ? t('notice.openLive') : t('notice.closedLive')}</span>
          <span className="hidden sm:inline">· {t('notice.openNow')} ·</span>
          <span className="sm:hidden">· {t('notice.openShort')} ·</span>
          {t('notice.newLocation')}
        </span>
      </div>

      {/* ── Sticky nav ───────────────────────────────────────────────── */}
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-cream/90 backdrop-blur-md border-b border-border shadow-[0_4px_20px_-12px_rgba(0,0,0,0.15)]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 no-underline text-ink shrink-0">
            <img
              src={LOGO}
              alt="Chợ Đêm Sơn Trà"
              width={44}
              height={44}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-contain bg-white p-1 border border-border"
              decoding="async"
            />
            <div>
              <strong
                className="block text-[14px] sm:text-[15px] font-semibold tracking-tight leading-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Chợ Đêm Sơn Trà
              </strong>
              <span className="text-[9px] sm:text-[9.5px] text-ink-mute uppercase tracking-[0.15em] sm:tracking-[0.18em] font-semibold">
                {t('nav.brandSub')}
              </span>
            </div>
          </Link>

          <ul className="hidden lg:flex items-center gap-7 list-none m-0 p-0">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-[13px] font-medium text-ink-soft hover:text-green no-underline transition-colors"
                >
                  {t(link.key)}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <LangSwitcher className="hidden sm:inline-flex" />
            <a
              href="https://m.me/NightMarketSonTraDaNangVietNam"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex px-3.5 sm:px-4 py-2 border border-ink/15 hover:border-ink text-ink text-[13px] font-semibold rounded-xl transition-colors no-underline items-center gap-1.5"
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}
            >
              {t('nav.contact')}
              <ArrowUpRight size={14} />
            </a>
            <button
              type="button"
              aria-label={mobileOpen ? t('nav.menuClose') : t('nav.menuOpen')}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((o) => !o)}
              className="lg:hidden w-10 h-10 inline-flex items-center justify-center rounded-xl border border-border bg-white text-ink hover:bg-cream transition-colors"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-border bg-cream/95 backdrop-blur-md">
            <ul className="max-w-[1240px] mx-auto px-4 sm:px-6 py-4 list-none m-0 grid grid-cols-2 gap-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 rounded-xl bg-white border border-border text-[14px] font-medium text-ink no-underline hover:border-green hover:text-green transition-colors"
                  >
                    {t(link.key)}
                  </a>
                </li>
              ))}
              <li className="col-span-2 pt-1">
                <LangSwitcher className="w-full justify-center" />
              </li>
              <li className="col-span-2 pt-1">
                <a
                  href="https://m.me/NightMarketSonTraDaNangVietNam"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full px-4 py-3 text-center rounded-xl border border-ink/15 bg-white text-[13px] font-semibold text-ink no-underline inline-flex items-center justify-center gap-1.5"
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}
                >
                  {t('nav.contactMsg')} <ArrowUpRight size={14} />
                </a>
              </li>
            </ul>
          </div>
        )}
      </nav>

      {/* ── HERO — full-bleed carousel with Ken Burns ────────────────── */}
      <header
        className="relative min-h-[78vh] sm:min-h-[88vh] flex items-end overflow-hidden"
        onMouseEnter={() => setHeroPaused(true)}
        onMouseLeave={() => setHeroPaused(false)}
      >
        {HERO_SLIDES.map((slide, i) => (
          <img
            key={slide.src}
            src={slide.src}
            alt={t(slide.altKey)}
            width={2400}
            height={1600}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1400ms] ease-in-out ${
              i === heroSlide ? 'opacity-100 dhtc-kenburns-active' : 'opacity-0'
            }`}
            loading={i === 0 ? 'eager' : 'lazy'}
            fetchPriority={i === 0 ? 'high' : 'low'}
            decoding="async"
          />
        ))}

        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(15,25,20,0.65) 0%, rgba(15,25,20,0.45) 35%, rgba(15,25,20,0.85) 100%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(201,169,97,0.4), transparent 40%), radial-gradient(circle at 80% 80%, rgba(139,38,53,0.3), transparent 40%)',
          }}
        />

        <div className="relative z-10 max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 pt-24 sm:pt-32 lg:pt-40">
          <div className="max-w-[860px]">
            <div className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-6 flex-wrap" data-reveal>
              <Pill tone="gold">
                <Sparkles size={11} /> {t('hero.pill1')}
              </Pill>
              <Pill>{t('hero.pill2')}</Pill>
            </div>
            <h1
              className="font-normal text-cream leading-[1.02] sm:leading-[0.98] tracking-[-0.025em] mb-5 sm:mb-6"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(38px, 7.5vw, 96px)',
              }}
              data-reveal
            >
              {t('hero.headlinePre')}{' '}
              <em className="italic not-italic" style={{ color: 'var(--color-gold)', fontWeight: 300 }}>
                {t('hero.headlineEm')}
              </em>{' '}
              {t('hero.headlinePost')}
            </h1>
            <p
              className="text-[15px] sm:text-[19px] text-cream/85 leading-relaxed max-w-[640px] mb-7 sm:mb-9"
              style={{ fontFamily: 'var(--font-body)' }}
              data-reveal
            >
              {t('hero.sub')}
            </p>
            <div className="flex flex-wrap gap-3 mb-10 sm:mb-12" data-reveal>
              <a
                href="#flavors"
                className="group px-5 sm:px-6 py-3 sm:py-3.5 bg-gold text-ink text-[13px] sm:text-sm font-semibold rounded-xl hover:bg-cream transition-all duration-300 no-underline inline-flex items-center gap-2 shadow-[0_10px_30px_-10px_rgba(201,169,97,0.65)] hover:shadow-[0_14px_36px_-10px_rgba(201,169,97,0.85)] hover:-translate-y-0.5"
              >
                {t('hero.cta1')}
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </a>
              <a
                href="#visit"
                className="px-5 sm:px-6 py-3 sm:py-3.5 bg-white/[0.08] backdrop-blur-md border border-cream/25 text-cream text-[13px] sm:text-sm font-semibold rounded-xl hover:bg-white/[0.18] hover:border-cream/50 transition-colors no-underline"
              >
                {t('hero.cta2')}
              </a>
            </div>

            <div
              className="grid grid-cols-3 pt-6 sm:pt-8 border-t border-cream/15 max-w-[700px] divide-x divide-cream/10"
              data-reveal
            >
              {heroFacts.map((n, idx) => (
                <div key={n} className={idx === 0 ? 'pr-3 sm:pr-6' : 'px-3 sm:px-6'}>
                  <div
                    className="text-[26px] sm:text-[40px] font-normal tracking-tight leading-none text-gold mb-1.5"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {t(`hero.fact${n}.value`)}
                  </div>
                  <div className="text-[10px] sm:text-[11.5px] text-cream font-semibold uppercase tracking-[0.08em] leading-tight">
                    {t(`hero.fact${n}.label`)}
                  </div>
                  <div className="text-[9.5px] sm:text-[10.5px] text-cream/55 mt-1 leading-tight">
                    {t(`hero.fact${n}.sub`)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Carousel controls — only when more than one slide */}
        {HERO_SLIDES.length > 1 && (
          <div className="absolute bottom-5 sm:bottom-7 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-8 z-20 flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={prevHero}
              aria-label={t('hero.prevSlide')}
              className="hidden sm:inline-flex w-9 h-9 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-cream/30 text-cream hover:bg-white/20 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-2" role="tablist" aria-label={t('hero.slideTabs')}>
              {HERO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === heroSlide}
                  aria-label={`${i + 1} / ${HERO_SLIDES.length}`}
                  onClick={() => setHeroSlide(i)}
                  className={`transition-all duration-300 rounded-full ${
                    i === heroSlide ? 'w-8 h-1.5 bg-gold' : 'w-1.5 h-1.5 bg-cream/40 hover:bg-cream/70'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={nextHero}
              aria-label={t('hero.nextSlide')}
              className="hidden sm:inline-flex w-9 h-9 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-cream/30 text-cream hover:bg-white/20 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        <div
          className="absolute top-24 sm:top-28 right-5 sm:right-8 hidden md:block text-right text-cream/55"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <div className="text-[10px] uppercase tracking-[0.22em] mb-0.5">{t('hero.issue')}</div>
          <div className="text-[10.5px] text-cream/35">{t('hero.issueSub')}</div>
        </div>
      </header>

      {/* ── Stats band ──────────────────────────────────────────────── */}
      <section className="bg-white border-y border-border">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-9 sm:py-12">
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-7 md:gap-12 items-start">
            <div className="md:pt-2" data-reveal>
              <div
                className="text-[10.5px] uppercase tracking-[0.2em] font-bold text-gold-deep mb-2"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {t('stats.label')}
              </div>
              <p className="text-[12px] sm:text-[12.5px] text-ink-mute leading-snug max-w-[200px]">
                {t('stats.note')}
              </p>
            </div>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 m-0 p-0">
              {statsMeta.map((s) => (
                <div key={s.label} className="flex flex-col border-l border-border pl-4 sm:pl-5" data-reveal>
                  <dd
                    className="text-[34px] sm:text-[44px] font-normal tracking-tight leading-none text-ink m-0"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    <CountUp end={s.numRaw} />
                    <small className="text-[14px] sm:text-[18px] text-gold ml-0.5 font-normal">{t(s.unit)}</small>
                  </dd>
                  <dt className="text-[10px] sm:text-[10.5px] text-ink-mute mt-3 uppercase tracking-[0.08em] font-semibold leading-snug">
                    {t(s.label)}
                  </dt>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ── STORY ────────────────────────────────────────────────────── */}
      <section id="story" className="py-16 sm:py-20 lg:py-28">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <SectionLabel no={t('story.section')} title={t('story.title')} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-center">
            <div className="relative" data-reveal>
              <img
                src={STORY_IMG}
                alt={t('story.title')}
                width={1200}
                height={1500}
                className="w-full aspect-[4/5] object-cover rounded-3xl border border-border"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute -bottom-6 -right-2 sm:-right-6 bg-white border border-border rounded-2xl px-4 sm:px-5 py-3 sm:py-4 shadow-[0_20px_40px_-16px_rgba(0,0,0,0.15)] max-w-[240px]">
                <div
                  className="text-[10px] uppercase tracking-[0.18em] font-bold text-gold-deep mb-1.5"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {t('story.openBadge')}
                </div>
                <div
                  className="text-[24px] sm:text-[28px] font-normal text-ink leading-none"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  2018<span className="text-base text-ink-mute ml-1">{t('story.openSince')}</span>
                </div>
                <div className="text-[10.5px] sm:text-[11px] text-ink-mute mt-1.5 leading-snug">
                  {t('story.openMeta')}
                </div>
              </div>
            </div>

            <div data-reveal>
              <h2
                className="font-normal text-ink leading-[1.05] tracking-[-0.02em] mb-5 sm:mb-6"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(28px, 4.5vw, 52px)',
                }}
              >
                {t('story.h2')}
              </h2>
              <p
                className="text-[15px] sm:text-[16px] text-ink-soft leading-relaxed mb-4 sm:mb-5"
                dangerouslySetInnerHTML={{ __html: t('story.p1') }}
              />
              <p className="text-[15px] sm:text-[16px] text-ink-soft leading-relaxed mb-4 sm:mb-5">
                {t('story.p2')}
              </p>
              <p className="text-[15px] sm:text-[16px] text-ink-soft leading-relaxed mb-6 sm:mb-7">
                {t('story.p3')}
              </p>

              <div className="flex flex-wrap gap-2 sm:gap-2.5">
                <Pill tone="green">
                  <MapPin size={11} /> {t('story.pill1')}
                </Pill>
                <Pill tone="green">
                  <Clock size={11} /> {t('story.pill2')}
                </Pill>
                <Pill tone="green">
                  <Users size={11} /> {t('story.pill3')}
                </Pill>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DRAGON MOMENT ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-y border-border" style={{ background: 'var(--color-ink)' }}>
        <div className="absolute inset-0" aria-hidden="true">
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, var(--color-green-deep) 0%, var(--color-ink) 60%)' }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 78% 22%, rgba(201,169,97,0.22), transparent 45%), radial-gradient(circle at 12% 88%, rgba(139,38,53,0.18), transparent 50%)',
            }}
          />
          {/* Fine dot-grid film texture */}
          <div
            className="absolute inset-0 opacity-[0.18] mix-blend-overlay"
            style={{
              backgroundImage:
                'radial-gradient(rgba(245,239,224,0.55) 1px, transparent 1px)',
              backgroundSize: '22px 22px',
            }}
          />
          {/* Decorative oversized Roman II */}
          <span
            className="absolute select-none text-gold/[0.05] leading-none pointer-events-none"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(280px, 36vw, 480px)',
              fontWeight: 300,
              top: '-0.12em',
              left: '-0.02em',
            }}
          >
            II
          </span>
        </div>

        <div className="relative max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10 lg:gap-16 items-end">
          <div className="max-w-[760px]" data-reveal>
            <div
              className="text-[10.5px] uppercase tracking-[0.22em] font-bold text-gold mb-5 sm:mb-6 flex items-center gap-3"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <span className="w-8 h-px bg-gold" />
              {t('dragon.label')}
            </div>
            <h2
              className="font-normal text-cream leading-[1.02] tracking-[-0.025em] mb-7 sm:mb-9"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(34px, 5.5vw, 64px)' }}
            >
              {t('dragon.titlePre')}{' '}
              <em className="italic not-italic" style={{ color: 'var(--color-gold)', fontWeight: 300 }}>
                {t('dragon.titleEm')}
              </em>
            </h2>
            <p
              className="text-[15px] sm:text-[17px] text-cream/85 leading-relaxed mb-4 max-w-[640px]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {t('dragon.p1')}
            </p>
            <p
              className="text-[14px] sm:text-[16px] text-cream/65 leading-relaxed max-w-[640px]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {t('dragon.p2')}
            </p>
          </div>

          <aside className="lg:pl-8 lg:border-l border-cream/15" data-reveal>
            <div
              className="text-[10.5px] uppercase tracking-[0.18em] font-bold text-gold mb-4"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {t('dragon.schedTitle')}
            </div>
            <ul
              className="space-y-2.5 list-none m-0 p-0 text-[13.5px] text-cream/85"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <li className="flex justify-between border-b border-cream/10 pb-2.5">
                <span>{t('dragon.sat')}</span>
                <span className="text-gold font-bold">21:00</span>
              </li>
              <li className="flex justify-between border-b border-cream/10 pb-2.5">
                <span>{t('dragon.sun')}</span>
                <span className="text-gold font-bold">21:00</span>
              </li>
              <li className="flex justify-between text-cream/50 text-[12px] pt-1">
                <span>{t('dragon.weekdays')}</span>
                <span>{t('dragon.off')}</span>
              </li>
            </ul>
            <p className="text-[11px] text-cream/45 mt-5 leading-snug max-w-[220px]">{t('dragon.source')}</p>
          </aside>
        </div>
      </section>

      {/* ── GALLERY ──────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20" style={{ background: 'var(--color-cream-dark)' }}>
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <SectionLabel no={t('gallery.section')} title={t('gallery.title')} />

          <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[180px] sm:auto-rows-[240px] md:auto-rows-[260px] gap-3 sm:gap-4">
            {gallery.map((g, i) => (
              <figure
                key={i}
                className={`relative overflow-hidden rounded-2xl group cursor-pointer ${g.span}`}
                data-reveal
              >
                <img
                  src={g.src}
                  alt={t(g.key)}
                  width={g.w}
                  height={g.h}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                <figcaption className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-cream">
                  <div
                    className="text-[10px] sm:text-[10.5px] uppercase tracking-[0.1em] sm:tracking-[0.12em] font-semibold opacity-80"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {t('gallery.frame')} · {String(i + 1).padStart(2, '0')}
                  </div>
                  <div
                    className="text-[12px] sm:text-[13px] md:text-[14px] font-medium mt-1 leading-snug"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {t(g.key)}
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── SIGNATURE DISHES · editorial typography cards ────────────── */}
      <section id="flavors" className="py-16 sm:py-20 lg:py-28">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <SectionLabel no={t('dishes.section')} title={t('dishes.title')} />
              <p className="text-ink-soft max-w-[520px] text-[14px] sm:text-[15px] leading-relaxed" data-reveal>
                {t('dishes.sub')}
              </p>
            </div>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 list-none m-0 p-0">
            {dishMeta.map((d) => (
              <li
                key={d.n}
                className="bg-white border border-border rounded-2xl p-5 sm:p-6 flex flex-col gap-4 group hover:border-gold/60 hover:shadow-[0_18px_36px_-22px_rgba(15,25,20,0.25)] transition-all"
                data-reveal
              >
                <div className="flex items-start justify-between">
                  <span
                    className="text-[36px] sm:text-[44px] font-normal text-gold-deep tabular-nums leading-none"
                    style={{ fontFamily: 'var(--font-display)' }}
                    aria-hidden
                  >
                    {String(d.n).padStart(2, '0')}
                  </span>
                  <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-cream-dark text-green-deep group-hover:bg-gold/15 group-hover:text-gold-deep transition-colors">
                    <d.Icon size={20} strokeWidth={1.5} />
                  </span>
                </div>
                <h3
                  className="text-[18px] sm:text-[20px] font-medium tracking-tight leading-tight m-0"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {t(`dish.${d.n}.name`)}
                </h3>
                <p className="text-[13px] text-ink-soft leading-relaxed m-0 flex-1">{t(`dish.${d.n}.desc`)}</p>
                <div className="pt-3 border-t border-border flex items-baseline justify-between gap-3">
                  <div>
                    <div
                      className="text-[10px] uppercase tracking-[0.14em] text-ink-mute font-semibold"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {t('dishes.priceLabel')}
                    </div>
                    <div
                      className="text-[16px] sm:text-[17px] font-semibold text-green-deep tabular-nums"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {t(`dish.${d.n}.price`)}đ
                    </div>
                  </div>
                  <span
                    className="text-[10.5px] uppercase tracking-[0.12em] text-gold-deep font-semibold text-right"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {t(`dish.${d.n}.tag`)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <p
            className="text-[10.5px] text-ink-mute mt-5 sm:mt-6 italic leading-snug max-w-[640px]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {t('dishes.footnote')}
          </p>
        </div>
      </section>

      {/* ── 4 ZONES ──────────────────────────────────────────────────── */}
      <section
        id="zones"
        className="relative overflow-hidden py-16 sm:py-20 lg:py-28"
        style={{ background: 'var(--color-green-deep)' }}
      >
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {/* Subtle dot-grid texture */}
          <div
            className="absolute inset-0 opacity-[0.14] mix-blend-overlay"
            style={{
              backgroundImage:
                'radial-gradient(rgba(245,239,224,0.55) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          {/* Decorative oversized Roman IV */}
          <span
            className="absolute select-none text-gold/[0.05] leading-none"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(280px, 36vw, 480px)',
              fontWeight: 300,
              bottom: '-0.18em',
              right: '-0.04em',
            }}
          >
            IV
          </span>
        </div>
        <div className="relative max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-baseline gap-3.5 mb-5 sm:mb-6" data-reveal>
            <span
              className="text-xs font-semibold tracking-[0.08em]"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-gold)' }}
            >
              {t('zones.section')}
            </span>
            <span
              className="text-[20px] sm:text-[26px] tracking-tight text-cream"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t('zones.title')}
            </span>
          </div>
          <p className="text-cream/70 max-w-[640px] text-[14px] sm:text-[15px] leading-relaxed mb-8 sm:mb-10" data-reveal>
            {t('zones.sub')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {zonesMeta.map((z) => (
              <article
                key={z.code}
                className="rounded-2xl overflow-hidden flex flex-col border border-cream/15 group hover:border-gold/60 transition-colors"
                style={{ background: 'rgba(245,239,224,0.04)' }}
                data-reveal
              >
                <div
                  className="relative aspect-[4/3] overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, var(--color-green) 0%, var(--color-green-deep) 100%)' }}
                >
                  <span
                    className="absolute -right-3 -bottom-6 text-cream/10 font-normal leading-none select-none pointer-events-none transition-transform duration-500 group-hover:scale-105"
                    style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(120px, 16vw, 180px)' }}
                    aria-hidden="true"
                  >
                    {z.code}
                  </span>
                  <div
                    className="absolute top-3 left-3 w-10 h-10 rounded-xl bg-gold flex items-center justify-center text-ink font-bold text-base"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {z.code}
                  </div>
                  <div className="absolute top-3 right-3 w-9 h-9 rounded-lg bg-cream/95 flex items-center justify-center text-green">
                    <z.Icon size={22} />
                  </div>
                </div>
                <div className="p-4 sm:p-5 flex flex-col flex-1">
                  <h3
                    className="text-[18px] sm:text-[19px] font-medium tracking-tight mb-2 text-cream leading-tight"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {t('zones.zonePrefix')} {z.code} · {t(`zone.${z.code}.name`)}
                  </h3>
                  <p className="text-[12.5px] sm:text-[13px] text-cream/70 leading-relaxed flex-1 mb-4">
                    {t(`zone.${z.code}.desc`)}
                  </p>
                  <div
                    className="flex items-center justify-between pt-3 border-t border-cream/15 text-[11.5px]"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    <span className="text-gold font-semibold">{t(`zone.${z.code}.count`)}</span>
                    <span className="text-cream/55">{t(`zone.${z.code}.price`)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 sm:mt-10 text-center">
            <a
              href="https://www.facebook.com/NightMarketSonTraDaNangVietNam/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 bg-gold text-ink text-[13px] sm:text-sm font-semibold rounded-xl hover:bg-cream transition-colors no-underline"
            >
              <Facebook size={16} /> {t('zones.cta')}
            </a>
          </div>
        </div>
      </section>

      {/* ── EVENTS TIMELINE ──────────────────────────────────────────── */}
      <section id="events" className="py-16 sm:py-20 lg:py-28">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <SectionLabel no={t('events.section')} title={t('events.title')} />
          <p className="text-ink-soft max-w-[640px] text-[14px] sm:text-[15px] leading-relaxed mb-8 sm:mb-10" data-reveal>
            {t('events.sub')}
          </p>

          <div className="bg-white border border-border rounded-3xl p-5 sm:p-6 lg:p-10" data-reveal>
            <ol className="relative space-y-6 sm:space-y-7 list-none m-0 p-0">
              <div className="absolute left-[22px] sm:left-[26px] top-3 bottom-3 w-px bg-border" aria-hidden />

              {eventsMeta.map((e) => (
                <li key={e.n} className="relative pl-12 sm:pl-16">
                  <div className="absolute left-0 top-0 w-11 h-11 sm:w-[52px] sm:h-[52px] rounded-full bg-cream border border-border flex items-center justify-center text-green">
                    <e.Icon size={18} />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mb-1.5">
                    <span
                      className="text-[11px] sm:text-[12px] text-gold-deep font-bold tracking-[0.08em] uppercase"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {t(`event.${e.n}.time`)}
                    </span>
                    <h3
                      className="text-[17px] sm:text-[20px] font-medium tracking-tight"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {t(`event.${e.n}.title`)}
                    </h3>
                  </div>
                  <p className="text-[13px] sm:text-[14px] text-ink-soft leading-relaxed max-w-[640px]">
                    {t(`event.${e.n}.desc`)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────── */}
      <section
        className="relative py-20 sm:py-24 lg:py-32 overflow-hidden"
        style={{ background: 'var(--color-cream-dark)' }}
      >
        {/* Decorative oversized serif quote in the background */}
        <span
          aria-hidden
          className="pointer-events-none absolute select-none text-gold-deep/[0.06] leading-none"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(280px, 38vw, 520px)',
            top: '-0.18em',
            right: '-0.08em',
          }}
        >
          “
        </span>

        <div className="relative max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section intro */}
          <div className="text-center max-w-[760px] mx-auto mb-12 sm:mb-16">
            <div
              className="inline-flex items-center gap-3 text-[10.5px] uppercase tracking-[0.22em] font-bold text-gold-deep mb-5"
              style={{ fontFamily: 'var(--font-mono)' }}
              data-reveal
            >
              <span className="w-8 h-px bg-gold-deep" />
              {t('testi.label')}
              <span className="w-8 h-px bg-gold-deep" />
            </div>
            <h2
              className="font-normal text-ink leading-[1.1] tracking-[-0.02em] mb-4 m-0"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(30px, 4.2vw, 48px)' }}
              data-reveal
            >
              {t('testi.heading')}
            </h2>
            <p
              className="text-[14px] sm:text-[15px] text-ink-soft leading-relaxed max-w-[560px] mx-auto m-0"
              data-reveal
            >
              {t('testi.sub')}
            </p>
          </div>

          {/* Card grid */}
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 list-none m-0 p-0">
            {testimonials.map((tt) => {
              const initials = tt.name
                .split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
              return (
                <li key={tt.n} data-reveal>
                  <article className="group h-full bg-white border border-border rounded-2xl p-7 sm:p-8 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-22px_rgba(38,30,18,0.28)] hover:border-gold/40">
                    {/* Header: stars + source */}
                    <div className="flex items-center justify-between mb-5">
                      <div
                        className="inline-flex items-center gap-0.5 text-gold"
                        aria-label="5 / 5"
                      >
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={14} className="fill-current" />
                        ))}
                      </div>
                      <span
                        className="text-[10px] uppercase tracking-[0.16em] font-bold text-ink-mute"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {tt.source}
                      </span>
                    </div>

                    {/* Quote */}
                    <blockquote
                      className="m-0 mb-7 flex-1 text-[15px] sm:text-[16px] text-ink leading-[1.55] relative"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      <span className="text-gold-deep mr-1" style={{ opacity: 0.55 }} aria-hidden>
                        “
                      </span>
                      {t(`testi.${tt.n}.quote`)}
                      <span className="text-gold-deep ml-0.5" style={{ opacity: 0.55 }} aria-hidden>
                        ”
                      </span>
                    </blockquote>

                    {/* Author */}
                    <footer className="flex items-center gap-3 pt-5 border-t border-border/70 m-0">
                      <div
                        className="w-10 h-10 rounded-full bg-cream-dark border border-border flex items-center justify-center text-[12.5px] font-bold text-gold-deep shrink-0"
                        style={{ fontFamily: 'var(--font-display)' }}
                        aria-hidden
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-semibold text-ink leading-tight truncate">
                          {tt.name}
                        </div>
                        <div
                          className="text-[11.5px] text-ink-mute tracking-wide flex items-center gap-1.5 mt-0.5"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          <span aria-hidden>{tt.flag}</span>
                          <span>{t(`testi.${tt.n}.country`)}</span>
                        </div>
                      </div>
                    </footer>
                  </article>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* ── PRO TIPS ─────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 lg:py-28">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10 lg:gap-16 items-start">
            <div className="lg:sticky lg:top-24" data-reveal>
              <SectionLabel no={t('tips.section')} title={t('tips.title')} />
              <p className="text-[13.5px] sm:text-[14px] text-ink-soft leading-relaxed max-w-[260px] mb-5">
                {t('tips.sub')}
              </p>
              <div
                className="text-[10.5px] uppercase tracking-[0.2em] text-ink-mute"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {t('tips.meta')}
              </div>
            </div>

            <ol className="list-none m-0 p-0 divide-y divide-border border-t border-border">
              {tipsMeta.map((n) => (
                <li
                  key={n}
                  className="grid grid-cols-[44px_1fr] sm:grid-cols-[68px_1fr] gap-4 sm:gap-6 py-6 sm:py-7"
                  data-reveal
                >
                  <span
                    className="text-[28px] sm:text-[40px] font-normal text-gold-deep leading-none tabular-nums"
                    style={{ fontFamily: 'var(--font-display)' }}
                    aria-hidden
                  >
                    {String(n).padStart(2, '0')}
                  </span>
                  <div>
                    <h4
                      className="text-[19px] sm:text-[24px] font-normal tracking-tight text-ink leading-[1.15] mb-2 sm:mb-2.5"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {t(`tip.${n}.title`)}
                    </h4>
                    <p className="text-[13.5px] sm:text-[15px] text-ink-soft leading-relaxed max-w-[620px] m-0">
                      {t(`tip.${n}.desc`)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── VISIT / MAP ──────────────────────────────────────────────── */}
      <section id="visit" className="py-16 sm:py-20 lg:py-28" style={{ background: 'var(--color-cream-dark)' }}>
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <SectionLabel no={t('visit.section')} title={t('visit.title')} />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-6 lg:gap-8">
            <div
              className="lg:col-span-3 rounded-3xl overflow-hidden border border-border bg-white aspect-[5/4] lg:aspect-auto lg:min-h-[480px]"
              data-reveal
            >
              <iframe
                title={t('visit.mapTitle')}
                src="https://www.google.com/maps?q=cho+dem+son+tra+da+nang&output=embed"
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>

            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="bg-white border border-border rounded-2xl p-5 sm:p-6" data-reveal>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={16} className="text-green" />
                  <span
                    className="text-[11px] uppercase tracking-widest font-semibold text-ink-mute"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {t('visit.addressLabel')}
                  </span>
                </div>
                <p
                  className="text-[15px] sm:text-[16px] text-ink leading-snug mb-1"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {t('visit.addressLine1')}
                </p>
                <p className="text-[13px] sm:text-[13.5px] text-ink-soft">{t('visit.addressLine2')}</p>
              </div>

              <div className="bg-white border border-border rounded-2xl p-5 sm:p-6" data-reveal>
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={16} className="text-green" />
                  <span
                    className="text-[11px] uppercase tracking-widest font-semibold text-ink-mute"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {t('visit.hoursLabel')}
                  </span>
                </div>
                <ul className="space-y-1.5 text-[13.5px] sm:text-[14px] text-ink-soft list-none m-0 p-0">
                  <li className="flex justify-between">
                    <span>{t('visit.hoursWeekday')}</span>
                    <span className="text-ink font-semibold">17:30 – 23:45</span>
                  </li>
                  <li className="flex justify-between">
                    <span>{t('visit.hoursWeekend')}</span>
                    <span className="text-ink font-semibold">17:00 – 23:59</span>
                  </li>
                  <li className="flex justify-between text-[12px] sm:text-[12.5px] pt-2 mt-2 border-t border-border">
                    <span>{t('visit.hoursGolden')}</span>
                    <span className="text-green font-bold">19:00 – 21:30</span>
                  </li>
                </ul>
              </div>

              <div className="bg-green text-cream rounded-2xl p-5 sm:p-6" data-reveal>
                <div
                  className="text-[11px] uppercase tracking-widest font-semibold mb-3"
                  style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-mono)' }}
                >
                  {t('visit.howLabel')}
                </div>
                <ul className="space-y-3 list-none m-0 p-0 text-[13px] sm:text-[13.5px]">
                  <li className="flex items-start gap-3">
                    <Footprints size={16} className="text-gold mt-0.5 shrink-0" />
                    <span>
                      <strong>{t('visit.how1.title')}</strong> {t('visit.how1.body')}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Bike size={16} className="text-gold mt-0.5 shrink-0" />
                    <span>
                      <strong>{t('visit.how2.title')}</strong> {t('visit.how2.body')}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Car size={16} className="text-gold mt-0.5 shrink-0" />
                    <span>
                      <strong>{t('visit.how3.title')}</strong> {t('visit.how3.body')}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section id="faq" className="py-16 sm:py-20 lg:py-28">
        <div className="max-w-[860px] mx-auto px-4 sm:px-6 lg:px-8">
          <SectionLabel no={t('faq.section')} title={t('faq.title')} />

          <div className="space-y-2 mt-6 sm:mt-8">
            {faqsMeta.map((n) => (
              <details
                key={n}
                className="group bg-white border border-border rounded-2xl overflow-hidden open:border-green transition-colors"
                data-reveal
              >
                <summary className="flex items-center justify-between gap-4 p-4 sm:p-5 cursor-pointer list-none">
                  <span
                    className="text-[15px] sm:text-[16px] font-medium text-ink pr-2 sm:pr-4"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {t(`faq.${n}.q`)}
                  </span>
                  <ChevronDown
                    size={20}
                    className="text-ink-mute shrink-0 transition-transform group-open:rotate-180 group-open:text-green"
                  />
                </summary>
                <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-[13.5px] sm:text-[14px] text-ink-soft leading-relaxed border-t border-border pt-3 sm:pt-4">
                  {t(`faq.${n}.a`)}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 lg:py-24 relative overflow-hidden bg-ink">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 0% 100%, rgba(201,169,97,0.45), transparent 50%), radial-gradient(circle at 100% 0%, rgba(245,239,224,0.18), transparent 50%)',
          }}
        />
        <div className="relative max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 items-center">
          <div data-reveal>
            <div className="flex items-center gap-2 mb-4 sm:mb-5">
              <div className="w-8 h-px bg-gold" />
              <span
                className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-[0.18em] sm:tracking-[0.2em]"
                style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-mono)' }}
              >
                {t('cta.eyebrow')}
              </span>
            </div>
            <h2
              className="font-normal text-cream leading-[1.05] tracking-[-0.02em] mb-4 sm:mb-5"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 5vw, 56px)' }}
            >
              {t('cta.titlePre')}{' '}
              <em className="italic not-italic" style={{ color: 'var(--color-gold)', fontWeight: 300 }}>
                {t('cta.titleEm')}
              </em>
              {t('cta.titlePost')}
            </h2>
            <p className="text-cream/85 text-[14px] sm:text-[16px] leading-relaxed max-w-[480px] mb-6 sm:mb-8">
              {t('cta.body')}
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://www.facebook.com/NightMarketSonTraDaNangVietNam/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 sm:px-6 py-3 sm:py-3.5 bg-gold text-ink text-[13px] sm:text-sm font-semibold rounded-xl hover:bg-cream transition-colors no-underline inline-flex items-center gap-2"
              >
                <Facebook size={16} /> {t('cta.btnMessenger')}
              </a>
              <a
                href="tel:+84947046556"
                className="px-5 sm:px-6 py-3 sm:py-3.5 bg-white/10 backdrop-blur-sm border border-cream/30 text-cream text-[13px] sm:text-sm font-semibold rounded-xl hover:bg-white/20 transition-colors no-underline inline-flex items-center gap-2"
              >
                <Phone size={16} /> {t('cta.btnCall')}
              </a>
            </div>
          </div>

          <div className="lg:pl-10 lg:border-l border-cream/15" data-reveal>
            <div
              className="text-[10.5px] uppercase tracking-[0.22em] font-bold text-gold mb-5 sm:mb-6"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {t('cta.specLabel')}
            </div>
            <dl className="m-0 p-0 divide-y divide-cream/15 border-y border-cream/15">
              {[
                { v: '17:30', l: 'cta.spec1.l', sub: 'cta.spec1.sub' },
                { v: '23:45', l: 'cta.spec2.l', sub: 'cta.spec2.sub' },
                { v: t('cta.spec3.v'), l: 'cta.spec3.l', sub: 'cta.spec3.sub' },
                { v: t('cta.spec4.v'), l: 'cta.spec4.l', sub: 'cta.spec4.sub' },
              ].map((m) => (
                <div
                  key={m.l}
                  className="grid grid-cols-[88px_1fr] sm:grid-cols-[120px_1fr] gap-4 sm:gap-6 py-4 sm:py-5 items-baseline"
                >
                  <dt
                    className="text-[24px] sm:text-[32px] font-normal tracking-tight text-cream leading-none tabular-nums m-0"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {m.v}
                  </dt>
                  <dd className="m-0">
                    <div
                      className="text-[12.5px] sm:text-[13.5px] text-cream font-semibold uppercase tracking-[0.06em] leading-snug mb-1"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {t(m.l)}
                    </div>
                    <div className="text-[12px] sm:text-[12.5px] text-cream/55 leading-snug">{t(m.sub)}</div>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ── LEGAL STRIP ──────────────────────────────────────────────── */}
      <section aria-labelledby="legal-heading" className="bg-cream-dark/40 border-y border-border py-12 sm:py-16">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8 sm:mb-10">
            <div data-reveal>
              <div
                className="text-[10.5px] text-gold-deep uppercase tracking-[0.18em] font-bold mb-2"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {t('legal.eyebrow')}
              </div>
              <h2
                id="legal-heading"
                className="text-[26px] sm:text-[34px] font-normal tracking-tight text-ink leading-tight m-0"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {t('legal.title')}
              </h2>
              <p className="text-[13px] sm:text-[14px] text-ink-soft leading-relaxed mt-2 max-w-[640px]">
                {t('legal.intro')}
              </p>
            </div>
            <Link
              to="/data-deletion"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-ink text-cream rounded-full text-[12.5px] font-semibold uppercase tracking-[0.08em] no-underline hover:bg-green-deep transition-colors self-start sm:self-end shrink-0"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <Trash2 size={14} /> {t('legal.requestDelete')}
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {[
              {
                to: '/privacy',
                Icon: ShieldCheck,
                titleKey: 'legal.privacy.title',
                descKey: 'legal.privacy.desc',
                metaKey: 'legal.privacy.meta',
              },
              {
                to: '/terms',
                Icon: FileText,
                titleKey: 'legal.terms.title',
                descKey: 'legal.terms.desc',
                metaKey: 'legal.terms.meta',
              },
              {
                to: '/data-deletion',
                Icon: Trash2,
                titleKey: 'legal.delete.title',
                descKey: 'legal.delete.desc',
                metaKey: 'legal.delete.meta',
              },
            ].map(({ to, Icon, titleKey, descKey, metaKey }) => (
              <Link
                key={to}
                to={to}
                className="group bg-white border border-border rounded-2xl p-5 sm:p-6 no-underline flex flex-col hover:border-gold/70 hover:shadow-[0_18px_36px_-22px_rgba(15,25,20,0.25)] transition-all"
                data-reveal
              >
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-green/10 text-green-deep">
                    <Icon size={18} strokeWidth={1.75} />
                  </span>
                  <span
                    className="text-[9.5px] text-ink-mute uppercase tracking-[0.14em] font-semibold mt-1.5"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {t(metaKey)}
                  </span>
                </div>
                <h3 className="text-[16px] sm:text-[17px] font-medium tracking-tight text-ink leading-tight m-0 mb-2">
                  {t(titleKey)}
                </h3>
                <p className="text-[12.5px] sm:text-[13px] text-ink-soft leading-relaxed m-0 mb-4 flex-1">
                  {t(descKey)}
                </p>
                <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-green-deep group-hover:gap-2.5 transition-all mt-auto">
                  {t('legal.readMore')} <span aria-hidden>→</span>
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-8 sm:mt-10 pt-6 sm:pt-7 border-t border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 text-[12px] sm:text-[12.5px] text-ink-soft">
            <div data-reveal>
              <div
                className="text-[9.5px] text-ink-mute uppercase tracking-[0.14em] font-semibold mb-1"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {t('legal.entity.label')}
              </div>
              <div className="text-ink font-medium leading-snug">{t('legal.entity.name')}</div>
              <div className="text-[11.5px] text-ink-mute mt-0.5">{t('legal.entity.gpkd')}</div>
            </div>
            <div data-reveal>
              <div
                className="text-[9.5px] text-ink-mute uppercase tracking-[0.14em] font-semibold mb-1"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {t('legal.hq.label')}
              </div>
              <div className="leading-snug">{t('legal.hq.address')}</div>
            </div>
            <div data-reveal>
              <div
                className="text-[9.5px] text-ink-mute uppercase tracking-[0.14em] font-semibold mb-1"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {t('legal.email.label')}
              </div>
              <a
                href="mailto:privacy@dhtcdanang.com"
                className="text-green-deep font-semibold no-underline hover:underline break-all"
              >
                privacy@dhtcdanang.com
              </a>
              <div className="text-[11.5px] text-ink-mute mt-0.5">{t('legal.email.sub')}</div>
            </div>
            <div data-reveal>
              <div
                className="text-[9.5px] text-ink-mute uppercase tracking-[0.14em] font-semibold mb-1"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {t('legal.hotline.label')}
              </div>
              <div className="text-ink font-medium tabular-nums">+84 236 3 888 666</div>
              <div className="text-[11.5px] text-ink-mute mt-0.5">{t('legal.hotline.sub')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="bg-ink text-cream pt-12 sm:pt-16 pb-8">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 mb-10 sm:mb-12">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={LOGO}
                  alt="Chợ Đêm Sơn Trà"
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-lg object-contain bg-white p-1 border border-cream/15"
                  decoding="async"
                />
                <strong
                  className="text-[16px] sm:text-[17px] font-semibold"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Chợ Đêm Sơn Trà
                </strong>
              </div>
              <p className="text-[12.5px] sm:text-[13px] text-cream/60 leading-relaxed mb-4 sm:mb-5">
                {t('footer.brandDesc')}
              </p>
              <a
                href="https://www.facebook.com/NightMarketSonTraDaNangVietNam/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-cream/10 hover:bg-cream/15 rounded-lg text-[12.5px] font-semibold no-underline text-cream transition-colors"
              >
                <Facebook size={14} /> Wonders Night Market
              </a>
            </div>

            <div>
              <div
                className="text-[10.5px] text-gold uppercase tracking-widest font-bold mb-4"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {t('footer.exploreLabel')}
              </div>
              <ul className="space-y-2 sm:space-y-2.5 text-[13px] text-cream/75 list-none m-0 p-0">
                <li>
                  <a href="#story" className="hover:text-cream no-underline">
                    {t('footer.exploreStory')}
                  </a>
                </li>
                <li>
                  <a href="#flavors" className="hover:text-cream no-underline">
                    {t('footer.exploreFlavors')}
                  </a>
                </li>
                <li>
                  <a href="#zones" className="hover:text-cream no-underline">
                    {t('footer.exploreZones')}
                  </a>
                </li>
                <li>
                  <a href="#events" className="hover:text-cream no-underline">
                    {t('footer.exploreEvents')}
                  </a>
                </li>
                <li>
                  <a href="#visit" className="hover:text-cream no-underline">
                    {t('footer.exploreVisit')}
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-cream no-underline">
                    {t('footer.exploreFaq')}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div
                className="text-[10.5px] text-gold uppercase tracking-widest font-bold mb-4"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {t('footer.contactLabel')}
              </div>
              <ul className="space-y-2 sm:space-y-2.5 text-[13px] text-cream/75 list-none m-0 p-0 mb-5">
                <li className="flex items-start gap-2">
                  <Mail size={13} className="mt-1 text-gold shrink-0" />
                  <a href="mailto:support@dhtcdanang.com" className="hover:text-cream no-underline break-all">
                    support@dhtcdanang.com
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <Phone size={13} className="mt-1 text-gold shrink-0" />
                  <span>+84 94 704 6556</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin size={13} className="mt-1 text-gold shrink-0" />
                  <span>Lý Nam Đế × Mai Hắc Đế, An Hải Tây, Sơn Trà, Đà Nẵng</span>
                </li>
              </ul>
              <ul className="space-y-2 text-[12px] sm:text-[12.5px] text-cream/60 list-none m-0 p-0">
                <li>
                  <Link to="/privacy" className="hover:text-gold no-underline">
                    {t('footer.linkPrivacy')}
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-gold no-underline">
                    {t('footer.linkTerms')}
                  </Link>
                </li>
                <li>
                  <Link to="/data-deletion" className="hover:text-gold no-underline">
                    {t('footer.linkDelete')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-5 sm:pt-6 border-t border-cream/10 flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-3 text-[11px] sm:text-[11.5px] text-cream/45">
            <span style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>{t('footer.copyright')}</span>
            <span style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>{t('footer.gpkd')}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
