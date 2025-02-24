import { test as base, expect as baseExpect } from '@playwright/test';
import { TestMockServer } from './mockServer';

type TestFixtures = {
  setupStorage: void;
  mockServer: TestMockServer;
};

export const test = base.extend<TestFixtures>({
  setupStorage: [async ({ page }, use) => {
    // Setup mock storage state
    await page.addInitScript(() => {
      window.localStorage.setItem('sentiment-config', JSON.stringify({
        providers: {
          Twitter: {
            enabled: true,
            apiKeys: ['mock-key'],
            weight: 0.4,
            retryStrategy: {
              attempts: 3,
              baseDelay: 100,
              maxDelay: 1000,
              timeout: 500
            }
          },
          Reddit: {
            enabled: true,
            apiKeys: ['mock-id:mock-secret'],
            weight: 0.3,
            retryStrategy: {
              attempts: 3,
              baseDelay: 100,
              maxDelay: 1000,
              timeout: 500
            }
          },
          News: {
            enabled: true,
            apiKeys: ['mock-news-key'],
            weight: 0.3,
            retryStrategy: {
              attempts: 3,
              baseDelay: 100,
              maxDelay: 1000,
              timeout: 500
            }
          }
        },
        updateInterval: 1800000,
        minConfidence: 0.6
      }));

      // Mock trained model metadata
      window.localStorage.setItem('trained-model-metadata', JSON.stringify({
        version: '1.0.0',
        lastTraining: Date.now(),
        accuracy: 0.85
      }));

      // Mock training metrics
      window.localStorage.setItem('training-metrics', JSON.stringify([
        { epoch: 0, loss: 0.5, accuracy: 0.6 },
        { epoch: 1, loss: 0.3, accuracy: 0.75 },
        { epoch: 2, loss: 0.2, accuracy: 0.85 }
      ]));
    });
    
    await use();
  }, { auto: true }],

  mockServer: [async ({}, use) => {
    const server = new TestMockServer();
    server.startPriceMockData();
    server.startSentimentMockData();
    await use(server);
    await server.close();
  }, { scope: 'worker' }]
});

// Extend base expect to include our custom matchers
export const expect = baseExpect.extend({
  toHaveUpdatedValue: async (locator, options = {}) => {
    const initialValue = await locator.textContent();
    await baseExpect.poll(async () => {
      const currentValue = await locator.textContent();
      return currentValue !== initialValue;
    }, options);
    return { pass: true };
  }
});