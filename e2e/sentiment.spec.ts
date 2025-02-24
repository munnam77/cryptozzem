import { test, expect } from './fixtures';

test.describe('Sentiment Analysis E2E', () => {
  test.beforeEach(async ({ page, setupStorage, mockServer }) => {
    await page.goto('/');

    // Intercept WebSocket connections and redirect to mock server
    await page.route('wss://stream.binance.com:9443/*', async route => {
      const ws = new WebSocket('ws://localhost:9443');
      const client = await route.request().frame();
      
      ws.on('message', data => {
        client?.evaluate(data => {
          window.dispatchEvent(new MessageEvent('message', { data })); 
        }, data.toString());
      });

      // Send mock sentiment data periodically
      setInterval(() => {
        client?.evaluate(() => {
          window.dispatchEvent(new CustomEvent('sentiment-update', {
            detail: {
              value: -0.5 + Math.random(), // Random sentiment between -0.5 and 0.5
              providers: {
                Twitter: { status: 'healthy', latency: 100 },
                Reddit: { status: 'healthy', latency: 150 },
                News: { status: 'healthy', latency: 200 }
              }
            }
          }));
        });
      }, 60000);
    });

    // Wait for either provider health or error message to appear
    await Promise.race([
      page.waitForSelector('[data-testid="provider-health"]', { timeout: 45000 }),
      page.waitForSelector('[data-testid="error-message"]', { timeout: 45000 })
    ]);
  });

  test('displays sentiment analysis results and provider health', async ({ page }) => {
    // Check provider health status
    const providerHealth = page.locator('[data-testid="provider-health"]');
    await expect(providerHealth).toBeVisible({ timeout: 10000 });

    // Verify individual provider statuses
    for (const provider of ['twitter', 'reddit', 'news']) {
      const providerStatus = page.locator(`[data-testid="provider-status-${provider}"]`);
      await expect(providerStatus).toBeVisible({ timeout: 10000 });
      
      // Status should be one of: healthy, degraded, down
      const statusText = await providerStatus.locator('span').last().textContent();
      expect(['healthy', 'degraded', 'down']).toContain(statusText?.toLowerCase());
    }

    // Check sentiment indicator
    const sentimentIndicator = page.locator('[data-testid="sentiment-indicator"]');
    await expect(sentimentIndicator).toBeVisible({ timeout: 10000 });

    // Verify sentiment value is within valid range
    const sentiment = await sentimentIndicator.getAttribute('data-sentiment');
    expect(parseFloat(sentiment!)).toBeGreaterThanOrEqual(-1);
    expect(parseFloat(sentiment!)).toBeLessThanOrEqual(1);
  });

  test('updates sentiment in real-time', async ({ page }) => {
    const sentimentIndicator = page.locator('[data-testid="sentiment-indicator"]');
    await expect(sentimentIndicator).toBeVisible({ timeout: 10000 });

    // Get initial sentiment value
    const initialSentiment = await sentimentIndicator.getAttribute('data-sentiment');

    // Wait for sentiment update (updates every minute)
    await page.waitForTimeout(61000);

    // Get updated sentiment value
    const updatedSentiment = await sentimentIndicator.getAttribute('data-sentiment');
    
    // Values should be different after update
    expect(updatedSentiment).not.toBe(initialSentiment);
  });

  test('displays correct provider status colors', async ({ page }) => {
    // Ensure provider health section is visible first
    const providerHealth = page.locator('[data-testid="provider-health"]');
    await expect(providerHealth).toBeVisible({ timeout: 10000 });

    for (const provider of ['twitter', 'reddit', 'news']) {
      const providerStatus = page.locator(`[data-testid="provider-status-${provider}"]`);
      await expect(providerStatus).toBeVisible({ timeout: 5000 });
      
      const status = await providerStatus.locator('span').last().textContent();
      const icon = providerStatus.locator('svg').first();

      switch (status?.toLowerCase()) {
        case 'healthy':
          await expect(icon).toHaveClass(/text-green-500/);
          break;
        case 'degraded':
          await expect(icon).toHaveClass(/text-yellow-500/);
          break;
        case 'down':
          await expect(icon).toHaveClass(/text-red-500/);
          break;
      }
    }
  });

  test('handles configuration changes', async ({ page }) => {
    // Wait for provider health to be visible first
    const providerHealth = page.locator('[data-testid="provider-health"]');
    await expect(providerHealth).toBeVisible({ timeout: 10000 });
    
    // Open sentiment configuration
    await page.getByRole('button', { name: 'Settings' }).click();
    
    // Toggle provider status
    const twitterToggle = page.getByRole('button', { name: 'Enabled' }).first();
    await twitterToggle.click();

    // Verify provider was disabled
    const twitterStatus = page.locator('[data-testid="provider-status-twitter"]');
    await expect(twitterStatus.locator('span').last()).toHaveText('down', { timeout: 5000 });

    // Re-enable provider
    await twitterToggle.click();
    await expect(twitterStatus.locator('span').last()).not.toHaveText('down', { timeout: 5000 });
  });

  test('displays sentiment analysis configuration', async ({ page }) => {
    // Open config dialog
    await page.click('[data-testid="sentiment-config-button"]');
    
    // Check provider sections
    const providers = ['Twitter', 'Reddit', 'News'];
    for (const provider of providers) {
      const section = page.locator(`[data-testid="provider-${provider.toLowerCase()}"]`);
      await expect(section).toBeVisible();
      await expect(section.locator('[data-testid="provider-status"]')).toBeVisible();
      await expect(section.locator('[data-testid="provider-weight"]')).toBeVisible();
    }
  });

  test('manages API keys securely', async ({ page }) => {
    await page.click('[data-testid="sentiment-config-button"]');
    
    // Add new API key
    const provider = page.locator('[data-testid="provider-twitter"]');
    await provider.locator('[data-testid="add-key-input"]').fill('test-api-key');
    await provider.locator('[data-testid="add-key-button"]').click();
    
    // Verify key is masked
    const keyElement = provider.locator('[data-testid="api-key"]').first();
    await expect(keyElement).toBeVisible();
    const keyText = await keyElement.textContent();
    expect(keyText).toMatch(/^[a-zA-Z0-9]{4}\*{8}[a-zA-Z0-9]{4}$/);
  });

  test('handles provider failures with fallback', async ({ page, mockServer }) => {
    // Simulate Twitter provider failure
    await mockServer.failProvider('Twitter');
    
    // Check for fallback to other providers
    await expect(page.locator('[data-testid="provider-twitter-status"]')).toHaveText('error');
    await expect(page.locator('[data-testid="sentiment-score"]')).toBeVisible();
    
    // Verify error recovery
    await mockServer.restoreProvider('Twitter');
    await expect(page.locator('[data-testid="provider-twitter-status"]')).toHaveText('healthy', { timeout: 10000 });
  });

  test('updates sentiment in real-time', async ({ page, mockServer }) => {
    const sentimentScore = page.locator('[data-testid="sentiment-score"]');
    const initialScore = await sentimentScore.textContent();
    
    // Send new sentiment data
    await mockServer.broadcast(JSON.stringify({
      type: 'sentiment',
      data: {
        provider: 'Twitter',
        score: 0.8,
        confidence: 0.9
      }
    }));
    
    // Verify update
    await expect(async () => {
      const newScore = await sentimentScore.textContent();
      expect(newScore).not.toBe(initialScore);
    }).toPass({ timeout: 5000 });
  });

  test('respects provider weights in aggregation', async ({ page }) => {
    await page.click('[data-testid="sentiment-config-button"]');
    
    // Modify provider weights
    await page.locator('[data-testid="provider-twitter"] [data-testid="weight-slider"]').fill('0.8');
    await page.locator('[data-testid="provider-reddit"] [data-testid="weight-slider"]').fill('0.2');
    await page.click('[data-testid="save-config"]');
    
    // Verify weighted score calculation
    const weightedScore = page.locator('[data-testid="weighted-score"]');
    await expect(weightedScore).toBeVisible();
    const score = await weightedScore.getAttribute('data-value');
    expect(parseFloat(score!)).toBeGreaterThanOrEqual(-1);
    expect(parseFloat(score!)).toBeLessThanOrEqual(1);
  });

  test('maintains provider health history', async ({ page }) => {
    await page.click('[data-testid="health-history-button"]');
    
    // Check health history visualization
    const healthHistory = page.locator('[data-testid="health-history"]');
    await expect(healthHistory).toBeVisible();
    
    // Verify history entries
    const entries = healthHistory.locator('[data-testid="history-entry"]');
    await expect(entries).toHaveCount.greaterThan(0);
    
    // Check error rate metrics
    await expect(page.locator('[data-testid="error-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="latency-stats"]')).toBeVisible();
  });

  test('validates configuration changes', async ({ page }) => {
    await page.click('[data-testid="sentiment-config-button"]');
    
    // Try invalid weight
    await page.locator('[data-testid="provider-twitter"] [data-testid="weight-slider"]').fill('1.5');
    await page.click('[data-testid="save-config"]');
    
    // Check for validation error
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    
    // Fix weight and verify save
    await page.locator('[data-testid="provider-twitter"] [data-testid="weight-slider"]').fill('0.5');
    await page.click('[data-testid="save-config"]');
    await expect(page.locator('[data-testid="validation-error"]')).not.toBeVisible();
  });

  test('caches sentiment data appropriately', async ({ page, mockServer }) => {
    // Get initial sentiment
    const initialTimestamp = await page.locator('[data-testid="last-update"]').getAttribute('data-timestamp');
    
    // Disconnect from server
    await mockServer.disconnect();
    
    // Verify cached data is used
    const currentTimestamp = await page.locator('[data-testid="last-update"]').getAttribute('data-timestamp');
    expect(currentTimestamp).toBe(initialTimestamp);
    
    // Reconnect and verify update
    await mockServer.connect();
    await expect(async () => {
      const newTimestamp = await page.locator('[data-testid="last-update"]').getAttribute('data-timestamp');
      expect(newTimestamp).not.toBe(initialTimestamp);
    }).toPass({ timeout: 10000 });
  });
});