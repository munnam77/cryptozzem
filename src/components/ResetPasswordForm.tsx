import React, { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';
import { validatePassword } from '../lib/utils/validation';

export function ResetPasswordForm() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState({
    isValid: false,
    errors: [] as string[]
  });
  const [isValidToken, setIsValidToken] = useState(false);
  const [isTokenChecking, setIsTokenChecking] = useState(true);
  
  const { resetPassword, validateResetToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setFormError('Invalid reset link');
        setIsTokenChecking(false);
        return;
      }

      try {
        await validateResetToken(token);
        setIsValidToken(true);
      } catch (err) {
        setFormError('This reset link has expired or is invalid');
      } finally {
        setIsTokenChecking(false);
      }
    };

    checkToken();
  }, [token, validateResetToken]);

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordStrength(validatePassword(value));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!password || !confirmPassword) {
      setFormError('Please fill in all fields');
      return;
    }

    if (!passwordStrength.isValid) {
      setFormError('Please fix password requirements');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    try {
      setIsSubmitting(true);
      await resetPassword(token!, password);
      navigate('/login', { 
        state: { message: 'Your password has been reset successfully. Please login with your new password.' }
      });
    } catch (err) {
      const error = err as Error;
      setFormError(error.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isTokenChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="rounded-md bg-red-50 dark:bg-red-900 p-4">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              {formError}
            </h3>
            <p className="mt-2 text-sm text-red-700 dark:text-red-300">
              Please request a new password reset link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Reset your password
          </h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {formError && (
            <div className="rounded-md bg-red-50 dark:bg-red-900 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    {formError}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="password" className="sr-only">
                New password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className="appearance-none rounded-t-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-800"
                placeholder="New password"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Confirm new password
              </label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-800"
                placeholder="Confirm new password"
              />
            </div>
          </div>

          {password && (
            <div className="rounded-md bg-gray-50 dark:bg-gray-800 p-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Password Requirements:
              </h4>
              <ul className="list-disc pl-5 space-y-1">
                {passwordStrength.errors.map((error, index) => (
                  <li
                    key={index}
                    className="text-sm text-red-600 dark:text-red-400"
                  >
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting || !passwordStrength.isValid}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? (
                <LoadingSpinner className="h-5 w-5" />
              ) : (
                'Reset password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}