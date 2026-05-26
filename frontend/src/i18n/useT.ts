import { useContext } from 'react'
import { LocaleContext } from './LocaleProvider'
import { messages, type Lang } from './messages'

export function useT() {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    throw new Error('useT must be used inside <LocaleProvider>')
  }
  const { lang, setLang, toggle } = ctx
  const dict = messages[lang]
  const t = (key: string): string => {
    const hit = dict[key]
    if (hit === undefined) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn(`[i18n] missing key "${key}" for lang "${lang}"`)
      }
      return key
    }
    return hit
  }
  return { t, lang, setLang, toggle } as {
    t: (key: string) => string
    lang: Lang
    setLang: (l: Lang) => void
    toggle: () => void
  }
}
