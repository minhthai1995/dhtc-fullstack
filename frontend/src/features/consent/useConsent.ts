import { useCallback, useEffect, useState } from 'react'
import { logConsent } from './consent.api'

const STORAGE_KEY = 'dhtc_cookie_consent'
const GA4_ID = import.meta.env.VITE_GA4_ID as string | undefined

type ConsentState = 'accepted' | 'rejected' | null

function loadGA4() {
  if (!GA4_ID || document.getElementById('ga4-script')) return
  const s = document.createElement('script')
  s.id = 'ga4-script'
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`
  s.async = true
  document.head.appendChild(s)
  window.dataLayer = window.dataLayer ?? []
  function gtag(..._args: unknown[]) { window.dataLayer.push(_args) }
  window.gtag = gtag
  gtag('js', new Date())
  gtag('config', GA4_ID)
}

export function useConsent() {
  const [state, setState] = useState<ConsentState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'accepted' || stored === 'rejected' ? stored : null
  })

  useEffect(() => {
    if (state === 'accepted') loadGA4()
  }, [state])

  const accept = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'accepted')
    setState('accepted')
    logConsent({ event_type: 'cookie_accept' }).catch(() => {})
  }, [])

  const reject = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'rejected')
    setState('rejected')
    logConsent({ event_type: 'cookie_reject' }).catch(() => {})
  }, [])

  return { state, accept, reject, decided: state !== null }
}
