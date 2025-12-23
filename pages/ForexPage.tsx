
import React, { useState, useCallback, useRef } from 'react';
import StreamPanel, { StreamPanelHandle } from '../components/StreamPanel';
import SignalDisplay from '../components/SignalDisplay';
import MarketFlowCard from '../components/MarketFlowCard';
import NeuralModeSelector from '../components/NeuralModeSelector';
import { AnalysisFeatures, MarketSignal, SignalType, MarketMode, NeuralMode, AIPersonality } from '../types';
import { voiceService } from '../services/voiceService';
import { GeminiAdvisor } from '../services/geminiService';
import { apiService } from '../services/apiService';

const ForexPage: React.FC = () => {
  const [signal, setSignal] = useState<MarketSignal | null>(null);
  const [currentFeatures, setCurrentFeatures] = useState<AnalysisFeatures | null>(null);
  const [engineMode, setEngineMode] = useState<NeuralMode>(NeuralMode.BALANCED);
  const [isAwaitingOutcome, setIsAwaitingOutcome] = useState(false);
  const [advice, setAdvice] = useState<string>("");
  const [isValidating, setIsValidating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const advisor = useRef(new GeminiAdvisor());
  const streamRef = useRef<StreamPanelHandle>(null);
  const lastAnalysisTime = useRef(0);
  const isStreamingRef = useRef(false);

  // AJUSTADO PARA 100 SEGUNDOS
  const FOREX_ANALYSIS_INTERVAL = 100000;

  const toggleAnalysis = useCallback(async () => {
    if (isStreaming) {
      isStreamingRef.current = false; setIsStreaming(false);
      setAdvice(""); streamRef.current?.stop();
      voiceService.stopAll(); voiceService.playShutdownSFX();
      voiceService.speakInstant("Finalizando uplink Forex.", AIPersonality.JARVIS);
    } else {
      await voiceService.initAudioContext();
      voiceService.playBootSFX(AIPersonality.JARVIS);
      isStreamingRef.current = true; setIsStreaming(true);
      try {
        await streamRef.current?.start();
        voiceService.speakInstant("Protocolo de visão institucional ativo.", AIPersonality.JARVIS);
        setAdvice("Lendo estrutura de mercado...");
      } catch (e) { isStreamingRef.current = false; setIsStreaming(false); }
    }
  }, [isStreaming]);

  const handleAnalysis = useCallback(async (features: AnalysisFeatures) => {
    setCurrentFeatures(features);
    if (!isStreamingRef.current || isValidating || isAwaitingOutcome) return;

    const now = Date.now();
    if (now - lastAnalysisTime.current >= FOREX_ANALYSIS_INTERVAL) {
      setIsValidating(true);
      lastAnalysisTime.current = now;

      try {
        const video = document.querySelector('video');
        if (!video) return;

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);
        const frameBase64 = canvas.toDataURL('image/jpeg', 0.6);

        const aiResult = await advisor.current.analyzeGraphVision(features, frameBase64, AIPersonality.JARVIS, engineMode);
        
        if (!isStreamingRef.current) return;

        // SINCRONIZAÇÃO: SÓ ATUALIZA A UI QUANDO O ÁUDIO COMEÇAR
        voiceService.speak(aiResult.reasoning, AIPersonality.JARVIS, () => {
          if (!isStreamingRef.current) return;
          setAdvice(aiResult.reasoning);
          if (aiResult.decision === 'CONFIRMAR' && aiResult.command !== 'AGUARDAR') {
            const newSignal: MarketSignal = {
              id: `FX-${now}`,
              type: aiResult.command as SignalType,
              confidence: aiResult.visualScore,
              integrityScore: features.flowIntegrity,
              manipulationRisk: features.manipulationRisk,
              timestamp: now,
              features,
              triggers: ['FOREX_NEURAL', engineMode]
            };
            setSignal(newSignal);
            setIsAwaitingOutcome(true);
            apiService.persistSignal(newSignal, AIPersonality.JARVIS, aiResult.reasoning, aiResult.visualScore);
          }
        });
      } finally {
        setIsValidating(false);
      }
    }
  }, [isValidating, isAwaitingOutcome, engineMode]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
      <div className="xl:col-span-8 space-y-8">
        <div className="bg-black/60 p-8 rounded-[3rem] border border-white/5 backdrop-blur-2xl flex items-center justify-between shadow-2xl">
           <div className="flex items-center gap-6">
              <div className={`w-4 h-4 rounded-full ${isStreaming ? 'bg-cyan-500 animate-pulse' : 'bg-zinc-800'}`}></div>
              <h2 className="text-2xl font-black text-white uppercase italic">Forex <span className="text-cyan-500">Vision</span></h2>
           </div>
           <div className="flex items-center gap-6">
             <NeuralModeSelector currentMode={engineMode} onModeChange={setEngineMode} />
             <button onClick={toggleAnalysis} className={`px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${isStreaming ? 'bg-red-500/10 text-red-500' : 'bg-cyan-600 text-black'}`}>
               {isStreaming ? 'STOP_SCAN' : 'BOOT_NEURAL_LINK'}
             </button>
           </div>
        </div>
        <div className="relative rounded-[4rem] overflow-hidden border-2 border-white/5 h-[650px] shadow-2xl">
          <StreamPanel ref={streamRef} onAnalysis={handleAnalysis} fps={2} />
          {advice && (
             <div className="absolute bottom-10 left-10 right-10 bg-black/80 backdrop-blur-md p-6 rounded-3xl border border-cyan-500/30">
                <p className="text-cyan-400 text-xs italic font-medium leading-relaxed">"{advice}"</p>
             </div>
          )}
        </div>
      </div>
      <div className="xl:col-span-4 flex flex-col gap-8">
        <MarketFlowCard features={currentFeatures} />
        <div className="flex-1">
          <SignalDisplay signal={signal} mode={MarketMode.FOREX} onResultResolved={() => {setSignal(null); setAdvice(""); setIsAwaitingOutcome(false);}} />
        </div>
      </div>
    </div>
  );
};

export default ForexPage;
