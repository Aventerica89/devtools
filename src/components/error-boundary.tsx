'use client'

import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details
    console.error('Error boundary caught:', error, errorInfo)

    // Call optional error handler
    this.props.onError?.(error, errorInfo)

    // TODO: Send to error tracking service (Sentry)
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } })
    // }
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="max-w-lg p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-red-600">Something went wrong</h2>
                <p className="text-muted-foreground">
                  An error occurred while rendering this component.
                </p>
              </div>

              {this.state.error && process.env.NODE_ENV === 'development' && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Error details:</p>
                  <pre className="overflow-auto rounded-md bg-slate-100 p-3 text-xs dark:bg-slate-800">
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                  </pre>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={this.reset}>Try again</Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Reload page
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Lightweight error boundary for smaller components.
 * Shows inline error message instead of full-page error.
 */
export class InlineErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Inline error boundary caught:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            Error loading component
          </p>
          {this.state.error && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {this.state.error.message}
            </p>
          )}
          <Button size="sm" variant="outline" onClick={this.reset} className="mt-2">
            Retry
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
