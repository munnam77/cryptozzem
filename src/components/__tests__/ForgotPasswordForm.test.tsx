import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { ForgotPasswordForm } from '../ForgotPasswordForm';

describe('ForgotPasswordForm', () => {
  const mockResetPassword = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderForgotPasswordForm = () => {
    return render(
      <MemoryRouter>
        <AuthContext.Provider value={{
          resetPassword: mockResetPassword,
          user: null,
          isLoading: false,
          error: null,
          login: jest.fn(),
          register: jest.fn(),
          logout: jest.fn(),
          updateProfile: jest.fn()
        }}>
          <ForgotPasswordForm />
        </AuthContext.Provider>
      </MemoryRouter>
    );
  };

  test('renders forgot password form', () => {
    renderForgotPasswordForm();
    
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset instructions/i })).toBeInTheDocument();
    expect(screen.getByText(/back to login/i)).toBeInTheDocument();
  });

  test('validates email field', async () => {
    renderForgotPasswordForm();
    
    const submitButton = screen.getByRole('button', { name: /send reset instructions/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please enter your email/i)).toBeInTheDocument();
    });
    
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  test('handles successful password reset request', async () => {
    renderForgotPasswordForm();
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset instructions/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('test@example.com');
      expect(screen.getByText(/reset instructions sent/i)).toBeInTheDocument();
    });
  });

  test('handles reset error', async () => {
    mockResetPassword.mockRejectedValue(new Error('User not found'));
    renderForgotPasswordForm();
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset instructions/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/user not found/i)).toBeInTheDocument();
    });
  });

  test('shows loading state during submission', async () => {
    mockResetPassword.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    renderForgotPasswordForm();
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset instructions/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  test('provides navigation back to login', () => {
    renderForgotPasswordForm();
    
    const backToLoginLink = screen.getByText(/back to login/i);
    expect(backToLoginLink).toHaveAttribute('href', '/login');
  });
});