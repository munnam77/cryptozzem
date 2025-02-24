import * as tf from '@tensorflow/tfjs';
import localforage from 'localforage';
import { PredictionModel, ModelFeatures, PredictionResult } from './types';
import { PreTrainedModelManager } from './preTrainedModel';

interface ModelMetadata {
  timeframe: string;
  version: string;
  lastUpdated: number;
  accuracy: number;
  config?: {
    quantized: boolean;
    pruned: boolean;
    optimizer: string;
  };
}

interface TrainingMetrics {
  loss: number;
  accuracy: number;
  validationLoss: number;
  validationAccuracy: number;
  epoch: number;
}

export class LSTMPredictionModel implements PredictionModel {
  private model: tf.LayersModel | null = null;
  private timeframe: string;
  private readonly sequenceLength = 60;
  private readonly featureCount = 7;
  private readonly modelStorageKey: string;
  private readonly metadataStorageKey: string;
  private readonly version = '1.0.0';
  private bestValidationLoss = Infinity;
  private patienceCount = 0;
  private readonly patience = 5;
  private readonly minDelta = 0.001;
  private readonly preTrainedManager: PreTrainedModelManager;

  constructor(timeframe: string) {
    this.timeframe = timeframe;
    this.modelStorageKey = `lstm-model-${timeframe}`;
    this.metadataStorageKey = `lstm-model-${timeframe}-metadata`;
    this.preTrainedManager = PreTrainedModelManager.getInstance();
  }

  private async saveModel(): Promise<void> {
    if (!this.model) return;

    try {
      const metadata: ModelMetadata = {
        timeframe: this.timeframe,
        version: this.version,
        lastUpdated: Date.now(),
        accuracy: await this.getModelAccuracy(),
        config: {
          quantized: true,
          pruned: true,
          optimizer: 'adam'
        }
      };

      // Quantize the model before saving
      const quantizedModel = await this.quantizeModel(this.model);
      
      // Save model architecture and weights
      await quantizedModel.save(`indexeddb://${this.modelStorageKey}`);
      
      // Save metadata
      await localforage.setItem(this.metadataStorageKey, metadata);
    } catch (error) {
      console.error('Error saving model:', error);
      throw error;
    }
  }

  private async loadModel(): Promise<boolean> {
    try {
      // First try to load existing trained model
      this.model = await tf.loadLayersModel(`indexeddb://${this.modelStorageKey}`);
      
      // Verify metadata
      const metadata = await localforage.getItem<ModelMetadata>(this.metadataStorageKey);
      if (metadata && metadata.version === this.version) {
        return true;
      }
      
      // If no valid trained model, try pre-trained weights
      const preTrainedWeights = await this.preTrainedManager.loadPreTrainedWeights(this.timeframe);
      if (preTrainedWeights) {
        // Create model architecture
        this.model = this.createModel();
        
        // Load pre-trained weights
        const tensors = preTrainedWeights.map(buffer => {
          const array = new Float32Array(buffer);
          return tf.tensor(array);
        });
        
        this.model.setWeights(tensors);
        
        // Save as trained model
        await this.saveModel();
        return true;
      }
      
      this.model = null;
      return false;
    } catch (error) {
      console.log('No saved or pre-trained model found, creating new one');
      return false;
    }
  }

  private async quantizeModel(model: tf.LayersModel): Promise<tf.LayersModel> {
    // Convert weights to 8-bit integers for storage efficiency
    const weights = model.getWeights();
    const quantizedWeights = weights.map(w => {
      return tf.tidy(() => {
        const max = w.max();
        const min = w.min();
        const range = max.sub(min);
        return w.sub(min).div(range).mul(tf.scalar(255)).round().div(tf.scalar(255)).mul(range).add(min);
      });
    });
    
    model.setWeights(quantizedWeights);
    return model;
  }

  private async getModelAccuracy(): Promise<number> {
    const metrics = await localforage.getItem<TrainingMetrics[]>(`${this.modelStorageKey}-metrics`);
    if (!metrics || metrics.length === 0) return 0.8;
    return 1 - metrics[metrics.length - 1].validationLoss;
  }

  private createModel(): tf.LayersModel {
    const model = tf.sequential();
    
    // Input LSTM layer with L2 regularization
    model.add(tf.layers.lstm({
      units: 50,
      returnSequences: true,
      inputShape: [this.sequenceLength, this.featureCount],
      kernelRegularizer: tf.regularizers.l2({ l2: 0.01 }),
      recurrentRegularizer: tf.regularizers.l2({ l2: 0.01 })
    }));
    
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dropout({ rate: 0.2 }));
    
    // Second LSTM layer
    model.add(tf.layers.lstm({
      units: 30,
      returnSequences: false,
      kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
    }));
    
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dropout({ rate: 0.2 }));
    
    // Output layer with L2 regularization
    model.add(tf.layers.dense({ 
      units: 1,
      kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
    }));

    const optimizer = tf.train.adam(0.001, 0.9, 0.999, 1e-7);
    
    model.compile({
      optimizer,
      loss: 'meanSquaredError',
      metrics: ['mae', 'accuracy']
    });

    return model;
  }

  private preprocessFeatures(features: ModelFeatures): tf.Tensor3D {
    const sequences: number[][][] = [];
    
    for (let i = 0; i < features.prices.length - this.sequenceLength; i++) {
      const sequence: number[][] = [];
      for (let j = i; j < i + this.sequenceLength; j++) {
        sequence.push([
          features.prices[j],
          features.volumes[j],
          features.technicalIndicators.rsi[j],
          features.technicalIndicators.macd.line[j],
          features.technicalIndicators.macd.signal[j],
          features.technicalIndicators.macd.histogram[j],
          features.technicalIndicators.bollingerBands.middle[j]
        ]);
      }
      sequences.push(sequence);
    }

    return tf.tensor3d(sequences);
  }

  private async ensureModelExists(): Promise<tf.LayersModel> {
    if (!this.model) {
      const modelLoaded = await this.loadModel();
      if (!modelLoaded) {
        this.model = this.createModel();
      }
    }
    return this.model!;
  }

  async predict(features: ModelFeatures): Promise<PredictionResult> {
    const model = await this.ensureModelExists();
    
    // Use tf.tidy to automatically clean up intermediate tensors
    const prediction = await tf.tidy(() => {
      const input = this.preprocessFeatures(features);
      return model.predict(input) as tf.Tensor;
    });
    
    const predictedGain = (await prediction.data())[0];
    prediction.dispose(); // Clean up the prediction tensor
    
    // Calculate confidence based on prediction history
    const metrics = await localforage.getItem<TrainingMetrics[]>(`${this.modelStorageKey}-metrics`);
    const baseConfidence = metrics ? 1 - metrics[metrics.length - 1].validationLoss : 0.8;
    const predictionConfidence = Math.min(Math.max(Math.abs(predictedGain) / 5, 0), 1);
    const confidence = (baseConfidence + predictionConfidence) / 2;

    return {
      symbol: '',
      predictedGain,
      confidence,
      timeframe: this.timeframe,
      timestamp: Date.now()
    };
  }

  async train(historicalData: ModelFeatures[], labels: number[]): Promise<void> {
    const model = await this.ensureModelExists();
    
    // Use tf.tidy for training data preparation
    const { features, targetTensor } = tf.tidy(() => ({
      features: this.preprocessFeatures(historicalData[0]),
      targetTensor: tf.tensor2d(labels, [labels.length, 1])
    }));

    const metrics: TrainingMetrics[] = [];
    
    await model.fit(features, targetTensor, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      shuffle: true,
      callbacks: {
        onEpochEnd: async (epoch, logs) => {
          const metric: TrainingMetrics = {
            loss: logs?.loss || 0,
            accuracy: logs?.accuracy || 0,
            validationLoss: logs?.val_loss || 0,
            validationAccuracy: logs?.val_accuracy || 0,
            epoch
          };
          metrics.push(metric);
          
          // Early stopping check
          if (logs?.val_loss && logs.val_loss < this.bestValidationLoss - this.minDelta) {
            this.bestValidationLoss = logs.val_loss;
            this.patienceCount = 0;
            // Save best model weights
            await this.saveModel();
            
            // If accuracy is high enough, save as pre-trained
            if (metric.validationAccuracy > 0.85) {
              await this.saveAsPreTrained();
            }
          } else {
            this.patienceCount++;
            if (this.patienceCount >= this.patience) {
              model.stopTraining = true;
            }
          }
          
          console.log(`Epoch ${epoch}: loss = ${logs?.loss.toFixed(4)}, val_loss = ${logs?.val_loss.toFixed(4)}`);
        }
      }
    });

    // Save training metrics
    await localforage.setItem(`${this.modelStorageKey}-metrics`, metrics);
    
    // Clean up tensors
    features.dispose();
    targetTensor.dispose();
  }

  async saveAsPreTrained(): Promise<void> {
    if (!this.model) throw new Error('No model to save');

    const weights = this.model.getWeights().map(tensor => {
      const data = tensor.dataSync();
      return data.buffer;
    });

    const accuracy = await this.getModelAccuracy();
    const metrics = await localforage.getItem<TrainingMetrics[]>(`${this.modelStorageKey}-metrics`);
    
    await this.preTrainedManager.savePreTrainedWeights(this.timeframe, weights, {
      meanAccuracy: accuracy,
      trainingSamples: metrics?.length || 0,
      lastUpdated: Date.now(),
      architecture: 'lstm-50-30-1'
    });
  }

  async evaluate(testData: ModelFeatures[], testLabels: number[]): Promise<number> {
    if (!this.model) {
      throw new Error('Model not trained');
    }

    return tf.tidy(() => {
      const features = this.preprocessFeatures(testData[0]);
      const targetTensor = tf.tensor2d(testLabels, [testLabels.length, 1]);
      const result = this.model!.evaluate(features, targetTensor) as tf.Tensor[];
      return result[0].dataSync()[0];
    });
  }
}