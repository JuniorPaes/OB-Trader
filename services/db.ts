
import { MarketSignal, TradeResult, AIPersonality, LearningStats } from '../types';

const DB_NAME = 'StarkNeuralCloud';
const DB_VERSION = 6;

export interface EnhancedSignal extends MarketSignal {
  personality: AIPersonality;
  aiReasoning: string;
  result?: TradeResult;
  visualScore: number;
}

export class LocalDatabase {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Store para Sinais com Índices
        if (!db.objectStoreNames.contains('signals')) {
          const signalStore = db.createObjectStore('signals', { keyPath: 'id' });
          signalStore.createIndex('timestamp', 'timestamp', { unique: false });
          signalStore.createIndex('result', 'result', { unique: false });
        }
        
        // Store para Logs de Sistema
        if (!db.objectStoreNames.contains('system_logs')) {
          db.createObjectStore('system_logs', { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.logSystemEvent('DATABASE_INITIALIZED', 'Conexão com Banco Neural estabelecida.');
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  async logSystemEvent(event: string, detail: string) {
    if (!this.db) await this.init();
    const tx = this.db!.transaction(['system_logs'], 'readwrite');
    tx.objectStore('system_logs').add({
      event,
      detail,
      timestamp: Date.now()
    });
  }

  async saveEnhancedSignal(signal: EnhancedSignal): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction(['signals'], 'readwrite');
    tx.objectStore('signals').put(signal);
    await this.logSystemEvent('SIGNAL_PERSISTED', `Sinal ${signal.id} salvo via ${signal.personality}`);
  }

  async updateTradeResult(id: string, result: TradeResult): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction(['signals'], 'readwrite');
    const store = tx.objectStore('signals');
    const request = store.get(id);

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const data = request.result;
        if (data) {
          data.result = result;
          store.put(data);
          this.logSystemEvent('TRADE_RESOLVED', `Resultado ${result} para ID ${id}`);
        }
        resolve();
      };
    });
  }

  // Fix: Added recentTendency property to return a LearningStats compatible object to avoid type errors in apiService
  async getHistoricalWinRate(): Promise<LearningStats> {
    const signals = await this.getAllSignals();
    const completed = signals.filter(s => s.result === TradeResult.WIN || s.result === TradeResult.LOSS);
    const wins = completed.filter(s => s.result === TradeResult.WIN).length;
    const losses = completed.filter(s => s.result === TradeResult.LOSS).length;
    
    return {
      total: completed.length,
      wins,
      losses,
      winrate: completed.length > 0 ? (wins / completed.length) * 100 : 0,
      recentTendency: 'STABLE'
    };
  }

  async getAllSignals(): Promise<EnhancedSignal[]> {
    if (!this.db) await this.init();
    return new Promise((resolve) => {
      const tx = this.db!.transaction(['signals'], 'readonly');
      const req = tx.objectStore('signals').getAll();
      req.onsuccess = () => resolve(req.result);
    });
  }

  async clearDatabase(): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction(['signals', 'system_logs'], 'readwrite');
    tx.objectStore('signals').clear();
    tx.objectStore('system_logs').clear();
    await this.logSystemEvent('DB_WIPED', 'Banco de dados reiniciado pelo usuário.');
  }
}

export const localDB = new LocalDatabase();
