import { LSTMPredictionModel } from './lstmModel';
import { SentimentAnalyzer } from './sentimentAnalyzer';
import { PredictionResult, ModelFeatures } from './types';
import { TechnicalIndicators } from '../utils/technicalIndicators';

interface ModelStatus {
  isInitialized: boolean;
  lastTrainingDate?: number;
  error?: string;
}

export class PredictionManager {
  private static instance: PredictionManager;
  private models: Map<string, LSTMPredictionModel> = new Map();
  private modelStatus: Map<string, ModelStatus> = new Map();
  private readonly timeframes = ['15m', '30m', '1h', '4h', '1d'];
  private sentimentAnalyzer: SentimentAnalyzer;
  private isInitializing = false;

  private constructor() {
    this.sentimentAnalyzer = SentimentAnalyzer.getInstance();
    this.initializeModels();
  }

  static getInstance(): PredictionManager {
    if (!PredictionManager.instance) {
      PredictionManager.instance = new PredictionManager();
    }
    return PredictionManager.instance;
  }

  private async initializeModels() {
    if (this.isInitializing) return;
    this.isInitializing = true;

    try {
      await Promise.all(
        this.timeframes.map(async timeframe => {
          const model = new LSTMPredictionModel(timeframe);
          this.models.set(timeframe, model);
          this.modelStatus.set(timeframe, { isInitialized: false });
          
          try {
            // Try to predict with dummy data to initialize the model
            const dummyFeatures = this.createDummyFeatures();
            await model.predict(dummyFeatures);
            this.modelStatus.set(timeframe, { 
              isInitialized: true,
              lastTrainingDate: Date.now()
            });
          } catch (error) {
            this.modelStatus.set(timeframe, { 
              isInitialized: false,
              error: 'Model not trained'
            });
          }
        })
      );
    } catch (error) {
      console.error('Error initializing models:', error);
    } finally {
      this.isInitializing = false;
    }
  }

  private createDummyFeatures(): ModelFeatures {
    const dummyArray = new Array(100).fill(0).map((_, i) => i);
    const macdResult = TechnicalIndicators.calculateMACD(dummyArray);
    
    return {
      prices: dummyArray,
      volumes: dummyArray,
      technicalIndicators: {
        rsi: TechnicalIndicators.calculateRSI(dummyArray),
        macd: {
          line: macdResult.macd,
          signal: macdResult.signal,
          histogram: macdResult.histogram
        },
        bollingerBands: TechnicalIndicators.calculateBollingerBands(dummyArray)
      }
    };
  }

  private prepareFeatures(prices: number[], volumes: number[]): ModelFeatures {
    const macdResult = TechnicalIndicators.calculateMACD(prices);
    return {
      prices,
      volumes,
      technicalIndicators: {
        rsi: TechnicalIndicators.calculateRSI(prices),
        macd: {
          line: macdResult.macd,
          signal: macdResult.signal,
          histogram: macdResult.histogram
        },
        bollingerBands: TechnicalIndicators.calculateBollingerBands(prices)
      }
    };
  }

  getModelStatus(timeframe: string): ModelStatus {
    return this.modelStatus.get(timeframe) || { isInitialized: false };
  }

  async getPrediction(
    symbol: string,
    timeframe: string,
    prices: number[],
    volumes: number[]
  ): Promise<PredictionResult> {
    const model = this.models.get(timeframe);
    const status = this.modelStatus.get(timeframe);

    if (!model || !status?.isInitialized) {
      throw new Error(
        status?.error || 
        `Model for timeframe ${timeframe} not initialized. Please wait for initialization to complete.`
      );
    }

    const features = this.prepareFeatures(prices, volumes);
    const basePrediction = await model.predict(features);
    const { adjustedPrediction, adjustedConfidence } = await this.sentimentAnalyzer
      .adjustPrediction(symbol, basePrediction.predictedGain, basePrediction.confidence);

    return {
      ...basePrediction,
      symbol,
      predictedGain: adjustedPrediction,
      confidence: adjustedConfidence
    };
  }

  async getPredictionsForAllTimeframes(
    symbol: string,
    priceData: { [timeframe: string]: { prices: number[]; volumes: number[] } }
  ): Promise<PredictionResult[]> {
    const predictions = await Promise.all(
      this.timeframes.map(async timeframe => {
        const data = priceData[timeframe];
        if (!data) {
          throw new Error(`No data available for timeframe: ${timeframe}`);
        }
        return this.getPrediction(symbol, timeframe, data.prices, data.volumes);
      })
    );

    return predictions.sort((a, b) => b.confidence - a.confidence);
  }

  async trainModels(trainingData: { [timeframe: string]: ModelFeatures[] }, labels: { [timeframe: string]: number[] }) {
    await Promise.all(
      this.timeframes.map(async timeframe => {
        try {
          const model = this.models.get(timeframe);
          if (model && trainingData[timeframe] && labels[timeframe]) {
            await model.train(trainingData[timeframe], labels[timeframe]);
            this.modelStatus.set(timeframe, { 
              isInitialized: true,
              lastTrainingDate: Date.now()
            });
          }
        } catch (error) {
          this.modelStatus.set(timeframe, { 
            isInitialized: false,
            error: error instanceof Error ? error.message : 'Training failed'
          });
          throw error;
        }
      })
    );
  }
}