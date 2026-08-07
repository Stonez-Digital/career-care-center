import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[CCC] Unhandled application error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-screen place-items-center bg-ink-50 px-6">
          <div className="max-w-md text-center">
            <h1 className="font-heading text-2xl font-bold text-ink-900">Something went wrong</h1>
            <p className="mt-3 text-ink-600">The application encountered an unexpected problem. Please reload and try again.</p>
            <button type="button" className="btn-primary mt-6" onClick={() => window.location.reload()}>
              Reload application
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
