import WebSocket from 'ws';
import { Server } from 'http';

interface ProviderState {
  healthy: boolean;
  latency: number;
}

export class MockServer {
  private wss: WebSocket.Server;
  private connections: WebSocket[] = [];
  private providerStates: Map<string, ProviderState>;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor(server: Server) {
    this.wss = new WebSocket.Server({ server });
    this.providerStates = new Map([
      ['Twitter', { healthy: true, latency: 100 }],
      ['Reddit', { healthy: true, latency: 150 }],
      ['News', { healthy: true, latency: 200 }]
    ]);

    this.setupWebSocket();
    this.startDataSimulation();
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws) => {
      this.connections.push(ws);
      
      ws.on('message', this.handleMessage.bind(this));
      ws.on('close', () => {
        this.connections = this.connections.filter(conn => conn !== ws);
      });

      // Send initial state
      this.broadcastMarketData();
      this.broadcastSentimentData();
    });
  }

  private handleMessage(message: WebSocket.Data) {
    const data = JSON.parse(message.toString());
    if (data.type === 'subscribe') {
      // Handle subscription requests
    }
  }

  private startDataSimulation() {
    this.updateInterval = setInterval(() => {
      this.broadcastMarketData();
      this.broadcastSentimentData();
    }, 5000);
  }

  private broadcastMarketData() {
    const price = 40000 + Math.random() * 2000;
    const volume = Math.random() * 100;
    
    this.broadcast(JSON.stringify({
      e: 'trade',
      s: 'BTCUSDT',
      p: price.toFixed(2),
      q: volume.toFixed(8),
      T: Date.now()
    }));
  }

  private broadcastSentimentData() {
    for (const [provider, state] of this.providerStates.entries()) {
      if (state.healthy) {
        setTimeout(() => {
          this.broadcast(JSON.stringify({
            type: 'sentiment',
            data: {
              provider,
              score: (Math.random() * 2 - 1),
              confidence: 0.5 + Math.random() * 0.5
            }
          }));
        }, state.latency);
      }
    }
  }

  public broadcast(data: string) {
    this.connections.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  public failProvider(provider: string) {
    const state = this.providerStates.get(provider);
    if (state) {
      state.healthy = false;
      this.providerStates.set(provider, state);
    }
  }

  public restoreProvider(provider: string) {
    const state = this.providerStates.get(provider);
    if (state) {
      state.healthy = true;
      this.providerStates.set(provider, state);
    }
  }

  public setProviderLatency(provider: string, latency: number) {
    const state = this.providerStates.get(provider);
    if (state) {
      state.latency = latency;
      this.providerStates.set(provider, state);
    }
  }

  public disconnect() {
    this.connections.forEach(client => client.close());
    this.connections = [];
  }

  public connect() {
    // Connection will be re-established by clients
  }

  public cleanup() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.wss.close();
  }
}