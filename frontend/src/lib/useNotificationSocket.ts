import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export function useNotificationSocket() {
  const qc = useQueryClient()
  const wsRef = useRef<WebSocket | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    function connect() {
      const token = sessionStorage.getItem('access_token')
      if (!token || !mountedRef.current) return

      // In dev, backend is on port 8000; in prod use same host
      const isLocalDev = window.location.host.startsWith('localhost')
      const wsHost = isLocalDev ? 'localhost:8000' : window.location.host
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const ws = new WebSocket(`${protocol}//${wsHost}/api/v1/ws/notifications?token=${encodeURIComponent(token)}`)
      wsRef.current = ws

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as { type: string }
          if (data.type === 'refresh') {
            qc.invalidateQueries({ queryKey: ['notifications'] })
          }
        } catch {
          // ignore malformed messages
        }
      }

      ws.onclose = () => {
        if (mountedRef.current) {
          timerRef.current = setTimeout(connect, 5000)
        }
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    connect()

    return () => {
      mountedRef.current = false
      if (timerRef.current) clearTimeout(timerRef.current)
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [qc])
}
