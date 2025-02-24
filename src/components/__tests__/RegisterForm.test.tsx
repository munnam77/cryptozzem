import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { RegisterForm } from '../RegisterForm';

describe('RegisterForm', () => {
  const mockRegister = jest.fn();
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderRegisterForm = () => {
    return render(
      <MemoryRouter>
        <AuthContext.Provider value={{
          register: mockRegister,
          user: null,
          isLoading: false,
          error: null,
          login: jest.fn(),
          logout: jest.fn(),
          resetPassword: jest.fn(),
          updateProfile: jest.fn()
        }}>
          <RegisterForm />
        </AuthContext.Provider>
      </MemoryRouter>
    );
  };

  test('renders registration form fields', () => {
    renderRegisterForm();
    
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    renderRegisterForm();
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument();
    });
    
    expect(mockRegister).not.toHaveBeenCalled();
  });

  test('validates password strength', async () => {
    renderRegisterForm();
    
    const passwordInput = screen.getByLabelText(/^password$/i);
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    
    await waitFor(() => {
      expect(screen.getByText(/must be at least 8 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/uppercase letter/i)).toBeInTheDocument();
      expect(screen.getByText(/number/i)).toBeInTheDocument();
      expect(screen.getByText(/special character/i)).toBeInTheDocument();
    });
  });

  test('validates password match', async () => {
    renderRegisterForm();
    
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    fireEvent.change(passwordInput, { target: { value: 'StrongP@ss123' } });
    fireEvent.change(confirmInput, { target: { value: 'DifferentP@ss123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  test('handles successful registration', async () => {
    renderRegisterForm();
    
    const emailInput = screen.getByLabelText(/email address/i);
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'StrongP@ss123' } });
    fireEvent.change(confirmInput, { target: { value: 'StrongP@ss123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        'test@example.com',
        'StrongP@ss123',
        'testuser'
      );
    });
  });

  test('handles registration error', async () => {
    mockRegister.mockRejectedValue(new Error('Email already exists'));
    renderRegisterForm();
    
    const emailInput = screen.getByLabelText(/email address/i);
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'StrongP@ss123' } });
    fireEvent.change(confirmInput, { target: { value: 'StrongP@ss123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });
  });

  test('shows loading state during submission', async () => {
    mockRegister.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    renderRegisterForm();
    
    const emailInput = screen.getByLabelText(/email address/i);
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'StrongP@ss123' } });
    fireEvent.change(confirmInput, { target: { value: 'StrongP@ss123' } });
    fireEvent.click(submitButton);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  test('disables submit button with invalid password', () => {
    renderRegisterForm();
    
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    expect(submitButton).toBeDisabled();
  });
});