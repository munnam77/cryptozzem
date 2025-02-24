import * as tf from '@tensorflow/tfjs';
import { LSTMPredictionModel } from '../lstmModel';
import { PreTrainedModelManager } from '../preTrainedModel';
import localforage from 'localforage';
import { ModelFeatures } from '../types';

jest.mock('@tensorflow/tfjs');
jest.mock('localforage');
jest.mock('../preTrainedModel');

describe('LSTMPredictionModel Integration', () => {
  let model: LSTMPredictionModel;
  const mockTf = tf as jest.Mocked<typeof tf>;
  const mockLocalForage = localforage as jest.Mocked<typeof localforage>;
  const mockPreTrainedManager = PreTrainedModelManager as jest.Mocked<typeof PreTrainedModelManager>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock tensor operations
    mockTf.tidy.mockImplementation((fn) => fn());
    mockTf.tensor3d.mockReturnValue({
      data: jest.fn().mockResolvedValue([0.5]),
      dispose: jest.fn()
    });
    mockTf.tensor2d.mockReturnValue({
      data: jest.fn().mockResolvedValue([0.5]),
      dispose: jest.fn()
    });

    // Mock model methods
    const mockLayersModel = {
      predict: jest.fn().mockReturnValue({
        data: jest.fn().mockResolvedValue([0.05]),
        dispose: jest.fn()
      }),
      fit: jest.fn().mockResolvedValue({
        history: {
          loss: [0.1],
          val_loss: [0.2],
          accuracy: [0.8],
          val_accuracy: [0.75]
        }
      }),
      evaluate: jest.fn().mockReturnValue([{
        data: jest.fn().mockResolvedValue([0.2])
      }]),
      save: jest.fn().mockResolvedValue(undefined),
      getWeights: jest.fn().mockReturnValue([
        { dataSync: () => new Float32Array([1, 2, 3]) }
      ]),
      setWeights: jest.fn()
    };

    mockTf.sequential.mockReturnValue(mockLayersModel);
    mockTf.loadLayersModel.mockResolvedValue(mockLayersModel);

    // Mock PreTrainedModelManager
    mockPreTrainedManager.getInstance.mockReturnValue({
      loadPreTrainedWeights: jest.fn(),
      savePreTrainedWeights: jest.fn(),
      getWeightsMetadata: jest.fn(),
      exportWeights: jest.fn(),
      importWeights: jest.fn(),
      validateWeights: jest.fn(),
      clearWeights: jest.fn()
    });

    model = new LSTMPredictionModel('1h');
  });

  it('should load pre-trained weights when available', async () => {
    const mockPreTrainedWeights = [new ArrayBuffer(100)];
    const mockMetadata = {
      meanAccuracy: 0.85,
      trainingSamples: 1000,
      lastUpdated: Date.now(),
      architecture: 'lstm-50-30-1'
    };

    mockPreTrainedManager.getInstance().loadPreTrainedWeights.mockResolvedValue(mockPreTrainedWeights);
    mockLocalForage.getItem.mockResolvedValue(null); // No existing trained model

    const features = createMockFeatures();
    await model.predict(features);

    expect(mockPreTrainedManager.getInstance().loadPreTrainedWeights).toHaveBeenCalledWith('1h');
    expect(mockTf.sequential().setWeights).toHaveBeenCalled();
  });

  it('should save high-performing models as pre-trained', async () => {
    const trainingData = [createMockFeatures()];
    const labels = Array(100).fill(0.1);

    await model.train(trainingData, labels);

    expect(mockPreTrainedManager.getInstance().savePreTrainedWeights).toHaveBeenCalled();
  });

  it('should optimize model during training', async () => {
    const trainingData = [createMockFeatures()];
    const labels = Array(100).fill(0.1);

    // Mock training metrics
    const mockMetrics = Array(10).fill(0).map((_, i) => ({
      loss: 0.5 - i * 0.05,
      accuracy: 0.5 + i * 0.05,
      validationLoss: 0.6 - i * 0.05,
      validationAccuracy: 0.4 + i * 0.05,
      epoch: i
    }));

    mockLocalForage.getItem.mockResolvedValue(mockMetrics);

    await model.train(trainingData, labels);

    // Verify model quantization
    const savedModel = await mockTf.loadLayersModel(`indexeddb://lstm-model-1h`);
    expect(savedModel.getWeights).toHaveBeenCalled();
  });

  it('should handle training interruption gracefully', async () => {
    const trainingData = [createMockFeatures()];
    const labels = Array(100).fill(0.1);

    // Simulate training error
    mockTf.sequential().fit.mockRejectedValueOnce(new Error('Training interrupted'));

    await expect(model.train(trainingData, labels)).rejects.toThrow('Training interrupted');
    expect(mockLocalForage.getItem).toHaveBeenCalled();
  });

  function createMockFeatures(): ModelFeatures {
    return {
      prices: Array(100).fill(100),
      volumes: Array(100).fill(1000),
      technicalIndicators: {
        rsi: Array(100).fill(50),
        macd: {
          line: Array(100).fill(0),
          signal: Array(100).fill(0),
          histogram: Array(100).fill(0)
        },
        bollingerBands: {
          upper: Array(100).fill(110),
          middle: Array(100).fill(100),
          lower: Array(100).fill(90)
        }
      }
    };
  }
});

describe('LSTM Model Integration', () => {
  let model: LSTMPredictionModel;

  beforeEach(() => {
    model = new LSTMPredictionModel('1h');
  });

  it('should train and predict with real data', async () => {
    // Generate realistic training data
    const historicalData: ModelFeatures[] = Array(100).fill(null).map((_, i) => ({
      prices: Array(100).fill(100).map((p, j) => p + Math.sin(j + i) * 10),
      volumes: Array(100).fill(1000).map(() => 1000 + Math.random() * 500),
      technicalIndicators: {
        rsi: Array(100).fill(50).map(() => 30 + Math.random() * 40),
        macd: {
          line: Array(100).fill(0).map(() => -2 + Math.random() * 4),
          signal: Array(100).fill(0).map(() => -2 + Math.random() * 4),
          histogram: Array(100).fill(0).map(() => -1 + Math.random() * 2)
        },
        bollingerBands: {
          upper: Array(100).fill(110).map((v, i) => v + Math.sin(i) * 5),
          middle: Array(100).fill(100).map((v, i) => v + Math.sin(i) * 5),
          lower: Array(100).fill(90).map((v, i) => v + Math.sin(i) * 5)
        }
      }
    }));

    const labels = historicalData.map(() => Math.random() > 0.5 ? 1 : 0);

    // Train the model
    await model.train(historicalData, labels);

    // Make a prediction
    const prediction = await model.predict(historicalData[0]);

    // Validate prediction structure and values
    expect(prediction).toHaveProperty('predictedGain');
    expect(prediction).toHaveProperty('confidence');
    expect(prediction).toHaveProperty('timeframe', '1h');
    expect(typeof prediction.predictedGain).toBe('number');
    expect(typeof prediction.confidence).toBe('number');
    expect(prediction.confidence).toBeGreaterThanOrEqual(0);
    expect(prediction.confidence).toBeLessThanOrEqual(1);
  }, 30000);

  it('should maintain consistent predictions for similar inputs', async () => {
    const baseFeatures: ModelFeatures = {
      prices: Array(100).fill(100),
      volumes: Array(100).fill(1000),
      technicalIndicators: {
        rsi: Array(100).fill(50),
        macd: {
          line: Array(100).fill(0),
          signal: Array(100).fill(0),
          histogram: Array(100).fill(0)
        },
        bollingerBands: {
          upper: Array(100).fill(110),
          middle: Array(100).fill(100),
          lower: Array(100).fill(90)
        }
      }
    };

    // Get initial prediction
    const prediction1 = await model.predict(baseFeatures);

    // Make small changes to features
    const similarFeatures = {
      ...baseFeatures,
      prices: baseFeatures.prices.map(p => p + 0.1)
    };

    // Get prediction for similar features
    const prediction2 = await model.predict(similarFeatures);

    // Predictions should be similar for similar inputs
    expect(Math.abs(prediction1.predictedGain - prediction2.predictedGain)).toBeLessThan(0.1);
  }, 30000);

  it('should persist and load model state correctly', async () => {
    // Train model with sample data
    const features: ModelFeatures = {
      prices: Array(100).fill(100),
      volumes: Array(100).fill(1000),
      technicalIndicators: {
        rsi: Array(100).fill(50),
        macd: {
          line: Array(100).fill(0),
          signal: Array(100).fill(0),
          histogram: Array(100).fill(0)
        },
        bollingerBands: {
          upper: Array(100).fill(110),
          middle: Array(100).fill(100),
          lower: Array(100).fill(90)
        }
      }
    };

    const labels = Array(100).fill(1);
    await model.train([features], labels);

    // Save model state
    await model.saveAsPreTrained();

    // Create new model instance
    const newModel = new LSTMPredictionModel('1h');
    const prediction = await newModel.predict(features);

    // Verify prediction structure
    expect(prediction).toHaveProperty('predictedGain');
    expect(prediction).toHaveProperty('confidence');
    expect(prediction).toHaveProperty('timeframe', '1h');
  }, 30000);
});