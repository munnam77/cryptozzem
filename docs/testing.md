# Testing Documentation

## Overview
This document outlines the testing infrastructure and requirements for the CryptoSignal Zzem project.

## Test Types

### E2E Tests
End-to-end tests use Playwright to validate the complete application flow. These tests are located in the `e2e/` directory.

#### Key Test Scenarios
- Real-time prediction validation
- Sentiment analysis verification
- Error handling and recovery
- Data synchronization
- Provider health monitoring

#### Mock Server
A WebSocket mock server (`mockServer.ts`) is provided for E2E testing, supporting:
- Market data simulation
- Sentiment data broadcasting
- Provider failure simulation
- Latency adjustment
- Connection management

### Required Test Coverage

#### Prediction System
- Display of real-time predictions
- Confidence level accuracy
- Error handling and recovery
- Real-time updates
- Prediction history
- Model update process
- Cross-timeframe synchronization

#### Sentiment Analysis
- Configuration management
- API key security
- Provider fallback mechanism
- Real-time updates
- Weight-based aggregation
- Provider health monitoring
- Configuration validation
- Data caching

## Running Tests

### E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e prediction.spec.ts
npm run test:e2e sentiment.spec.ts

# Run in debug mode
npm run test:e2e:debug
```

### Test Requirements

#### Environment Setup
- Node.js 16+
- WebSocket support
- Mock server running on port 9443
- Test database configured

#### Test Data
- Sample market data in `fixtures/`
- Provider API mock responses
- Historical price data

## Best Practices

### Writing E2E Tests
1. Use data-testid attributes for element selection
2. Implement proper waiting mechanisms
3. Handle asynchronous operations correctly
4. Clean up test data after each run
5. Use appropriate timeouts
6. Mock external services

### Maintenance
1. Regular updates to mock data
2. Validation of test coverage
3. Performance monitoring
4. Documentation updates

## Continuous Integration

### GitHub Actions
E2E tests are automatically run on:
- Pull requests to main branch
- Daily scheduled runs
- Manual trigger

### Test Reports
- Located in `playwright-report/`
- Coverage reports in `coverage/`
- Performance metrics tracking

## Troubleshooting

### Common Issues
1. WebSocket connection failures
   - Check mock server status
   - Verify port availability
   - Check network conditions

2. Test timeouts
   - Adjust timeout values
   - Check for performance issues
   - Verify async operations

3. Flaky Tests
   - Implement proper wait conditions
   - Use stable selectors
   - Add retry mechanisms

## Future Improvements
1. Visual regression testing
2. Load testing integration
3. Cross-browser testing expansion
4. Mobile device testing
5. API contract testing