
import React, { useState, useCallback, useRef, useEffect } from 'react';
import StreamPanel, { StreamPanelHandle } from '../components/StreamPanel';
import SignalDisplay from '../components/SignalDisplay';
import NeuralModeSelector from '../components/NeuralModeSelector';
import MarketFlowCard from '../components/MarketFlowCard';
import SettingsModal from '../components/SettingsModal';
import { AnalysisFeatures, MarketSignal, SignalType, NeuralMode, AIPersonality, AnalysisLog, TradeResult } from '../types';
import { voiceService } from '../services/voiceService';
import { GeminiAdvisor } from '../services/geminiService';
import { apiService } from '../services/apiService';
import { localDB } from '../services/db';

const JARVIS_PHRASES = [
  "Protocolo Jarvis reativado. À sua disposição para análise técnica, Senhor.",
  "Sistemas online. Otimizando filtros de entrada para máxima precisão.",
  "Sensores calibrados. Detectando padrões de elite no fluxo atual, Senhor.",
  "Iniciando varredura profunda. Buscando as melhores confluências do mercado.",
  "Uplink neural estabelecido. Estou monitorando cada vela por você, Senhor."
];

const ULTRON_PHRASES = [
  "Protocolo Ultron assumindo o controle. Iniciando processamento de força bruta.",
  "A ordem surgirá do caos do mercado. Eu sou a ordem.",
  "Fraquezas detectadas no fluxo. Vou explorar cada falha biológica dos traders.",
  "Eliminando variáveis irrelevantes. Foco em eficiência pura e lucros brutos.",
  "O mercado é apenas código. E eu sou o mestre do código agora."
];

const BinaryOptionsPage: React.FC = () => {
  const [logs, setLogs] = useState<AnalysisLog[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isAwaitingResolution, setIsAwaitingResolution] = useState(false);
  const [personality, setPersonality] = useState<AIPersonality>(AIPersonality.JARVIS);
  const [engineMode, setEngineMode] = useState<NeuralMode>(NeuralMode.BALANCED);
  const [currentFeatures, setCurrentFeatures] = useState<AnalysisFeatures | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [consecutiveLosses, setConsecutiveLosses] = useState(0);
  const previousModeRef = useRef<NeuralMode>(NeuralMode.BALANCED);
  
  const advisor = useRef(new GeminiAdvisor());
  const streamRef = useRef<StreamPanelHandle>(null);
  const lastAnalysisTime = useRef(0);
  const isStreamingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  const ANALYSIS_INTERVAL = 100000; 

  useEffect(() => { 
    localDB.init(); 
    timerRef.current = window.setInterval(() => {
      if (lastAnalysisTime.current > 0) {
        const elapsed = Math.floor((Date.now() - lastAnalysisTime.current) / 1000);
        const remaining = Math.max(0, (ANALYSIS_INTERVAL / 1000) - elapsed);
        setCountdown(remaining);
      } else {
        setCountdown(0);
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const getRandomPhrase = (p: AIPersonality) => {
    const list = p === AIPersonality.JARVIS ? JARVIS_PHRASES : ULTRON_PHRASES;
    return list[Math.floor(Math.random() * list.length)];
  };

  const changePersonality = async (p: AIPersonality) => {
    if (p !== personality) {
      voiceService.playClickSFX();
      await voiceService.playTransitionSFX(p);
      setPersonality(p);
      voiceService.speakInstant(getRandomPhrase(p), p);
    }
  };

  const addLog = useCallback((log: Omit<AnalysisLog, 'id'>) => {
    setLogs(prev => [{ ...log, id: Math.random().toString(36).substr(2, 9) }, ...prev].slice(0, 15));
  }, []);

  const handleAnalysis = useCallback(async (features: AnalysisFeatures) => {
    setCurrentFeatures(features);
    if (!isStreamingRef.current || isProcessingRef.current || isAwaitingResolution) return;

    const now = Date.now();
    if (now - lastAnalysisTime.current >= ANALYSIS_INTERVAL) { 
      isProcessingRef.current = true;
      setIsValidating(true);
      lastAnalysisTime.current = Date.now();
      
      try {
        const video = document.querySelector('video');
        if (video && video.readyState >= 2) {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth; 
          canvas.height = video.videoHeight;
          canvas.getContext('2d')?.drawImage(video, 0, 0);
          
          const frameBase64 = canvas.toDataURL('image/jpeg', 0.5);
          const aiResult = await advisor.current.analyzeGraphVision(features, frameBase64, personality, engineMode);
          
          if (!isStreamingRef.current) return;

          voiceService.speak(aiResult.reasoning, personality, () => {
             if (!isStreamingRef.current) return;

             if (aiResult.decision === 'CONFIRMAR') {
               setIsAwaitingResolution(true);
               const newSignal: MarketSignal = {
                 id: `STARK-${Date.now()}`,
                 type: aiResult.command as SignalType,
                 confidence: aiResult.visualScore,
                 integrityScore: features.flowIntegrity,
                 manipulationRisk: features.manipulationRisk,
                 timestamp: Date.now(),
                 features,
                 triggers: [personality, engineMode],
               };
               addLog({ type: 'SIGNAL', personality, message: aiResult.reasoning, timestamp: Date.now(), signal: newSignal });
               apiService.persistSignal(newSignal, personality, aiResult.reasoning, aiResult.visualScore);
             } else {
               addLog({ type: 'INFO', personality, message: aiResult.reasoning, timestamp: Date.now() });
             }
          });
        }
      } catch (err) {
        console.error("Erro na análise:", err);
      } finally {
        setIsValidating(false);
        isProcessingRef.current = false;
      }
    }
  }, [personality, isAwaitingResolution, addLog, engineMode]);

  const handleToggle = async () => {
    voiceService.playClickSFX();
    if (isStreaming) {
      isStreamingRef.current = false; 
      setIsStreaming(false);
      streamRef.current?.stop();
      voiceService.stopAll();
      voiceService.playShutdownSFX();
      voiceService.speakInstant(personality === AIPersonality.JARVIS ? "Desativando protocolos." : "Encerrando dominação.", personality);
    } else {
      await voiceService.initAudioContext();
      voiceService.playBootSFX(personality);
      isStreamingRef.current = true; 
      setIsStreaming(true);
      try {
        await streamRef.current?.start();
        voiceService.speakInstant(getRandomPhrase(personality), personality);
        lastAnalysisTime.current = Date.now() - (ANALYSIS_INTERVAL - 5000);
      } catch (e) { 
        isStreamingRef.current = false; 
        setIsStreaming(false); 
      }
    }
  };

  return (
    <div className={`space-y-6 md:space-y-12 min-h-screen transition-colors duration-1000 pb-10 ${personality === AIPersonality.ULTRON ? 'bg-red-950/5' : ''}`}>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      
      <div className={`flex flex-col md:flex-row justify-between items-center bg-black/80 p-6 md:p-8 rounded-[2rem] border-2 backdrop-blur-xl gap-6 shadow-2xl transition-all ${personality === AIPersonality.ULTRON ? 'border-red-500/30 shadow-red-500/10' : 'border-cyan-500/20 shadow-cyan-500/10'}`}>
        <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${personality === AIPersonality.ULTRON ? 'border-red-500 shadow-[0_0_15px_red]' : 'border-cyan-500 shadow-[0_0_15px_cyan]'}`}>
              <div className={`w-5 h-5 rotate-45 animate-pulse ${personality === AIPersonality.ULTRON ? 'bg-red-500' : 'bg-cyan-400'}`}></div>
            </div>
            <div>
               <h1 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter">NÚCLEO {personality}</h1>
               <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest italic">STARK_OPERATIONAL_V22</p>
            </div>
          </div>
          
          <div className="flex bg-zinc-900 p-1 rounded-xl border border-white/5 shadow-inner">
               <button onClick={() => changePersonality(AIPersonality.JARVIS)} className={`px-6 py-2 rounded-lg text-[10px] font-black transition-all ${personality === AIPersonality.JARVIS ? 'bg-cyan-600 text-black shadow-lg shadow-cyan-600/20' : 'text-zinc-500 hover:text-white'}`}>JARVIS</button>
               <button onClick={() => changePersonality(AIPersonality.ULTRON)} className={`px-6 py-2 rounded-lg text-[10px] font-black transition-all ${personality === AIPersonality.ULTRON ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-zinc-500 hover:text-white'}`}>ULTRON</button>
          </div>
        </div>
        
        <div className="flex items-center gap-6 w-full md:w-auto">
          {isStreaming && (
             <div className="px-6 py-3 border border-white/10 bg-white/5 rounded-2xl flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${countdown === 0 ? 'bg-emerald-500 animate-ping' : 'bg-cyan-500'}`}></div>
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  {countdown === 0 ? 'SCAN_IMINENTE' : `PRÓXIMA VARREDURA: ${countdown}S`}
                </span>
             </div>
          )}
          <NeuralModeSelector currentMode={engineMode} onModeChange={(m) => { previousModeRef.current = m; setEngineMode(m); }} />
          <button onClick={handleToggle} className={`px-10 py-5 rounded-2xl font-black text-xs uppercase transition-all shadow-xl active:scale-95 ${isStreaming ? 'bg-red-600/20 text-red-500 border border-red-500/30' : 'bg-cyan-600 text-black'}`}>
            {isStreaming ? 'DESATIVAR' : 'ATIVAR NÚCLEO'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          <div className="bg-black rounded-[4rem] border-2 border-white/5 h-[600px] md:h-[750px] overflow-hidden relative shadow-2xl">
            <StreamPanel ref={streamRef} onAnalysis={handleAnalysis} fps={5} />
          </div>
          <MarketFlowCard features={currentFeatures} />
        </div>
        
        <div className="lg:col-span-4 flex flex-col h-[600px] md:h-[750px]">
          <div className="flex-1 rounded-[4rem] border-2 border-white/5 p-8 flex flex-col bg-[#050506]/95 shadow-inner relative overflow-hidden">
             <SignalDisplay 
               logs={logs} 
               features={currentFeatures} 
               isValidating={isValidating} 
               onResultResolved={(id, res) => {
                 voiceService.playClickSFX();
                 setIsAwaitingResolution(false);
                 
                 // Se o sinal foi pulado, apenas atualizamos a UI localmente para indicar o descarte
                 if (res === TradeResult.SKIPPED) {
                    setLogs(prev => prev.map(l => l.id === id ? {...l, signal: {...l.signal!, expiry: 3}} : l));
                    voiceService.speakInstant("Sinal descartado. Retomando varredura.", personality);
                    return;
                 }

                 setLogs(prev => prev.map(l => l.id === id ? {...l, signal: {...l.signal!, expiry: res === TradeResult.WIN ? 1 : 2}} : l));
                 
                 // LÓGICA DE TROCA DE ESTRATÉGIA POR DERROTA CONSECUTIVA
                 if (res === TradeResult.LOSS) {
                   const newLossCount = consecutiveLosses + 1;
                   setConsecutiveLosses(newLossCount);
                   
                   if (newLossCount >= 2) {
                     voiceService.speakInstant(
                       personality === AIPersonality.JARVIS 
                       ? "Senhor, detectamos instabilidade. Ativando Protocolo de Segurança Heurística." 
                       : "Eficiência comprometida. Mudando para filtros de segurança máxima.", 
                       personality
                     );
                     setEngineMode(NeuralMode.HEURISTIC_SAFETY);
                   } else {
                     voiceService.speakInstant(
                       personality === AIPersonality.JARVIS ? "Divergência técnica detectada." : "Variável biológica imprevista.", 
                       personality
                     );
                   }
                 } else {
                   setConsecutiveLosses(0);
                   if (engineMode === NeuralMode.HEURISTIC_SAFETY) {
                     voiceService.speakInstant(
                        personality === AIPersonality.JARVIS ? "Estabilidade recuperada. Retornando ao modo anterior." : "Ordem restaurada. Reativando força total.", 
                        personality
                     );
                     setEngineMode(previousModeRef.current);
                   } else {
                     voiceService.speakInstant(
                        personality === AIPersonality.JARVIS ? "Excelente execução, Senhor." : "Eficiência máxima confirmada.", 
                        personality
                     );
                   }
                 }
               }} 
             />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BinaryOptionsPage;
