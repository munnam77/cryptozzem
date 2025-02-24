import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { ProtectedRoute } from '../ProtectedRoute';
import { User } from '../../lib/types/auth';

// Mock component to verify navigation
const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

describe('ProtectedRoute', () => {
  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
    createdAt: new Date(),
    updatedAt: new Date(),
    preferences: {
      roles: ['user'],
      theme: 'light',
      defaultTimeframe: '1h',
      notificationsEnabled: true,
      favoriteCoins: [],
      dashboardLayout: [],
      sentimentProviders: {}
    }
  };

  const renderProtectedRoute = (
    isAuthenticated: boolean = false,
    isLoading: boolean = false,
    requiredRoles: string[] = []
  ) => {
    return render(
      <MemoryRouter initialEntries={['/protected']}>
        <AuthContext.Provider value={{
          user: isAuthenticated ? mockUser : null,
          isLoading,
          error: null,
          login: jest.fn(),
          register: jest.fn(),
          logout: jest.fn(),
          resetPassword: jest.fn(),
          updateProfile: jest.fn()
        }}>
          <Routes>
            <Route path="/login" element={<LocationDisplay />} />
            <Route path="/dashboard" element={<LocationDisplay />} />
            <Route path="/unauthorized" element={<LocationDisplay />} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute requiredRoles={requiredRoles}>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    );
  };

  test('shows loading spinner while authenticating', () => {
    renderProtectedRoute(false, true);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('redirects unauthenticated users to login', () => {
    renderProtectedRoute(false, false);
    expect(screen.getByTestId('location')).toHaveTextContent('/login');
  });

  test('allows authenticated users to access protected content', () => {
    renderProtectedRoute(true, false);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  test('handles role-based access control', () => {
    // User without required role
    renderProtectedRoute(true, false, ['admin']);
    expect(screen.getByTestId('location')).toHaveTextContent('/unauthorized');

    // User with required role
    const userWithRole = {
      ...mockUser,
      preferences: {
        ...mockUser.preferences,
        roles: ['admin']
      }
    };
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <AuthContext.Provider value={{
          user: userWithRole,
          isLoading: false,
          error: null,
          login: jest.fn(),
          register: jest.fn(),
          logout: jest.fn(),
          resetPassword: jest.fn(),
          updateProfile: jest.fn()
        }}>
          <Routes>
            <Route path="/unauthorized" element={<LocationDisplay />} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  test('redirects authenticated users away from auth pages', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthContext.Provider value={{
          user: mockUser,
          isLoading: false,
          error: null,
          login: jest.fn(),
          register: jest.fn(),
          logout: jest.fn(),
          resetPassword: jest.fn(),
          updateProfile: jest.fn()
        }}>
          <Routes>
            <Route path="/dashboard" element={<LocationDisplay />} />
            <Route
              path="/login"
              element={
                <ProtectedRoute requireAuth={false}>
                  <div>Login Page</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    );
    expect(screen.getByTestId('location')).toHaveTextContent('/dashboard');
  });

  test('preserves navigation state during redirects', () => {
    const { container } = renderProtectedRoute(false, false);
    const locationState = JSON.parse(container.dataset.reactRouterState || '{}');
    expect(locationState.from).toBeDefined();
  });
});