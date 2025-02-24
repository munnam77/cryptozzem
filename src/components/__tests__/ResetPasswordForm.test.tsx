import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { ResetPasswordForm } from '../ResetPasswordForm';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: jest.fn()
}));

describe('ResetPasswordForm', () => {
  const mockResetPassword = jest.fn();
  const mockValidateResetToken = jest.fn();
  const mockNavigate = jest.fn();
  const validToken = 'valid-reset-token';

  beforeEach(() => {
    jest.clearAllMocks();
    (useSearchParams as jest.Mock).mockReturnValue([
      { get: () => validToken }
    ]);
    mockValidateResetToken.mockResolvedValue(true);
  });

  const renderResetPasswordForm = () => {
    return render(
      <MemoryRouter>
        <AuthContext.Provider value={{
          resetPassword: mockResetPassword,
          validateResetToken: mockValidateResetToken,
          user: null,
          isLoading: false,
          error: null,
          login: jest.fn(),
          register: jest.fn(),
          logout: jest.fn(),
          updateProfile: jest.fn()
        }}>
          <ResetPasswordForm />
        </AuthContext.Provider>
      </MemoryRouter>
    );
  };

  test('validates reset token on mount', async () => {
    renderResetPasswordForm();
    
    await waitFor(() => {
      expect(mockValidateResetToken).toHaveBeenCalledWith(validToken);
    });
  });

  test('shows error for invalid token', async () => {
    mockValidateResetToken.mockRejectedValue(new Error('Invalid token'));
    renderResetPasswordForm();
    
    await waitFor(() => {
      expect(screen.getByText(/expired or is invalid/i)).toBeInTheDocument();
    });
  });

  test('validates password requirements', async () => {
    renderResetPasswordForm();
    await waitFor(() => expect(mockValidateResetToken).toHaveBeenCalled());
    
    const passwordInput = screen.getByLabelText(/new password/i);
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    
    expect(screen.getByText(/must be at least 8 characters/i)).toBeInTheDocument();
  });

  test('validates password match', async () => {
    renderResetPasswordForm();
    await waitFor(() => expect(mockValidateResetToken).toHaveBeenCalled());
    
    const passwordInput = screen.getByLabelText(/new password/i);
    const confirmInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    fireEvent.change(passwordInput, { target: { value: 'StrongP@ss123' } });
    fireEvent.change(confirmInput, { target: { value: 'DifferentP@ss123' } });
    fireEvent.click(submitButton);
    
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  test('handles successful password reset', async () => {
    renderResetPasswordForm();
    await waitFor(() => expect(mockValidateResetToken).toHaveBeenCalled());
    
    const passwordInput = screen.getByLabelText(/new password/i);
    const confirmInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    fireEvent.change(passwordInput, { target: { value: 'StrongP@ss123' } });
    fireEvent.change(confirmInput, { target: { value: 'StrongP@ss123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith(validToken, 'StrongP@ss123');
    });
  });

  test('handles reset error', async () => {
    mockResetPassword.mockRejectedValue(new Error('Reset failed'));
    renderResetPasswordForm();
    await waitFor(() => expect(mockValidateResetToken).toHaveBeenCalled());
    
    const passwordInput = screen.getByLabelText(/new password/i);
    const confirmInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    fireEvent.change(passwordInput, { target: { value: 'StrongP@ss123' } });
    fireEvent.change(confirmInput, { target: { value: 'StrongP@ss123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/reset failed/i)).toBeInTheDocument();
    });
  });

  test('shows loading state during submission', async () => {
    mockResetPassword.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    renderResetPasswordForm();
    await waitFor(() => expect(mockValidateResetToken).toHaveBeenCalled());
    
    const passwordInput = screen.getByLabelText(/new password/i);
    const confirmInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    fireEvent.change(passwordInput, { target: { value: 'StrongP@ss123' } });
    fireEvent.change(confirmInput, { target: { value: 'StrongP@ss123' } });
    fireEvent.click(submitButton);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  test('disables submit button with invalid password', async () => {
    renderResetPasswordForm();
    await waitFor(() => expect(mockValidateResetToken).toHaveBeenCalled());
    
    const passwordInput = screen.getByLabelText(/new password/i);
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    expect(submitButton).toBeDisabled();
  });
});