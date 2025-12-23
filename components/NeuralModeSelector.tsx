
import React from 'react';
import { NeuralMode } from '../types';
import { voiceService } from '../services/voiceService';

interface NeuralModeSelectorProps {
  currentMode: NeuralMode;
  onModeChange: (mode: NeuralMode) => void;
}

const NeuralModeSelector: React.FC<NeuralModeSelectorProps> = ({ currentMode, onModeChange }) => {
  const modes = [
    { id: NeuralMode.CONSERVATIVE, label: '🛡️ CONSERVADOR', color: 'bg-cyan-500', text: 'text-cyan-400' },
    { id: NeuralMode.BALANCED, label: '⚖️ EQUILIBRADO', color: 'bg-amber-500', text: 'text-amber-400' },
    { id: NeuralMode.AGGRESSIVE, label: '🔥 AGRESSIVO', color: 'bg-purple-500', text: 'text-purple-400' },
    { id: NeuralMode.HEURISTIC_SAFETY, label: '⚠️ SEGURANÇA', color: 'bg-red-600', text: 'text-red-500' },
  ];

  const handleModeClick = (id: NeuralMode) => {
    voiceService.playClickSFX();
    onModeChange(id);
  };

  return (
    <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl">
      {modes.map((mode) => {
        const isHiddenInternal = mode.id === NeuralMode.HEURISTIC_SAFETY && currentMode !== NeuralMode.HEURISTIC_SAFETY;
        if (isHiddenInternal) return null;

        return (
          <button
            key={mode.id}
            onClick={() => handleModeClick(mode.id)}
            className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${
              currentMode === mode.id
                ? `${mode.color} text-black shadow-lg scale-105 z-10 ${mode.id === NeuralMode.HEURISTIC_SAFETY ? 'animate-pulse' : ''}`
                : 'text-zinc-600 hover:text-zinc-400 hover:bg-white/5'
            }`}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
};

export default NeuralModeSelector;
