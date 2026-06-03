import { useT } from '@/i18n/useT'
import { useConsent } from '@/features/consent/useConsent'

export function ConsentBanner() {
  const { decided, accept, reject } = useConsent()
  const { t } = useT()

  if (decided) return null

  return (
    <div
      role="dialog"
      aria-label={t('consent.ariaLabel')}
      className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
    >
      <div className="max-w-2xl mx-auto bg-white border border-border rounded-2xl shadow-xl p-5">
        <p className="text-sm text-ink leading-relaxed mb-4">
          {t('consent.body')}{' '}
          <a href="/privacy" className="underline text-green hover:opacity-80">
            {t('consent.privacyLink')}
          </a>
          .
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={accept}
            className="px-4 py-2 bg-green text-white text-sm font-semibold rounded-lg hover:bg-green-soft transition-colors"
          >
            {t('consent.accept')}
          </button>
          <button
            onClick={reject}
            className="px-4 py-2 border border-border text-ink-soft text-sm font-medium rounded-lg hover:bg-cream transition-colors"
          >
            {t('consent.reject')}
          </button>
        </div>
      </div>
    </div>
  )
}
