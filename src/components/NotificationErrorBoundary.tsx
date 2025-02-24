import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

export class NotificationErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
    retryCount: 0
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      retryCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Notification Error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState(prev => ({
      hasError: false,
      error: null,
      retryCount: prev.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="relative p-2">
          <button
            className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={this.handleRetry}
          >
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <span className="sr-only">Notification system error - Click to retry</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}