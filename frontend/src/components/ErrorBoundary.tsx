import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="min-h-screen flex items-center justify-center bg-cream">
          <div className="text-center max-w-md px-6">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-ink mb-2">Đã xảy ra lỗi</h2>
            <p className="text-ink-mute text-sm mb-6">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-green text-white rounded-xl text-sm font-medium"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
