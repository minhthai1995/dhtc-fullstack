import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { pickInitialLang, type Lang } from './messages'

export type LocaleContextValue = {
  lang: Lang
  setLang: (l: Lang) => void
  toggle: () => void
}

export const LocaleContext = createContext<LocaleContextValue | null>(null)

const STORAGE_KEY = 'dhtc_lang'

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => pickInitialLang())

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // private mode / SSR
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang
    }
  }, [lang])

  const setLang = useCallback((l: Lang) => setLangState(l), [])
  const toggle = useCallback(() => setLangState((cur) => (cur === 'vi' ? 'en' : 'vi')), [])

  const value = useMemo<LocaleContextValue>(() => ({ lang, setLang, toggle }), [lang, setLang, toggle])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}
