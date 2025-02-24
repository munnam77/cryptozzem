import React, { Component, ErrorInfo } from 'react';
import { AuthError } from '../lib/types/auth';

interface Props {
  children: React.ReactNode;
  onAuthError?: (error: AuthError) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isAuthError: boolean;
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isAuthError: false
    };
  }

  static getDerivedStateFromError(error: Error): State {
    const isAuthError = error instanceof AuthError;
    return {
      hasError: true,
      error,
      isAuthError
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Auth Error Boundary caught an error:', error, errorInfo);
    if (this.state.isAuthError && this.props.onAuthError) {
      this.props.onAuthError(error as AuthError);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, isAuthError: false });
  };

  private handleLogout = async () => {
    try {
      // Clear any stored auth state
      localStorage.clear();
      // Redirect to login
      window.location.href = '/login';
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.state.isAuthError) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
              <div className="rounded-md bg-red-50 dark:bg-red-900 p-4">
                <div className="flex flex-col items-center">
                  <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
                    Authentication Error
                  </h3>
                  <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                    {this.state.error?.message || 'An authentication error occurred'}
                  </p>
                  <div className="mt-4 flex space-x-4">
                    <button
                      onClick={this.handleRetry}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={this.handleLogout}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="rounded-md bg-yellow-50 dark:bg-yellow-900 p-4">
              <div className="flex flex-col items-center">
                <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200">
                  Something went wrong
                </h3>
                <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  An error occurred while processing your request
                </p>
                <button
                  onClick={this.handleRetry}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}