import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from '@/lib/icons';
import { reportError } from '@/lib/reportError';

interface Props {
  children: React.ReactNode;
}
interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * App-wide error boundary. Catches render/runtime errors in the React tree so a
 * single failing component shows a recoverable fallback instead of a blank page.
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    reportError(error, { componentStack: info.componentStack });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="mb-4 h-14 w-14 text-destructive" weight="duotone" />
          <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
          <p className="mt-2 max-w-md text-muted-foreground">
            An unexpected error interrupted this page. You can try again, or return to the home page.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-4 max-w-lg overflow-auto rounded-md bg-muted p-3 text-left text-xs text-muted-foreground">
              {this.state.error.message}
            </pre>
          )}
          <div className="mt-6 flex gap-3">
            <Button onClick={this.handleReset}>Try again</Button>
            <Button variant="outline" onClick={() => { window.location.href = '/'; }}>
              Go home
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
