import * as tf from '@tensorflow/tfjs';
import localforage from 'localforage';

interface PreTrainedWeights {
  timeframe: string;
  version: string;
  weights: ArrayBuffer[];
  metadata: {
    meanAccuracy: number;
    trainingSamples: number;
    lastUpdated: number;
    architecture: string;
  };
}

interface LayerConfig {
  type: string;
  units?: number;
  returnSequences?: boolean;
  rate?: number;
}

export class PreTrainedModelManager {
  private static instance: PreTrainedModelManager;
  private readonly storageKey = 'pretrained-weights';
  private readonly supportedTimeframes = ['15m', '30m', '1h', '4h', '1d'];
  private readonly modelVersion = '1.0.0';
  private readonly architectureConfig: LayerConfig[] = [
    { type: 'lstm', units: 50, returnSequences: true },
    { type: 'dropout', rate: 0.2 },
    { type: 'lstm', units: 30, returnSequences: false },
    { type: 'dropout', rate: 0.2 },
    { type: 'dense', units: 1 }
  ];

  private constructor() {}

  static getInstance(): PreTrainedModelManager {
    if (!PreTrainedModelManager.instance) {
      PreTrainedModelManager.instance = new PreTrainedModelManager();
    }
    return PreTrainedModelManager.instance;
  }

  async loadPreTrainedWeights(timeframe: string): Promise<ArrayBuffer[] | null> {
    try {
      const weights = await localforage.getItem<PreTrainedWeights>(`${this.storageKey}-${timeframe}`);
      if (!weights || weights.version !== this.modelVersion) {
        return null;
      }
      
      // Validate weights before returning
      const isValid = await this.validateWeights(weights);
      if (!isValid) {
        console.warn(`Invalid weights found for ${timeframe}, clearing...`);
        await this.clearWeights(timeframe);
        return null;
      }
      
      return weights.weights;
    } catch (error) {
      console.warn(`Failed to load pre-trained weights for ${timeframe}:`, error);
      return null;
    }
  }

  async savePreTrainedWeights(
    timeframe: string,
    weights: ArrayBuffer[],
    metadata: PreTrainedWeights['metadata']
  ): Promise<void> {
    if (!this.supportedTimeframes.includes(timeframe)) {
      throw new Error(`Unsupported timeframe: ${timeframe}`);
    }

    // Verify weights length matches architecture
    const expectedLength = this.architectureConfig.reduce((count, layer) => {
      if (layer.type === 'lstm') return count + 3; // LSTM has 3 weight tensors
      if (layer.type === 'dense') return count + 2; // Dense has 2 weight tensors
      return count;
    }, 0);

    if (weights.length !== expectedLength) {
      throw new Error(`Invalid weights length. Expected ${expectedLength}, got ${weights.length}`);
    }

    const preTrainedData: PreTrainedWeights = {
      timeframe,
      version: this.modelVersion,
      weights,
      metadata: {
        ...metadata,
        architecture: this.getArchitectureString()
      }
    };

    await localforage.setItem(`${this.storageKey}-${timeframe}`, preTrainedData);
  }

  async getWeightsMetadata(timeframe: string): Promise<PreTrainedWeights['metadata'] | null> {
    try {
      const weights = await localforage.getItem<PreTrainedWeights>(`${this.storageKey}-${timeframe}`);
      return weights?.metadata || null;
    } catch {
      return null;
    }
  }

  async exportWeights(timeframe: string): Promise<Blob | null> {
    const weights = await localforage.getItem<PreTrainedWeights>(`${this.storageKey}-${timeframe}`);
    if (!weights) return null;

    return new Blob([JSON.stringify(weights)], { type: 'application/json' });
  }

  async importWeights(timeframe: string, weightsBlob: Blob): Promise<boolean> {
    try {
      const weightsJson = await weightsBlob.text();
      const weights: PreTrainedWeights = JSON.parse(weightsJson);
      
      if (weights.version !== this.modelVersion || weights.timeframe !== timeframe) {
        throw new Error('Incompatible weights version or timeframe');
      }

      if (!await this.validateWeights(weights)) {
        throw new Error('Invalid weights structure');
      }

      await localforage.setItem(`${this.storageKey}-${timeframe}`, weights);
      return true;
    } catch (error) {
      console.error('Failed to import weights:', error);
      return false;
    }
  }

  async validateWeights(weights: PreTrainedWeights): Promise<boolean> {
    if (!weights.metadata.architecture) return false;
    if (weights.metadata.architecture !== this.getArchitectureString()) return false;
    
    try {
      const model = tf.sequential();
      let inputShape = [100, 7]; // Fixed input shape for our features

      // Build model architecture
      for (const config of this.architectureConfig) {
        switch (config.type) {
          case 'lstm':
            model.add(tf.layers.lstm({
              units: config.units!,
              returnSequences: config.returnSequences,
              inputShape: inputShape
            }));
            if (!config.returnSequences) {
              inputShape = [config.units!];
            }
            break;
          case 'dropout':
            model.add(tf.layers.dropout({ rate: config.rate! }));
            break;
          case 'dense':
            model.add(tf.layers.dense({ units: config.units! }));
            break;
        }
      }

      // Try to set weights
      const tensors = weights.weights.map(buffer => {
        const array = new Float32Array(buffer);
        return tf.tensor(array);
      });

      model.setWeights(tensors);
      
      // Clean up tensors
      tensors.forEach(tensor => tensor.dispose());
      model.dispose();
      
      return true;
    } catch (error) {
      console.error('Weight validation failed:', error);
      return false;
    }
  }

  private getArchitectureString(): string {
    return this.architectureConfig
      .map(config => {
        if (config.type === 'lstm') return `lstm-${config.units}`;
        if (config.type === 'dense') return `dense-${config.units}`;
        if (config.type === 'dropout') return `dropout-${config.rate}`;
        return config.type;
      })
      .join('-');
  }

  async clearWeights(timeframe?: string): Promise<void> {
    if (timeframe) {
      await localforage.removeItem(`${this.storageKey}-${timeframe}`);
    } else {
      for (const tf of this.supportedTimeframes) {
        await localforage.removeItem(`${this.storageKey}-${tf}`);
      }
    }
  }
}