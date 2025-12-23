
import { AnalysisFeatures } from '../types';

export class HeuristicAnalyzer {
  private readonly SAMPLE_SIZE = 2; 
  private priceHistory: number[] = [];
  private readonly MAX_HISTORY = 600; 
  private densityMap: number[] = []; 
  private lastHeight = 0;
  private smoothedPriceY = 0;
  private readonly PRICE_SMOOTHING = 0.15;
  private slopeHistory: number[] = [];
  private peakHistory: { y: number, time: number, strength: number }[] = [];

  public analyzeFrame(canvas: HTMLCanvasElement): AnalysisFeatures {
    const ctx = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D | null;
    if (!ctx) return this.getDefaultFeatures();

    const { width, height } = canvas;
    const sx = Math.floor(width * 0.05); 
    const sy = Math.floor(height * 0.10);
    const sw = Math.floor(width * 0.90);
    const sh = Math.floor(height * 0.80);

    if (this.lastHeight !== sh) {
      this.densityMap = new Array(sh).fill(0);
      this.lastHeight = sh;
    }

    const imageData = ctx.getImageData(sx, sy, sw, sh);
    const data = imageData.data;

    let greenPixels = 0;
    let redPixels = 0;
    let totalScanned = 0;
    const currentFrameDensity = new Array(sh).fill(0);

    // Scan de Pixels com detecção de cor otimizada
    for (let i = 0; i < data.length; i += 4 * this.SAMPLE_SIZE) {
      const r = data[i];
      const g = data[i+1];
      const b = data[i+2];

      const py = Math.floor((i / 4) / sw);
      
      const isGreen = (g > r * 1.1 && g > b * 1.1) || (g > 150 && r < 100);
      const isRed = (r > g * 1.1 && r > b * 1.1) || (r > 150 && g < 100);

      if (isGreen || isRed) {
        if (isGreen) greenPixels++;
        else redPixels++;
        if (py < sh) currentFrameDensity[py]++;
      }
      totalScanned++;
    }

    const totalColor = greenPixels + redPixels;
    if (totalColor < 50) return this.getDefaultFeatures();

    // Atualização de Memória de Densidade para Zonas de S/R
    for (let y = 0; y < sh; y++) {
      this.densityMap[y] = (this.densityMap[y] * 0.98) + (currentFrameDensity[y] * 0.02);
    }

    // Cálculo de Preço por Centro de Massa
    let weightedY = 0, weightSum = 0;
    for (let y = 0; y < sh; y++) {
      if (currentFrameDensity[y] > 2) {
        weightedY += y * currentFrameDensity[y];
        weightSum += currentFrameDensity[y];
      }
    }
    
    const rawPriceY = weightSum > 0 ? weightedY / weightSum : sh / 2;
    this.smoothedPriceY = (rawPriceY * this.PRICE_SMOOTHING) + (this.smoothedPriceY * (1 - this.PRICE_SMOOTHING));

    this.priceHistory.push(this.smoothedPriceY);
    if (this.priceHistory.length > this.MAX_HISTORY) this.priceHistory.shift();

    // MÉTIRCAS DE VOLATILIDADE REVISADAS
    const volatilityMetrics = this.calculateAdvancedVolatility(this.priceHistory, totalColor, totalScanned, sh);

    // Tendência e RSI
    const slope = this.calculateStableSlope(this.priceHistory, 120);
    this.slopeHistory.push(slope);
    if (this.slopeHistory.length > 100) this.slopeHistory.shift();
    
    const acceleration = this.calculateAcceleration(this.slopeHistory);
    const rsi = this.calculateRSI(this.priceHistory);
    const stdDev = this.calculateStandardDeviation(this.priceHistory);
    
    let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (slope < -0.0008) trend = 'bullish'; 
    else if (slope > 0.0008) trend = 'bearish';

    const currentPricePct = (this.smoothedPriceY / sh) * 100;
    const zones = this.findSRZones(sh, currentPricePct);

    // Análise de Candle de Força e Morfologia
    const forceAnalysis = this.detectForceCandle(currentFrameDensity, greenPixels, redPixels, totalColor);
    const morphology = this.detectCandleMorphology(currentFrameDensity, sh);
    const figure = this.detectChartFigure(zones.support, zones.resistance, slope);

    const patterns = [];
    if (morphology !== 'NORMAL') patterns.push(morphology);
    if (figure !== 'NONE') patterns.push(figure);
    if (forceAnalysis.isForceCandle) patterns.push('MARUBOZU_POWER');

    return {
      greenDensity: (greenPixels / totalScanned) * 100,
      redDensity: (redPixels / totalScanned) * 100,
      volatility: volatilityMetrics.score,
      isConsolidated: Math.abs(slope) < 0.0003 && stdDev < 5,
      spikeDetected: volatilityMetrics.isSpike || Math.abs(acceleration) > 0.015,
      trend,
      buyPressure: (greenPixels / totalColor) * 100,
      sellPressure: (redPixels / totalColor) * 100,
      supportZones: zones.support,
      resistanceZones: zones.resistance,
      manipulationRisk: (stdDev > 25 || volatilityMetrics.score > 85) ? 80 : 12,
      slope,
      acceleration,
      rsi,
      stdDev,
      commandCandleDetected: forceAnalysis.isForceCandle,
      priceLogicScore: Math.min(100, (forceAnalysis.densityScore * 100)),
      rejectionDetected: currentFrameDensity[Math.floor(this.smoothedPriceY)] < 0.2,
      flowIntegrity: Math.max(0, 100 - (volatilityMetrics.noise * 2)),
      detectedPatterns: patterns,
      chartFigure: figure,
      candleMorphology: morphology
    };
  }

  /**
   * Cálculo Avançado de Volatilidade
   * Amplitude + Velocidade x Penalização de Liquidez
   */
  private calculateAdvancedVolatility(history: number[], colorPixels: number, scannedPixels: number, sh: number) {
    if (history.length < 30) return { score: 0, noise: 0, isSpike: false };

    // 1. AMPLITUDE (Desvio Padrão Curto)
    const recent = history.slice(-30);
    const mean = recent.reduce((a, b) => a + b) / 30;
    const amplitude = Math.sqrt(recent.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / 30);

    // 2. VELOCIDADE (Momentum Absoluto)
    const velocity = Math.abs(history[history.length - 1] - history[history.length - 10]) / 10;

    // 3. PENALIZAÇÃO DE LIQUIDEZ
    // Taxa de preenchimento de pixels coloridos em relação ao total escaneado
    const pixelDensity = colorPixels / scannedPixels;
    // Threshold de liquidez: Se menos de 0.5% da tela tem pixels de vela, penaliza
    const liquidityCoefficient = Math.min(1, pixelDensity / 0.005);

    // 4. CÁLCULO FINAL (Pesos: 60% Amplitude, 40% Velocidade)
    // Normalizamos Amplitude para a escala de 0-100 (Assumindo que 40px é vol alta)
    const normAmplitude = Math.min(100, (amplitude / (sh * 0.05)) * 100);
    const normVelocity = Math.min(100, velocity * 800);

    const rawScore = (normAmplitude * 0.6) + (normVelocity * 0.4);
    const finalScore = rawScore * liquidityCoefficient;

    return {
      score: finalScore,
      noise: amplitude,
      isSpike: normVelocity > 75
    };
  }

  private detectForceCandle(density: number[], green: number, red: number, total: number) {
    const activeIndices = density.map((v, i) => ({ v, i })).filter(d => d.v > 2);
    if (activeIndices.length < 15) return { isForceCandle: false, densityScore: 0 };
    const top = activeIndices[0].i;
    const bottom = activeIndices[activeIndices.length - 1].i;
    const totalHeight = bottom - top;
    const maxDensity = Math.max(...density);
    const bodyIndices = activeIndices.filter(d => d.v > maxDensity * 0.65);
    if (bodyIndices.length < 10) return { isForceCandle: false, densityScore: 0 };
    const bodyHeight = bodyIndices[bodyIndices.length - 1].i - bodyIndices[0].i;
    const bodyToWickRatio = bodyHeight / totalHeight;
    const colorDominance = Math.max(green, red) / total;
    const isForceCandle = bodyToWickRatio > 0.85 && colorDominance > 0.82 && total > 450;
    return { isForceCandle, densityScore: (bodyToWickRatio * colorDominance) };
  }

  private calculateStableSlope(history: number[], period: number): number {
    const n = Math.min(history.length, period); 
    if (n < 20) return 0;
    const subset = history.slice(-n);
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += i; sumY += subset[i];
      sumXY += i * subset[i]; sumXX += i * i;
    }
    const den = (n * sumXX - sumX * sumX);
    return den === 0 ? 0 : (n * sumXY - sumX * sumY) / den;
  }

  private findSRZones(sh: number, currentPricePct: number) {
    const zones = { support: [] as number[], resistance: [] as number[] };
    const toPct = (y: number) => (y / sh) * 100;
    const potentialZonals: { y: number, strength: number }[] = [];
    for (let y = 10; y < sh - 10; y++) {
      if (this.densityMap[y] > 1.5 && 
          this.densityMap[y] > this.densityMap[y - 1] && 
          this.densityMap[y] > this.densityMap[y + 1]) {
        potentialZonals.push({ y: toPct(y), strength: this.densityMap[y] });
      }
    }
    potentialZonals.sort((a, b) => b.strength - a.strength);
    const filtered: number[] = [];
    for (const peak of potentialZonals) {
      if (!filtered.some(z => Math.abs(z - peak.y) < 5)) {
        filtered.push(peak.y);
        if (peak.y > currentPricePct) zones.support.push(peak.y);
        else zones.resistance.push(peak.y);
      }
      if (filtered.length >= 10) break;
    }
    return { support: zones.support.slice(0, 3), resistance: zones.resistance.slice(0, 3) };
  }

  private calculateAcceleration(slopes: number[]): number {
    if (slopes.length < 15) return 0;
    return (slopes[slopes.length - 1] - slopes[slopes.length - 15]) / 15;
  }

  private calculateRSI(history: number[]): number {
    const period = 14;
    if (history.length <= period) return 50;
    let gains = 0, losses = 0;
    for (let i = history.length - period; i < history.length; i++) {
      const diff = history[i-1] - history[i];
      if (diff > 0) gains += diff; else losses -= diff;
    }
    if (losses === 0) return 100;
    return 100 - (100 / (1 + (gains / losses)));
  }

  private calculateStandardDeviation(history: number[]): number {
    const n = Math.min(history.length, 50);
    if (n < 5) return 0;
    const subset = history.slice(-n);
    const mean = subset.reduce((a, b) => a + b) / n;
    return Math.sqrt(subset.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n);
  }

  private detectCandleMorphology(density: number[], sh: number): 'HAMMER' | 'SHOOTING_STAR' | 'DOJI' | 'NORMAL' {
    const active = density.map((v, i) => ({ v, i })).filter(d => d.v > 1.5);
    if (active.length < 6) return 'NORMAL';
    const top = active[0].i, bottom = active[active.length - 1].i, h = bottom - top;
    const core = active.filter(d => d.v > Math.max(...density) * 0.7);
    if (core.length < 2) return 'NORMAL';
    const cTop = core[0].i, cBottom = core[core.length - 1].i, cH = cBottom - cTop;
    if (cH < h * 0.2) return 'DOJI';
    if (cH < h * 0.4) {
      if (cTop < top + h * 0.3) return 'SHOOTING_STAR';
      if (cBottom > bottom - h * 0.3) return 'HAMMER';
    }
    return 'NORMAL';
  }

  private detectChartFigure(supports: number[], resistances: number[], slope: number): 'TRIANGLE' | 'HEAD_SHOULDERS' | 'DOUBLE_TOP_BOTTOM' | 'NONE' {
    if (this.peakHistory.length < 3) return 'NONE';
    const last3 = this.peakHistory.slice(-3);
    if (last3[1].y < last3[0].y - 2 && last3[1].y < last3[2].y - 2 && Math.abs(last3[0].y - last3[2].y) < 3) return 'HEAD_SHOULDERS';
    if (Math.abs(last3[1].y - last3[2].y) < 1.5) return 'DOUBLE_TOP_BOTTOM';
    return 'NONE';
  }

  private getDefaultFeatures(): AnalysisFeatures {
    return {
      greenDensity: 0, redDensity: 0, volatility: 0, isConsolidated: true,
      spikeDetected: false, trend: 'neutral', buyPressure: 50, sellPressure: 50,
      supportZones: [], resistanceZones: [], manipulationRisk: 0, slope: 0,
      acceleration: 0, rsi: 50, stdDev: 0,
      commandCandleDetected: false, priceLogicScore: 0, rejectionDetected: false, flowIntegrity: 0,
      detectedPatterns: [], chartFigure: 'NONE', candleMorphology: 'NORMAL'
    };
  }
}
