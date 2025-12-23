
import React from 'react';
import { AnalysisFeatures } from '../types';

interface VisionOverlayProps {
  features: AnalysisFeatures | null;
  isActive: boolean;
}

const VisionOverlay: React.FC<VisionOverlayProps> = ({ features, isActive }) => {
  if (!isActive || !features) return null;

  const isUltron = features.sellPressure > 60 || features.redDensity > 15;
  const mainColor = isUltron ? 'rgba(239, 68, 68, 0.4)' : 'rgba(6, 182, 212, 0.4)';
  const accentHex = isUltron ? '#ef4444' : '#22d3ee';

  return (
    <div className={`absolute inset-0 pointer-events-none z-10 overflow-hidden rounded-[2.5rem] border-2 border-white/5`}>
      {/* HUD Grid Background */}
      <div className={`absolute inset-0 opacity-[0.03]`} 
           style={{ 
             backgroundImage: `linear-gradient(${mainColor} 1px, transparent 1px), linear-gradient(90deg, ${mainColor} 1px, transparent 1px)`, 
             backgroundSize: '40px 40px' 
           }}>
      </div>

      {/* MATH METRICS HUD (TOP LEFT) */}
      <div className="absolute top-8 left-8 flex flex-col gap-3 animate-in fade-in slide-in-from-left-4 duration-700">
         <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/10 shadow-2xl">
            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">RSI_NEURAL</span>
            <span className={`text-[12px] font-mono font-black ${features.rsi > 70 ? 'text-red-500' : features.rsi < 30 ? 'text-emerald-500' : 'text-white'}`}>
              {features.rsi.toFixed(1)}
            </span>
         </div>
         <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/10 shadow-2xl">
            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">TRND_STABLE</span>
            <span className={`text-[12px] font-mono font-black ${features.trend === 'bullish' ? 'text-emerald-500' : features.trend === 'bearish' ? 'text-red-500' : 'text-zinc-400'}`}>
              {features.trend === 'bullish' ? 'BULL' : features.trend === 'bearish' ? 'BEAR' : 'FLAT'}
            </span>
         </div>
      </div>

      {/* PATTERNS HUD (TOP RIGHT) */}
      <div className="absolute top-8 right-8 flex flex-col items-end gap-2 animate-in fade-in slide-in-from-right-4 duration-700">
        {features.candleMorphology !== 'NORMAL' && (
          <div className={`px-4 py-2 rounded-xl border-2 animate-pulse bg-black/60 backdrop-blur-md ${isUltron ? 'border-red-500/50 text-red-500' : 'border-emerald-500/50 text-emerald-500'} shadow-[0_0_20px_rgba(0,0,0,0.5)]`}>
             <span className="text-[9px] font-black uppercase tracking-[0.2em] italic">{features.candleMorphology} DETECTED</span>
          </div>
        )}
        {features.chartFigure !== 'NONE' && (
          <div className={`px-4 py-2 rounded-xl border-2 bg-white/5 backdrop-blur-md ${isUltron ? 'border-orange-500/50 text-orange-400' : 'border-cyan-400/50 text-cyan-400'} shadow-[0_0_20px_rgba(0,0,0,0.5)]`}>
             <span className="text-[9px] font-black uppercase tracking-[0.2em] italic">{features.chartFigure}</span>
          </div>
        )}
      </div>

      {/* RESISTANCE ZONES (RED) */}
      {features.resistanceZones.map((y, i) => (
        <div key={`res-${i}`} className="absolute left-0 w-full flex items-center group transition-all duration-1000" style={{ top: `${y}%` }}>
          <div className={`h-[1px] md:h-[2px] flex-1 bg-gradient-to-r from-transparent via-red-600/40 to-transparent shadow-[0_0_15px_rgba(220,38,38,0.3)]`}></div>
          <div className="absolute left-10 -top-4 flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
            <span className="text-[6px] font-black text-red-400 uppercase tracking-tighter bg-black/80 px-2 py-0.5 rounded border border-red-500/20">
              MEM_RES_{i+1}
            </span>
          </div>
        </div>
      ))}

      {/* SUPPORT ZONES (CYAN) */}
      {features.supportZones.map((y, i) => (
        <div key={`sup-${i}`} className="absolute left-0 w-full flex items-center group transition-all duration-1000" style={{ top: `${y}%` }}>
          <div className={`h-[1px] md:h-[2px] flex-1 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent shadow-[0_0_15px_rgba(6,182,212,0.3)]`}></div>
          <div className="absolute left-10 top-2 flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
            <span className="text-[6px] font-black text-cyan-400 uppercase tracking-tighter bg-black/80 px-2 py-0.5 rounded border border-cyan-500/20">
              MEM_SUP_{i+1}
            </span>
          </div>
        </div>
      ))}

      {/* POWER CANDLE INDICATOR */}
      {features.commandCandleDetected && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2 flex flex-col items-center animate-in zoom-in duration-300">
           <div className={`w-1 h-40 rounded-full ${isUltron ? 'bg-red-500 shadow-[0_0_40px_red]' : 'bg-cyan-400 shadow-[0_0_40px_cyan]'}`}></div>
           <div className={`bg-black/90 border-2 ${isUltron ? 'border-red-500' : 'border-cyan-400'} px-3 py-1 rounded-lg mt-4 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>
             <span className={`text-[8px] font-black ${isUltron ? 'text-red-500' : 'text-cyan-400'} tracking-[0.3em] italic uppercase`}>POWER_MOMENTUM</span>
           </div>
        </div>
      )}

      {/* SCANNER SWEEP EFFECT */}
      <div className={`absolute w-full h-[200px] bg-gradient-to-b from-transparent ${isUltron ? 'via-red-500/10' : 'via-cyan-400/10'} to-transparent animate-scan-jarvis`}></div>

      {/* BOTTOM STATUS BAR */}
      <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end opacity-40">
        <div className="flex items-center gap-4">
           <div className="font-mono text-[7px] text-zinc-500 uppercase tracking-[0.4em]">
              FLOW_INT: <span className={accentHex}>{features.flowIntegrity}%</span>
           </div>
           <div className="font-mono text-[7px] text-zinc-500 uppercase tracking-[0.4em]">
              SLOPE: <span className="text-white">{features.slope.toFixed(6)}</span>
           </div>
        </div>
        <div className="font-mono text-[7px] text-zinc-500 uppercase tracking-[0.4em]">
           STARK_NEURAL_LINK_V2
        </div>
      </div>

      <style>{`
        @keyframes scan-jarvis {
          0% { transform: translate3d(0, -150%, 0); opacity: 0; }
          20% { opacity: 0.6; }
          80% { opacity: 0.3; }
          100% { transform: translate3d(0, 800%, 0); opacity: 0; }
        }
        .animate-scan-jarvis { animation: scan-jarvis 10s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
      `}</style>
    </div>
  );
};

export default VisionOverlay;
