import { PreTrainedModelManager } from '../preTrainedModel';
import localforage from 'localforage';
import * as tf from '@tensorflow/tfjs';

jest.mock('localforage');
jest.mock('@tensorflow/tfjs');

describe('PreTrainedModelManager', () => {
  let manager: PreTrainedModelManager;
  const mockLocalForage = localforage as jest.Mocked<typeof localforage>;

  beforeEach(() => {
    jest.clearAllMocks();
    (PreTrainedModelManager as any).instance = null;
    manager = PreTrainedModelManager.getInstance();
  });

  it('should load pre-trained weights', async () => {
    const mockWeights = {
      timeframe: '1h',
      version: '1.0.0',
      weights: [new ArrayBuffer(100)],
      metadata: {
        meanAccuracy: 0.85,
        trainingSamples: 10000,
        lastUpdated: Date.now(),
        architecture: 'lstm-50-30-1'
      }
    };

    mockLocalForage.getItem.mockResolvedValue(mockWeights);

    const weights = await manager.loadPreTrainedWeights('1h');
    expect(weights).toBeTruthy();
    expect(mockLocalForage.getItem).toHaveBeenCalledWith('pretrained-weights-1h');
  });

  it('should return null for incompatible version', async () => {
    const mockWeights = {
      timeframe: '1h',
      version: '0.9.0',
      weights: [new ArrayBuffer(100)],
      metadata: {
        meanAccuracy: 0.85,
        trainingSamples: 10000,
        lastUpdated: Date.now(),
        architecture: 'lstm-50-30-1'
      }
    };

    mockLocalForage.getItem.mockResolvedValue(mockWeights);

    const weights = await manager.loadPreTrainedWeights('1h');
    expect(weights).toBeNull();
  });

  it('should save pre-trained weights', async () => {
    const weights = [new ArrayBuffer(100)];
    const metadata = {
      meanAccuracy: 0.85,
      trainingSamples: 10000,
      lastUpdated: Date.now(),
      architecture: 'lstm-50-30-1'
    };

    await manager.savePreTrainedWeights('1h', weights, metadata);
    expect(mockLocalForage.setItem).toHaveBeenCalled();
  });

  it('should throw error for unsupported timeframe', async () => {
    const weights = [new ArrayBuffer(100)];
    const metadata = {
      meanAccuracy: 0.85,
      trainingSamples: 10000,
      lastUpdated: Date.now(),
      architecture: 'lstm-50-30-1'
    };

    await expect(
      manager.savePreTrainedWeights('invalid', weights, metadata)
    ).rejects.toThrow('Unsupported timeframe');
  });

  it('should export weights to blob', async () => {
    const mockWeights = {
      timeframe: '1h',
      version: '1.0.0',
      weights: [new ArrayBuffer(100)],
      metadata: {
        meanAccuracy: 0.85,
        trainingSamples: 10000,
        lastUpdated: Date.now(),
        architecture: 'lstm-50-30-1'
      }
    };

    mockLocalForage.getItem.mockResolvedValue(mockWeights);

    const blob = await manager.exportWeights('1h');
    expect(blob).toBeInstanceOf(Blob);
  });

  it('should import valid weights', async () => {
    const mockWeights = {
      timeframe: '1h',
      version: '1.0.0',
      weights: [new ArrayBuffer(100)],
      metadata: {
        meanAccuracy: 0.85,
        trainingSamples: 10000,
        lastUpdated: Date.now(),
        architecture: 'lstm-50-30-1'
      }
    };

    const blob = new Blob([JSON.stringify(mockWeights)]);
    const success = await manager.importWeights('1h', blob);
    expect(success).toBe(true);
    expect(mockLocalForage.setItem).toHaveBeenCalled();
  });

  it('should reject incompatible weights during import', async () => {
    const mockWeights = {
      timeframe: '1h',
      version: '0.9.0',
      weights: [new ArrayBuffer(100)],
      metadata: {
        meanAccuracy: 0.85,
        trainingSamples: 10000,
        lastUpdated: Date.now(),
        architecture: 'lstm-50-30-1'
      }
    };

    const blob = new Blob([JSON.stringify(mockWeights)]);
    const success = await manager.importWeights('1h', blob);
    expect(success).toBe(false);
  });

  it('should clear weights for specific timeframe', async () => {
    await manager.clearWeights('1h');
    expect(mockLocalForage.removeItem).toHaveBeenCalledWith('pretrained-weights-1h');
  });

  it('should clear all weights', async () => {
    await manager.clearWeights();
    expect(mockLocalForage.removeItem).toHaveBeenCalledTimes(5); // 5 supported timeframes
  });
});