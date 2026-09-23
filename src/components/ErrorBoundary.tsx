import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/Logo'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Global Error Boundary: prevents white screens of death if any React
 * component tree throws an unhandled rendering error.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled application error:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12 text-foreground">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface-elevated p-6 shadow-overlay sm:p-8 animate-fade-in text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger mb-4">
              <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            </div>

            <Logo size={24} className="justify-center mb-3" />

            <h1 className="text-h2 font-bold tracking-tight">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              An unexpected error occurred while loading this view. Your saved prompts in Supabase remain completely safe.
            </p>

            {this.state.error && (
              <details className="mt-4 rounded-md border border-border bg-surface p-2.5 text-left text-xs font-mono text-muted-foreground">
                <summary className="cursor-pointer font-medium text-foreground hover:text-primary">
                  Technical details
                </summary>
                <p className="mt-2 whitespace-pre-wrap break-all text-[11px] text-danger/90">
                  {this.state.error.message || String(this.state.error)}
                </p>
              </details>
            )}

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              <Button onClick={this.handleReset} className="w-full sm:w-auto">
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Reload Application
              </Button>
              <Button variant="secondary" onClick={this.handleGoHome} className="w-full sm:w-auto">
                <Home className="h-4 w-4" aria-hidden="true" />
                Go to Home
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
