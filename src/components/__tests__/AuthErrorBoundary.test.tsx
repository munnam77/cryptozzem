import { render, screen, fireEvent } from '@testing-library/react';
import { AuthErrorBoundary } from '../AuthErrorBoundary';
import { AuthError } from '../../lib/types/auth';

const TestError = new Error('Test error');
const TestAuthError = new AuthError('auth_error', 'Authentication failed');

const ErrorComponent = ({ shouldThrow = false, error = TestError }) => {
  if (shouldThrow) {
    throw error;
  }
  return <div>Test Content</div>;
};

describe('AuthErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for expected errors
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders children when no error', () => {
    render(
      <AuthErrorBoundary>
        <div>Test Content</div>
      </AuthErrorBoundary>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('handles auth errors differently from regular errors', () => {
    render(
      <AuthErrorBoundary>
        <ErrorComponent shouldThrow error={TestAuthError} />
      </AuthErrorBoundary>
    );

    expect(screen.getByText(/authentication error/i)).toBeInTheDocument();
    expect(screen.getByText(/authentication failed/i)).toBeInTheDocument();
    expect(screen.getByText(/try again/i)).toBeInTheDocument();
    expect(screen.getByText(/sign out/i)).toBeInTheDocument();
  });

  test('displays generic error for non-auth errors', () => {
    render(
      <AuthErrorBoundary>
        <ErrorComponent shouldThrow />
      </AuthErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/try again/i)).toBeInTheDocument();
    expect(screen.queryByText(/sign out/i)).not.toBeInTheDocument();
  });

  test('calls onAuthError callback for auth errors', () => {
    const mockOnAuthError = jest.fn();
    render(
      <AuthErrorBoundary onAuthError={mockOnAuthError}>
        <ErrorComponent shouldThrow error={TestAuthError} />
      </AuthErrorBoundary>
    );

    expect(mockOnAuthError).toHaveBeenCalledWith(TestAuthError);
  });

  test('retry button resets error state', () => {
    render(
      <AuthErrorBoundary>
        <ErrorComponent shouldThrow />
      </AuthErrorBoundary>
    );

    const retryButton = screen.getByText(/try again/i);
    fireEvent.click(retryButton);

    // Component should attempt to re-render children
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
  });

  test('sign out button clears storage and redirects', () => {
    const mockClear = jest.spyOn(Storage.prototype, 'clear');
    const originalLocation = window.location;
    delete window.location;
    window.location = { href: '' } as Location;

    render(
      <AuthErrorBoundary>
        <ErrorComponent shouldThrow error={TestAuthError} />
      </AuthErrorBoundary>
    );

    const signOutButton = screen.getByText(/sign out/i);
    fireEvent.click(signOutButton);

    expect(mockClear).toHaveBeenCalled();
    expect(window.location.href).toBe('/login');

    // Cleanup
    mockClear.mockRestore();
    window.location = originalLocation;
  });
});