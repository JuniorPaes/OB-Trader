
import React, { useEffect, useRef } from 'react';
import { AnalysisLog, SignalType, TradeResult, AnalysisFeatures, MarketSignal, MarketMode, AIPersonality } from '../types';
import { apiService } from '../services/apiService';
import { voiceService } from '../services/voiceService';

interface SignalDisplayProps {
  logs?: AnalysisLog[];
  features?: AnalysisFeatures | null;
  isValidating?: boolean;
  signal?: MarketSignal | null;
  mode?: MarketMode;
  onResultResolved: (id: string, result: TradeResult) => void;
}

const SignalDisplay: React.FC<SignalDisplayProps> = ({ 
  logs, 
  features, 
  isValidating, 
  signal, 
  mode, 
  onResultResolved 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs, isValidating, signal]);

  const handleResult = async (logId: string, signalId: string, result: TradeResult) => {
    voiceService.playClickSFX();
    try {
      if (result !== TradeResult.SKIPPED) {
        await apiService.recordTradeResult(signalId, result);
      }
      onResultResolved(logId, result);
    } catch (e) { 
      console.error("Erro ao registrar resultado:", e); 
    }
  };

  const formatMessage = (text: string) => {
    const keywords = [
      { regex: /COMPRAR/gi, class: 'text-emerald-400 font-black' },
      { regex: /VENDER/gi, class: 'text-red-500 font-black' },
      { regex: /AGUARDAR/gi, class: 'text-amber-500 font-black' },
      { regex: /SENHOR/gi, class: 'text-cyan-400 italic' }
    ];
    let formatted = text;
    keywords.forEach(k => {
      formatted = formatted.replace(k.regex, (match) => `<span class="${k.class}">${match}</span>`);
    });
    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  if (mode === MarketMode.FOREX && signal) {
    return (
      <div className="bg-zinc-950/80 border-2 border-cyan-500/20 rounded-[2rem] md:rounded-[3rem] p-6 md:p-8 animate-in zoom-in duration-500 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 md:p-6">
           <div className="w-2 h-2 md:w-3 md:h-3 bg-cyan-500 rounded-full animate-ping"></div>
        </div>
        <h3 className="text-[8px] md:text-[10px] font-black text-cyan-500 uppercase tracking-[0.2em] md:tracking-[0.4em] mb-4 md:mb-6 italic">Sinal_Forex_Ativo</h3>
        
        <div className={`text-2xl md:text-4xl font-black mb-4 md:mb-6 italic ${signal.type === SignalType.BUY ? 'text-emerald-500' : 'text-red-500'}`}>
          {signal.type}!
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="bg-white/5 p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/5">
             <span className="text-[7px] md:text-[8px] font-black text-zinc-500 uppercase block mb-1">Confiança</span>
             <span className="text-xl md:text-2xl font-mono font-black text-white">{signal.confidence}%</span>
          </div>
          <div className="bg-white/5 p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/5 text-right">
             <span className="text-[7px] md:text-[8px] font-black text-zinc-500 uppercase block mb-1">Integridade</span>
             <span className="text-xl md:text-2xl font-mono font-black text-emerald-400">{signal.integrityScore}%</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex gap-3 md:gap-4">
             <button 
               onClick={() => handleResult(signal.id, signal.id, TradeResult.WIN)}
               className="flex-1 py-4 md:py-5 bg-emerald-600 hover:bg-emerald-500 text-black font-black rounded-xl md:rounded-2xl transition-all shadow-lg shadow-emerald-500/20 uppercase text-[10px] md:text-xs"
             >
               ALVO_WIN
             </button>
             <button 
               onClick={() => handleResult(signal.id, signal.id, TradeResult.LOSS)}
               className="flex-1 py-4 md:py-5 bg-red-700 hover:bg-red-600 text-white font-black rounded-xl md:rounded-2xl transition-all shadow-lg shadow-red-500/20 uppercase text-[10px] md:text-xs"
             >
               PARADA_LOSS
             </button>
          </div>
          <button 
             onClick={() => handleResult(signal.id, signal.id, TradeResult.SKIPPED)}
             className="w-full py-3 md:py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-black rounded-xl md:rounded-2xl transition-all uppercase text-[8px] md:text-[10px] border border-white/5"
           >
             PULAR SINAL
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between mb-4 md:mb-6 px-1 md:px-2">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_#06b6d4]"></div>
          <h2 className="text-[8px] md:text-[10px] font-black text-white uppercase tracking-[0.2em] md:tracking-[0.3em] italic">Feed_Análise_Live</h2>
        </div>
        <div className="text-[7px] md:text-[8px] font-mono text-zinc-500 uppercase tracking-widest hidden xs:block">Lógica_V4_Ativa</div>
      </div>

      <div className="mb-4 md:mb-6 bg-white/5 border border-white/5 rounded-xl md:rounded-2xl p-4 md:p-5 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
        <div className="flex justify-between items-center mb-3 md:mb-4">
          <span className="text-[6px] md:text-[7px] font-black text-zinc-400 uppercase tracking-widest">Sensores</span>
          <span className="text-[8px] md:text-[9px] font-mono text-cyan-400 font-bold">{features?.flowIntegrity ?? 0}% SINCRONIA</span>
        </div>
        <div className="space-y-2 md:space-y-3">
           <div className="flex justify-between text-[6px] md:text-[7px] font-black uppercase text-zinc-500">
             <span>V: {features?.sellPressure.toFixed(0) ?? 50}%</span>
             <span>C: {features?.buyPressure.toFixed(0) ?? 50}%</span>
           </div>
           <div className="h-1 md:h-1.5 bg-zinc-900 rounded-full overflow-hidden flex border border-white/5">
              <div className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)] transition-all duration-500" style={{ width: `${features?.sellPressure ?? 50}%` }}></div>
              <div className="h-full bg-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-500" style={{ width: `${features?.buyPressure ?? 50}%` }}></div>
           </div>
        </div>
        {isValidating && (
          <div className="mt-3 md:mt-4 flex items-center gap-2 md:gap-3 py-1 md:py-2 border-t border-white/5 animate-in fade-in">
             <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-amber-500 rounded-full animate-ping"></div>
             <span className="text-[7px] md:text-[8px] font-black text-amber-500 uppercase tracking-[0.2em] italic">Analisando Gráfico...</span>
          </div>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 md:space-y-4 pr-1 md:pr-2 custom-scrollbar pb-4 min-h-[300px]">
        {logs?.map((log, index) => {
          const isWait = log.message.includes("AGUARDAR") || log.type === 'INFO';
          const isNewest = index === 0;
          const isResolved = log.signal?.expiry && log.signal.expiry > 0;
          const isJarvis = log.personality === AIPersonality.JARVIS;

          return (
            <div key={log.id} className={`p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] border-2 transition-all duration-500 animate-in slide-in-from-right-5 relative overflow-hidden ${
                isNewest ? 'ring-2 ring-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]' : ''
              } ${
                isWait ? 'bg-amber-500/5 border-amber-500/10' : 
                (log.signal?.type === SignalType.BUY ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20')
              }`}
            >
              <div className="flex justify-between items-center mb-3 md:mb-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <span className={`text-[7px] md:text-[9px] font-black uppercase tracking-widest px-1.5 md:px-2 py-0.5 rounded ${isJarvis ? 'bg-cyan-500/20 text-cyan-400' : 'bg-red-600/20 text-red-500'}`}>
                    {log.personality}
                  </span>
                </div>
                <span className="text-[6px] md:text-[7px] font-mono text-zinc-600">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>

              <div className={`text-[9px] md:text-[11px] text-zinc-300 italic mb-3 md:mb-4 leading-relaxed font-medium ${isNewest ? 'text-white' : ''}`}>
                "{formatMessage(log.message)}"
              </div>

              {log.type === 'SIGNAL' && log.signal && !isWait && (
                <div className="pt-3 md:pt-4 border-t border-white/5 space-y-3">
                  {!isResolved ? (
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => handleResult(log.id, log.signal!.id, TradeResult.WIN)}
                          className="py-3 md:py-4 bg-emerald-600 hover:bg-emerald-500 text-black text-[8px] md:text-[10px] font-black uppercase rounded-xl md:rounded-2xl transition-all"
                        >
                          WIN
                        </button>
                        <button 
                          onClick={() => handleResult(log.id, log.signal!.id, TradeResult.LOSS)}
                          className="py-3 md:py-4 bg-red-700 hover:bg-red-600 text-white text-[8px] md:text-[10px] font-black uppercase rounded-xl md:rounded-2xl transition-all"
                        >
                          LOSS
                        </button>
                      </div>
                      <button 
                        onClick={() => handleResult(log.id, log.signal!.id, TradeResult.SKIPPED)}
                        className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[7px] md:text-[9px] font-black uppercase rounded-xl transition-all border border-white/5"
                      >
                        PULAR OPERAÇÃO
                      </button>
                    </div>
                  ) : (
                    <div className={`text-center py-3 md:py-4 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase border ${
                      log.signal.expiry === 1 ? 'border-emerald-500/50 text-emerald-500 bg-emerald-500/10' : 
                      log.signal.expiry === 3 ? 'border-zinc-500/50 text-zinc-500 bg-zinc-500/10' :
                      'border-red-500/50 text-red-500 bg-red-500/10'
                    }`}>
                      {log.signal.expiry === 1 ? '🎯 OPERAÇÃO_WIN' : 
                       log.signal.expiry === 3 ? '⏭️ SINAL_PULADO' :
                       '❌ OPERAÇÃO_LOSS'}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SignalDisplay;
