import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Widget Error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-sm font-medium">Widget Error</h3>
          </div>
          <p className="mt-2 text-sm text-red-700 dark:text-red-300">
            {this.state.error?.message || 'Something went wrong'}
          </p>
          <button
            onClick={this.handleRetry}
            className="mt-3 px-3 py-1 text-sm text-red-600 dark:text-red-400 
                     hover:text-red-700 dark:hover:text-red-300 font-medium"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}