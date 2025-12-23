
import React, { useState, useEffect } from 'react';
import { voiceService } from '../services/voiceService';
import { AIPersonality, GeminiVoice, VoiceConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>({
    [AIPersonality.JARVIS]: 'Kore',
    [AIPersonality.ULTRON]: 'Puck'
  });

  const availableVoices: { name: GeminiVoice; desc: string }[] = [
    { name: 'Kore', desc: 'Sofisticado / Britânico' },
    { name: 'Puck', desc: 'Profundo / Autoritário' },
    { name: 'Charon', desc: 'Calmo / Misterioso' },
    { name: 'Fenrir', desc: 'Agressivo / Metálico' },
    { name: 'Zephyr', desc: 'Leve / Rápido' }
  ];

  useEffect(() => {
    const loadSettings = async () => {
      if ((window as any).aistudio?.hasSelectedApiKey) {
        const has = await (window as any).aistudio.hasSelectedApiKey();
        setHasApiKey(has);
      }
      const localConfig = localStorage.getItem('STARK_VOICE_CONFIG');
      if (localConfig) {
        setVoiceConfig(JSON.parse(localConfig));
      }
    };
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const handleVoiceChange = async (personality: AIPersonality, voice: GeminiVoice) => {
    voiceService.playClickSFX();
    const newConfig = { ...voiceConfig, [personality]: voice };
    setVoiceConfig(newConfig);
    await voiceService.updateConfig(newConfig);
  };

  const handleOpenKeyPicker = async () => {
    voiceService.playClickSFX();
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const testVoice = async (personality: AIPersonality) => {
    voiceService.playClickSFX();
    await voiceService.testVoice(personality);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start md:items-center justify-center p-0 md:p-6 backdrop-blur-3xl bg-black/80 overflow-y-auto">
      <div className="bg-[#0c0c0e] border-0 md:border-2 border-white/10 w-full max-w-3xl min-h-screen md:min-h-0 md:rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom duration-300">
        <div className="px-6 md:px-12 py-8 md:py-10 border-b border-white/5 bg-white/[0.02] flex justify-between items-center sticky top-0 z-10 backdrop-blur-xl">
          <div>
            <h2 className="text-xl md:text-3xl font-black text-white italic tracking-tighter uppercase">Painel de Voz</h2>
            <p className="text-[8px] md:text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1 italic">Processamento_Neural</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="p-6 md:p-12 space-y-10 md:space-y-12 pb-20 md:pb-12">
          {/* Key Picker Section */}
          <section className="p-6 md:p-10 rounded-[1.5rem] md:rounded-[2.5rem] bg-amber-500/5 border border-amber-500/20">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 md:gap-6">
                <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full ${hasApiKey ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse shadow-[0_0_15px_currentColor]`}></div>
                <div>
                  <h3 className="text-xs md:text-sm font-black text-white uppercase tracking-widest mb-1">Criptografia Stark</h3>
                  <p className="text-[7px] md:text-[9px] text-zinc-500 uppercase font-bold italic">{hasApiKey ? 'PROTOCOLO_OK' : 'PENDENTE'}</p>
                </div>
              </div>
              <button 
                onClick={handleOpenKeyPicker}
                className="w-full sm:w-auto px-6 py-3 bg-amber-500 text-black rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all shadow-xl"
              >
                {hasApiKey ? 'Trocar Chave' : 'Vincular API'}
              </button>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
            {/* JARVIS VOICE SELECTOR */}
            <div className="p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] bg-cyan-500/5 border border-cyan-500/20 flex flex-col gap-5">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] md:text-[11px] font-black text-cyan-500 uppercase tracking-widest italic">JARVIS</h4>
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[7px] md:text-[8px] font-black text-zinc-500 uppercase tracking-widest block ml-1">Voz do Sistema</label>
                <select 
                  value={voiceConfig[AIPersonality.JARVIS]}
                  onChange={(e) => handleVoiceChange(AIPersonality.JARVIS, e.target.value as GeminiVoice)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white text-[9px] md:text-[10px] font-bold focus:outline-none appearance-none cursor-pointer"
                >
                  {availableVoices.map(v => (
                    <option key={v.name} value={v.name} className="bg-zinc-900">{v.name} - {v.desc}</option>
                  ))}
                </select>
              </div>

              <button 
                onClick={() => testVoice(AIPersonality.JARVIS)}
                className="w-full py-3 md:py-4 bg-cyan-600 text-black rounded-xl md:rounded-2xl text-[8px] md:text-[9px] font-black uppercase tracking-widest hover:bg-cyan-500 transition-all mt-auto"
              >
                Testar Sintonia
              </button>
            </div>

            {/* ULTRON VOICE SELECTOR */}
            <div className="p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] bg-red-500/5 border border-red-500/20 flex flex-col gap-5">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] md:text-[11px] font-black text-red-500 uppercase tracking-widest italic">ULTRON</h4>
                <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[7px] md:text-[8px] font-black text-zinc-500 uppercase tracking-widest block ml-1">Voz Imperial</label>
                <select 
                  value={voiceConfig[AIPersonality.ULTRON]}
                  onChange={(e) => handleVoiceChange(AIPersonality.ULTRON, e.target.value as GeminiVoice)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white text-[9px] md:text-[10px] font-bold focus:outline-none appearance-none cursor-pointer"
                >
                  {availableVoices.map(v => (
                    <option key={v.name} value={v.name} className="bg-zinc-900">{v.name} - {v.desc}</option>
                  ))}
                </select>
              </div>

              <button 
                onClick={() => testVoice(AIPersonality.ULTRON)}
                className="w-full py-3 md:py-4 bg-red-700 text-white rounded-xl md:rounded-2xl text-[8px] md:text-[9px] font-black uppercase tracking-widest hover:bg-red-600 transition-all mt-auto"
              >
                Testar Ressonância
              </button>
            </div>
          </div>
          
          <p className="text-center text-[7px] text-zinc-600 uppercase font-black tracking-widest">
            A tecnologia depende de uplink ativo com Google Gemini.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
