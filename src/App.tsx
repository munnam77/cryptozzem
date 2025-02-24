import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AlertProvider } from './contexts/AlertContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { ForgotPasswordForm } from './components/ForgotPasswordForm';
import { ResetPasswordForm } from './components/ResetPasswordForm';
import { UnauthorizedPage } from './components/UnauthorizedPage';
import { DashboardGrid, DashboardGridProps } from './components/DashboardGrid';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from './contexts/ThemeContext';
import { useState } from 'react';
import { Forum } from './components/Forum';
import { Discussion } from './components/Discussion';
import { Leaderboard } from './components/Leaderboard';
import { MainNavigation } from './components/MainNavigation';
import { SignalSharing } from './components/SignalSharing';
import { AchievementSystem } from './components/AchievementSystem';
import { NotificationPreferences } from './components/NotificationPreferences';

interface GridItem {
  id: string;
  type: 'prediction' | 'chart' | 'clock' | 'metrics';
  size: 'small' | 'medium' | 'large';
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button 
      onClick={toggleTheme}
      className="fixed top-4 right-4 p-2 rounded-full bg-surface-light dark:bg-surface-dark"
    >
      {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}

const defaultGridItems: GridItem[] = [
  { id: 'clock', type: 'clock', size: 'small' },
  { id: 'btc-prediction', type: 'prediction', size: 'medium' },
  { id: 'eth-prediction', type: 'prediction', size: 'medium' },
  { id: 'price-chart', type: 'chart', size: 'large' },
  { id: 'market-metrics', type: 'metrics', size: 'medium' }
];

function AppContent() {
  const [gridItems, setGridItems] = useState(defaultGridItems);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <ThemeToggle />
      <MainNavigation />
      <div className="container mx-auto px-4 py-8">
        <DashboardGrid 
          initialItems={gridItems} 
          onItemsChange={setGridItems}
          className="min-h-[80vh]" 
        />
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AlertProvider>
          <AuthProvider>
            <NotificationProvider>
              <Routes>
                {/* Public Routes */}
                <Route
                  path="/login"
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <LoginForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <RegisterForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <ForgotPasswordForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reset-password"
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <ResetPasswordForm />
                    </ProtectedRoute>
                  }
                />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />

                {/* Protected Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AppContent />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <AppContent />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/forum"
                  element={
                    <ProtectedRoute>
                      <Forum />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/forum/:postId"
                  element={
                    <ProtectedRoute>
                      <Discussion />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/leaderboard"
                  element={
                    <ProtectedRoute>
                      <Leaderboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/signals"
                  element={
                    <ProtectedRoute>
                      <SignalSharing />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/achievements"
                  element={
                    <ProtectedRoute>
                      <AchievementSystem />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings/notifications"
                  element={
                    <ProtectedRoute>
                      <NotificationPreferences />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin/*"
                  element={
                    <ProtectedRoute requiredRoles={['admin']}>
                      <div>Admin Panel</div>
                    </ProtectedRoute>
                  }
                />

                {/* 404 Route */}
                <Route
                  path="*"
                  element={
                    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                      <div className="text-center">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                          Page Not Found
                        </h2>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                          The page you're looking for doesn't exist.
                        </p>
                      </div>
                    </div>
                  }
                />
              </Routes>
            </NotificationProvider>
          </AuthProvider>
        </AlertProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;