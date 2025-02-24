import * as tf from '@tensorflow/tfjs';
import { LSTMPredictionModel } from '../lstmModel';
import localforage from 'localforage';

jest.mock('@tensorflow/tfjs');
jest.mock('localforage');

describe('LSTMPredictionModel', () => {
  let model: LSTMPredictionModel;
  const mockTf = tf as jest.Mocked<typeof tf>;
  const mockLocalForage = localforage as jest.Mocked<typeof localforage>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock TensorFlow model methods
    const mockLayersModel = {
      predict: jest.fn().mockReturnValue({
        data: jest.fn().mockResolvedValue([0.05]),
        dispose: jest.fn()
      }),
      fit: jest.fn().mockResolvedValue({ history: { loss: [0.1] } }),
      save: jest.fn().mockResolvedValue(undefined)
    };

    mockTf.sequential.mockReturnValue(mockLayersModel);
    mockTf.layers.lstm.mockReturnValue({});
    mockTf.layers.dense.mockReturnValue({});
    mockTf.layers.dropout.mockReturnValue({});
    
    mockTf.loadLayersModel.mockRejectedValue(new Error('No saved model'));
    mockTf.tensor2d.mockReturnValue({});
    mockTf.tensor3d.mockReturnValue({});

    // Mock localforage
    mockLocalForage.setItem.mockResolvedValue({});
    mockLocalForage.getItem.mockResolvedValue(null);
    
    model = new LSTMPredictionModel('1h');
  });

  test('creates new model when no saved model exists', async () => {
    const features = {
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

    const prediction = await model.predict(features);
    
    expect(mockTf.sequential).toHaveBeenCalled();
    expect(prediction).toHaveProperty('predictedGain');
    expect(prediction).toHaveProperty('confidence');
    expect(prediction.timeframe).toBe('1h');
  });

  test('loads existing model if available', async () => {
    const savedModel = {
      predict: jest.fn().mockReturnValue({
        data: jest.fn().mockResolvedValue([0.05]),
        dispose: jest.fn()
      })
    };

    mockTf.loadLayersModel.mockResolvedValueOnce(savedModel);
    mockLocalForage.getItem.mockResolvedValueOnce({
      timeframe: '1h',
      version: '1.0.0',
      lastUpdated: Date.now(),
      accuracy: 0.8
    });

    const features = {
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

    const prediction = await model.predict(features);
    
    expect(mockTf.loadLayersModel).toHaveBeenCalled();
    expect(mockTf.sequential).not.toHaveBeenCalled();
    expect(prediction).toBeTruthy();
  });

  test('saves model after training', async () => {
    const trainingData = [{
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
    }];
    
    const labels = Array(100).fill(0.01);

    await model.train(trainingData, labels);
    
    expect(mockTf.sequential().fit).toHaveBeenCalled();
    expect(mockTf.sequential().save).toHaveBeenCalled();
    expect(mockLocalForage.setItem).toHaveBeenCalled();
  });

  test('prediction confidence is between 0 and 1', async () => {
    const features = {
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

    const prediction = await model.predict(features);
    
    expect(prediction.confidence).toBeGreaterThanOrEqual(0);
    expect(prediction.confidence).toBeLessThanOrEqual(1);
  });
});