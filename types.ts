
// Added FOREX to MarketMode to resolve missing property error in trading analysis components
export enum MarketMode {
  OB_NEXUS = 'OB_NEXUS',
  OB_CORE = 'OB_CORE',
  BINARY = 'BINARY',
  FOREX = 'FOREX'
}

export enum NeuralMode {
  CONSERVATIVE = 'CONSERVADOR',
  BALANCED = 'EQUILIBRADO',
  AGGRESSIVE = 'AGRESSIVO',
  HEURISTIC_SAFETY = 'HEURÍSTICO_SEGURANÇA'
}

export enum AIPersonality {
  JARVIS = 'JARVIS',
  ULTRON = 'ULTRON'
}

export type GeminiVoice = 'Kore' | 'Charon' | 'Zephyr' | 'Puck' | 'Fenrir';

export interface VoiceConfig {
  [AIPersonality.JARVIS]: GeminiVoice;
  [AIPersonality.ULTRON]: GeminiVoice;
}

export enum SignalType {
  BUY = 'COMPRAR',
  SELL = 'VENDER',
  WAIT = 'AGUARDAR',
  ANALYZING = 'ANALISANDO'
}

export enum TradeResult {
  WIN = 'WIN',
  LOSS = 'LOSS',
  SKIPPED = 'SKIPPED',
  NO_TRADE = 'NO_TRADE'
}

export interface LearningStats {
  winrate: number;
  total: number;
  wins: number;
  losses: number;
  recentTendency: 'IMPROVING' | 'DECLINING' | 'STABLE';
}

export interface AnalysisFeatures {
  greenDensity: number;
  redDensity: number;
  volatility: number;
  isConsolidated: boolean;
  spikeDetected: boolean;
  trend: 'bullish' | 'bearish' | 'neutral';
  buyPressure: number;
  sellPressure: number;
  supportZones: number[];
  resistanceZones: number[];
  manipulationRisk: number;
  slope: number;
  acceleration: number; 
  rsi: number; 
  stdDev: number; 
  commandCandleDetected: boolean;
  priceLogicScore: number;
  rejectionDetected: boolean;
  flowIntegrity: number;
  // NOVOS CAMPOS DE PADRÕES
  detectedPatterns: string[];
  chartFigure: 'TRIANGLE' | 'HEAD_SHOULDERS' | 'DOUBLE_TOP_BOTTOM' | 'NONE';
  candleMorphology: 'HAMMER' | 'SHOOTING_STAR' | 'DOJI' | 'NORMAL';
}

export interface MarketSignal {
  id: string;
  type: SignalType;
  confidence: number;
  integrityScore: number;
  manipulationRisk: number;
  timestamp: number;
  features: AnalysisFeatures;
  triggers: string[];
  expiry?: number;
}

export interface AnalysisLog {
  id: string;
  type: 'INFO' | 'SIGNAL' | 'SYSTEM';
  personality: AIPersonality;
  message: string;
  timestamp: number;
  signal?: MarketSignal;
}
