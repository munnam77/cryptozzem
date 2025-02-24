import { render, screen, fireEvent, act } from '@testing-library/react';
import { SentimentConfigForm } from '../SentimentConfigForm';
import { ConfigManager } from '../../lib/predictions/config';
import { useProviderHealth } from '../../hooks/useProviderHealth';

jest.mock('../../hooks/useProviderHealth');
jest.mock('../../lib/predictions/config');

describe('SentimentConfigForm', () => {
  const mockConfig = {
    providers: {
      Twitter: {
        enabled: true,
        apiKeys: ['test-key-1', 'test-key-2'],
        weight: 0.4,
        retryStrategy: {
          attempts: 5,
          baseDelay: 2000,
          maxDelay: 30000,
          timeout: 10000
        }
      },
      Reddit: {
        enabled: false,
        apiKeys: [],
        weight: 0.3,
        retryStrategy: {
          attempts: 3,
          baseDelay: 1000,
          maxDelay: 15000,
          timeout: 10000
        }
      }
    },
    updateInterval: 1800000,
    minConfidence: 0.6,
    cacheTimeout: 3600000
  };

  const mockHealthStatus = [
    {
      provider: 'Twitter',
      status: 'healthy',
      lastCheck: Date.now(),
      errors: { total: 0, rateLimit: 0, network: 0, auth: 0, other: 0 },
      latency: { avg: 100, min: 50, max: 150, samples: 10 }
    },
    {
      provider: 'Reddit',
      status: 'degraded',
      lastCheck: Date.now(),
      errors: { total: 1, rateLimit: 0, network: 1, auth: 0, other: 0 },
      latency: { avg: 200, min: 100, max: 300, samples: 5 }
    }
  ];

  beforeEach(() => {
    (ConfigManager.getInstance as jest.Mock).mockReturnValue({
      getConfig: jest.fn().mockReturnValue(mockConfig),
      setProviderConfig: jest.fn(),
      addApiKey: jest.fn(),
      removeApiKey: jest.fn()
    });

    (useProviderHealth as jest.Mock).mockReturnValue({
      healthStatus: mockHealthStatus,
      isSystemHealthy: true
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders provider sections with correct status', () => {
    render(<SentimentConfigForm />);

    expect(screen.getByText('Twitter')).toBeInTheDocument();
    expect(screen.getByText('Reddit')).toBeInTheDocument();
    
    // Check status badges
    expect(screen.getByText('healthy')).toBeInTheDocument();
    expect(screen.getByText('degraded')).toBeInTheDocument();
  });

  test('toggles provider enabled state', () => {
    const mockSetProviderConfig = jest.fn();
    (ConfigManager.getInstance as jest.Mock).mockReturnValue({
      ...ConfigManager.getInstance(),
      setProviderConfig: mockSetProviderConfig
    });

    render(<SentimentConfigForm />);
    
    const enabledButton = screen.getByText('Enabled');
    fireEvent.click(enabledButton);

    expect(mockSetProviderConfig).toHaveBeenCalledWith('Twitter', {
      enabled: false
    });
  });

  test('adds new API key', () => {
    const mockAddApiKey = jest.fn();
    (ConfigManager.getInstance as jest.Mock).mockReturnValue({
      ...ConfigManager.getInstance(),
      addApiKey: mockAddApiKey
    });

    render(<SentimentConfigForm />);
    
    const input = screen.getByPlaceholderText('Enter API key');
    const addButton = screen.getByText('Add Key');

    fireEvent.change(input, { target: { value: 'new-api-key' } });
    fireEvent.click(addButton);

    expect(mockAddApiKey).toHaveBeenCalledWith('Twitter', 'new-api-key');
  });

  test('removes API key', () => {
    const mockRemoveApiKey = jest.fn();
    (ConfigManager.getInstance as jest.Mock).mockReturnValue({
      ...ConfigManager.getInstance(),
      removeApiKey: mockRemoveApiKey
    });

    render(<SentimentConfigForm />);
    
    const removeButtons = screen.getAllByRole('button', { name: '' }); // XCircle buttons have no name
    fireEvent.click(removeButtons[0]);

    expect(mockRemoveApiKey).toHaveBeenCalledWith('Twitter', 'test-key-1');
  });

  test('updates provider weight', () => {
    const mockSetProviderConfig = jest.fn();
    (ConfigManager.getInstance as jest.Mock).mockReturnValue({
      ...ConfigManager.getInstance(),
      setProviderConfig: mockSetProviderConfig
    });

    render(<SentimentConfigForm />);
    
    const weightSlider = screen.getAllByRole('slider')[0];
    fireEvent.change(weightSlider, { target: { value: '0.6' } });

    expect(mockSetProviderConfig).toHaveBeenCalledWith('Twitter', {
      weight: 0.6
    });
  });

  test('updates retry settings', () => {
    const mockSetProviderConfig = jest.fn();
    (ConfigManager.getInstance as jest.Mock).mockReturnValue({
      ...ConfigManager.getInstance(),
      setProviderConfig: mockSetProviderConfig
    });

    render(<SentimentConfigForm />);
    
    const attemptsInput = screen.getByRole('spinbutton', { name: /max attempts/i });
    fireEvent.change(attemptsInput, { target: { value: '7' } });

    expect(mockSetProviderConfig).toHaveBeenCalledWith('Twitter', {
      retryStrategy: {
        ...mockConfig.providers.Twitter.retryStrategy,
        attempts: 7
      }
    });
  });

  test('displays masked API keys', () => {
    render(<SentimentConfigForm />);
    
    const maskedKeys = screen.getAllByText(/\.\.\./);
    expect(maskedKeys).toHaveLength(2); // Two keys for Twitter
    
    // Check if keys are properly masked
    expect(maskedKeys[0].textContent).toMatch(/^[a-zA-Z0-9]{8}\.{3}[a-zA-Z0-9]{8}$/);
  });

  test('validates new API key input', () => {
    render(<SentimentConfigForm />);
    
    const addButton = screen.getByText('Add Key');
    expect(addButton).toBeDisabled();

    const input = screen.getByPlaceholderText('Enter API key');
    fireEvent.change(input, { target: { value: ' ' } });
    expect(addButton).toBeDisabled();

    fireEvent.change(input, { target: { value: 'valid-key' } });
    expect(addButton).not.toBeDisabled();
  });
});