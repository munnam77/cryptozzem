import { NavLink } from 'react-router-dom';
import { BarChart2, MessageSquare, Trophy, Share2, Award } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../contexts/ThemeContext';
import { NotificationCenter } from './NotificationCenter';

export function MainNavigation() {
  const { theme } = useTheme();
  
  const navLinks = [
    { to: '/dashboard', icon: BarChart2, label: 'Dashboard' },
    { to: '/signals', icon: Share2, label: 'Signals' },
    { to: '/forum', icon: MessageSquare, label: 'Community' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/achievements', icon: Award, label: 'Achievements' }
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {navLinks.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium',
                    isActive
                      ? 'border-primary dark:border-primary-dark text-primary dark:text-primary-dark'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  )
                }
              >
                <Icon className="w-5 h-5 mr-2" />
                {label}
              </NavLink>
            ))}
          </div>
          <div className="flex items-center">
            <NotificationCenter />
          </div>
        </div>
      </div>
    </nav>
  );
}