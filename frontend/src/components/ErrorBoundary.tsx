import { Component, type ReactNode } from 'react'
import { useT } from '@/i18n/useT'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; error: Error | null }

function DefaultFallback({ message }: { message?: string }) {
  const { t } = useT()
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="text-center max-w-md px-6">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-ink mb-2">{t('errors.boundaryTitle')}</h2>
        <p className="text-ink-mute text-sm mb-6">{message}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-green text-white rounded-xl text-sm font-medium"
        >
          {t('errors.reload')}
        </button>
      </div>
    </div>
  )
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <DefaultFallback message={this.state.error?.message} />
    }
    return this.props.children
  }
}
