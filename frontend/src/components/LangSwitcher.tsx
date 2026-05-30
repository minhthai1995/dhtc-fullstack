import { useT } from '@/i18n/useT'

type Props = {
  className?: string
  variant?: 'pill' | 'ghost'
}

export function LangSwitcher({ className = '', variant = 'pill' }: Props) {
  const { t, lang, toggle } = useT()
  const next = lang === 'vi' ? 'EN' : 'VI'
  const ariaLabel = lang === 'vi' ? t('langSwitcher.toEn') : t('langSwitcher.toVi')
  const base =
    variant === 'pill'
      ? 'inline-flex h-9 items-center gap-1 rounded-full border border-border bg-white/80 px-3 text-[12px] font-medium tracking-wide text-ink hover:bg-cream-dark/60 hover:text-ink transition-colors'
      : 'inline-flex h-9 items-center gap-1 rounded-md px-2 text-[12px] font-medium tracking-wide text-ink-soft hover:text-ink transition-colors'
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`${base} ${className}`}
    >
      <span aria-hidden="true" className="font-mono text-[10px] uppercase text-ink-mute">
        {lang.toUpperCase()}
      </span>
      <span aria-hidden="true" className="text-ink-mute">/</span>
      <span className="font-mono text-[11px] uppercase">{next}</span>
    </button>
  )
}
