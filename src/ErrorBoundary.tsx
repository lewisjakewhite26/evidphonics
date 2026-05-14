import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[EvidPhonics]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-bg p-lg font-andika text-text-main">
          <h1 className="text-heading font-bold text-error">Something went wrong</h1>
          <pre className="mt-md overflow-auto rounded-md bg-surface-raised p-md text-sm text-text-sub">
            {this.state.error.message}
          </pre>
          <button
            type="button"
            className="mt-lg touch-target rounded-md bg-primary px-lg text-label text-white"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
