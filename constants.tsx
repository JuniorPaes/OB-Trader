
import { NeuralMode } from './types';

export const COLORS = {
  bg: '#050506',
  card: '#0c0c0e',
  border: 'rgba(255, 255, 255, 0.08)',
  accent: '#06b6d4', 
  accentDark: '#0891b2',
  bull: '#10b981', 
  bear: '#ef4444', 
  warning: '#f59e0b', 
  aggressive: '#a855f7', 
};

/**
 * THRESHOLDS - REGRAS DE FILTRAGEM
 * minProb: Probabilidade mínima retornada pela IA para aceitar o sinal.
 * maxRisk: Risco máximo de manipulação aceitável.
 * minIntegrity: Integridade de fluxo mínima (matemática).
 */
export const THRESHOLDS = {
  [NeuralMode.CONSERVATIVE]: { minProb: 60, maxRisk: 85, minIntegrity: 25 },
  [NeuralMode.BALANCED]: { minProb: 45, maxRisk: 92, minIntegrity: 10 },
  [NeuralMode.AGGRESSIVE]: { minProb: 25, maxRisk: 99, minIntegrity: 0 },
  [NeuralMode.HEURISTIC_SAFETY]: { minProb: 80, maxRisk: 50, minIntegrity: 60 },
  BINARY_MAX_RISK: 98,
  BINARY_MIN_INTEGRITY: 5,
};

export const NAVIGATION = [
  { name: 'Terminal OB', path: '/', icon: '💎' },
  { name: 'Cloud Analytics', path: '/analytics', icon: '📊' },
];
