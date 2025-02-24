import { PredictionManager } from '../predictionManager';
import { LSTMPredictionModel } from '../lstmModel';
import { ModelFeatures } from '../types';

jest.mock('../lstmModel');

describe('PredictionManager', () => {
  let manager: PredictionManager;
  const mockPredict = jest.fn();
  const mockTrain = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (LSTMPredictionModel as jest.Mock).mockImplementation(() => ({
      predict: mockPredict,
      train: mockTrain,
      evaluate: jest.fn().mockResolvedValue(0.8)
    }));
    manager = new PredictionManager();
  });

  describe('Model Management', () => {
    it('should initialize models for all timeframes', () => {
      expect(LSTMPredictionModel).toHaveBeenCalledWith('1h');
      expect(LSTMPredictionModel).toHaveBeenCalledWith('4h');
      expect(LSTMPredictionModel).toHaveBeenCalledWith('1d');
    });

    it('should handle prediction requests for different timeframes', async () => {
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

      mockPredict.mockResolvedValue({
        predictedGain: 0.05,
        confidence: 0.8,
        timeframe: '1h'
      });

      const prediction = await manager.getPrediction('BTCUSDT', '1h');
      
      expect(mockPredict).toHaveBeenCalled();
      expect(prediction).toHaveProperty('predictedGain', 0.05);
      expect(prediction).toHaveProperty('confidence', 0.8);
      expect(prediction).toHaveProperty('timeframe', '1h');
    });
  });

  describe('Training Pipeline', () => {
    it('should batch train models with historical data', async () => {
      const historicalData = Array(100).fill(null).map(() => ({
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
      }));

      const labels = Array(100).fill(1);

      await manager.batchTrain(historicalData, labels);
      expect(mockTrain).toHaveBeenCalledTimes(3); // Once for each timeframe
    });

    it('should validate model accuracy after training', async () => {
      const mockEvaluate = jest.fn().mockResolvedValue(0.8);
      (LSTMPredictionModel as jest.Mock).mockImplementation(() => ({
        predict: mockPredict,
        train: mockTrain,
        evaluate: mockEvaluate
      }));

      const testData = Array(10).fill(null).map(() => ({
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
      }));

      const testLabels = Array(10).fill(1);

      const accuracy = await manager.validateAccuracy(testData, testLabels);
      expect(accuracy).toBeGreaterThan(0);
      expect(mockEvaluate).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle prediction errors gracefully', async () => {
      mockPredict.mockRejectedValue(new Error('Prediction failed'));

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

      await expect(manager.getPrediction('BTCUSDT', '1h'))
        .rejects
        .toThrow('Prediction failed');
    });

    it('should handle training errors gracefully', async () => {
      mockTrain.mockRejectedValue(new Error('Training failed'));

      const testData = [{
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

      await expect(manager.batchTrain(testData, [1]))
        .rejects
        .toThrow('Training failed');
    });
  });
});