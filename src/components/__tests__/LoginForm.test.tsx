import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { LoginForm } from '../LoginForm';

describe('LoginForm', () => {
  const mockLogin = jest.fn();
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderLoginForm = () => {
    return render(
      <MemoryRouter>
        <AuthContext.Provider value={{
          login: mockLogin,
          user: null,
          isLoading: false,
          error: null,
          register: jest.fn(),
          logout: jest.fn(),
          resetPassword: jest.fn(),
          updateProfile: jest.fn()
        }}>
          <LoginForm />
        </AuthContext.Provider>
      </MemoryRouter>
    );
  };

  test('renders login form fields', () => {
    renderLoginForm();
    
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /remember me/i })).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    renderLoginForm();
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument();
    });
    
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('handles successful login', async () => {
    renderLoginForm();
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  test('handles login error', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));
    renderLoginForm();
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  test('shows loading state during submission', async () => {
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    renderLoginForm();
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  test('remembers user preferences', () => {
    renderLoginForm();
    
    const rememberMeCheckbox = screen.getByRole('checkbox', { name: /remember me/i });
    fireEvent.click(rememberMeCheckbox);
    
    expect(rememberMeCheckbox).toBeChecked();
  });

  test('provides navigation links', () => {
    renderLoginForm();
    
    expect(screen.getByText(/forgot your password/i)).toHaveAttribute('href', '/forgot-password');
    expect(screen.getByText(/sign up/i)).toHaveAttribute('href', '/register');
  });
});