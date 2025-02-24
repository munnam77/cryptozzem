import { test, expect } from './fixtures';

test.describe('Prediction System E2E', () => {
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
    });
    
    // Wait for either prediction grid or error message to appear
    await Promise.race([
      page.waitForSelector('[data-testid="prediction-grid"]', { timeout: 45000 }),
      page.waitForSelector('[data-testid="error-message"]', { timeout: 45000 })
    ]);
  });

  test('displays real-time predictions', async ({ page }) => {
    // Check for prediction cards
    const predictionCards = page.locator('[data-testid="prediction-card"]');
    await expect(predictionCards).toHaveCount(3); // 1h, 4h, 1d timeframes

    // Verify prediction content
    const firstCard = predictionCards.first();
    await expect(firstCard.locator('[data-testid="prediction-timeframe"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="prediction-value"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="confidence-meter"]')).toBeVisible();
  });

  test('shows accurate confidence levels', async ({ page }) => {
    const confidenceMeter = page.locator('[data-testid="confidence-meter"]').first();
    await expect(confidenceMeter).toBeVisible({ timeout: 10000 });
    const confidenceValue = await confidenceMeter.getAttribute('data-confidence');
    
    expect(parseFloat(confidenceValue!)).toBeGreaterThanOrEqual(0);
    expect(parseFloat(confidenceValue!)).toBeLessThanOrEqual(1);
  });

  test('handles provider failures gracefully', async ({ page }) => {
    // First ensure predictions are visible
    await page.waitForSelector('[data-testid="prediction-card"]', { timeout: 10000 });
    
    // Simulate provider failure by disconnecting websocket
    await page.evaluate(() => {
      const ws = (window as any)._debugWebSocket;
      if (ws) ws.close();
    });

    // Check for error message and recovery attempt
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    
    // Verify reconnection attempt
    const reconnectingIndicator = page.locator('[data-testid="reconnecting-indicator"]');
    await expect(reconnectingIndicator).toBeVisible({ timeout: 5000 });
  });

  test('updates predictions in real-time', async ({ page, mockServer }) => {
    // Get initial prediction
    const predictionValue = page.locator('[data-testid="prediction-value"]').first();
    const initialValue = await predictionValue.textContent();

    // Send new price data through mock server
    await mockServer.broadcast(JSON.stringify({
      e: 'trade',
      s: 'BTCUSDT',
      p: '45000.00',
      q: '0.1',
      T: Date.now()
    }));

    // Wait for prediction update
    await expect(async () => {
      const newValue = await predictionValue.textContent();
      expect(newValue).not.toBe(initialValue);
    }).toPass({ timeout: 10000 });
  });

  test('maintains prediction history', async ({ page }) => {
    // Open history view
    await page.click('[data-testid="history-button"]');
    
    // Check history entries
    const historyEntries = page.locator('[data-testid="history-entry"]');
    await expect(historyEntries).toHaveCount.greaterThan(0);
    
    // Verify history entry content
    const firstEntry = historyEntries.first();
    await expect(firstEntry.locator('[data-testid="history-timestamp"]')).toBeVisible();
    await expect(firstEntry.locator('[data-testid="history-accuracy"]')).toBeVisible();
  });

  test('handles model updates correctly', async ({ page }) => {
    // Trigger model update
    await page.click('[data-testid="update-model"]');
    
    // Check for update progress indicator
    const updateProgress = page.locator('[data-testid="update-progress"]');
    await expect(updateProgress).toBeVisible();
    
    // Wait for update completion
    await expect(updateProgress).toHaveAttribute('data-status', 'complete', { timeout: 30000 });
    
    // Verify new model version is displayed
    const modelVersion = page.locator('[data-testid="model-version"]');
    await expect(modelVersion).toBeVisible();
  });

  test('synchronizes data across timeframes', async ({ page }) => {
    // Get all timeframe cards
    const timeframeCards = page.locator('[data-testid="prediction-card"]');
    
    // Check initial state
    await expect(timeframeCards).toHaveCount(3);
    
    // Send new market data
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('marketUpdate', {
        detail: {
          price: 45000,
          volume: 100,
          timestamp: Date.now()
        }
      }));
    });

    // Verify all timeframes updated
    await Promise.all([
      expect(timeframeCards.nth(0).locator('[data-testid="last-update"]')).toHaveAttribute('data-timestamp', /.+/),
      expect(timeframeCards.nth(1).locator('[data-testid="last-update"]')).toHaveAttribute('data-timestamp', /.+/),
      expect(timeframeCards.nth(2).locator('[data-testid="last-update"]')).toHaveAttribute('data-timestamp', /.+/)
    ]);
  });

  test('displays sentiment analysis results', async ({ page }) => {
    const sentimentIndicator = page.locator('[data-testid="sentiment-indicator"]');
    await expect(sentimentIndicator).toBeVisible({ timeout: 10000 });
    
    // Check provider health indicators
    const providerHealth = page.locator('[data-testid="provider-health"]');
    await expect(providerHealth).toBeVisible();
    
    // Verify sentiment score range
    const sentimentScore = await sentimentIndicator.getAttribute('data-sentiment');
    expect(parseFloat(sentimentScore!)).toBeGreaterThanOrEqual(-1);
    expect(parseFloat(sentimentScore!)).toBeLessThanOrEqual(1);
  });
});