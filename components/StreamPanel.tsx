
import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { HeuristicAnalyzer } from '../services/heuristicAnalyzer';
import { AnalysisFeatures } from '../types';
import VisionOverlay from './VisionOverlay';

interface StreamPanelProps {
  onAnalysis: (features: AnalysisFeatures) => void;
  fps?: number;
}

export interface StreamPanelHandle {
  start: () => Promise<void>;
  stop: () => void;
  isActive: boolean;
  error: string | null;
}

const StreamPanel = forwardRef<StreamPanelHandle, StreamPanelProps>(({ onAnalysis, fps = 4 }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveMetrics, setLiveMetrics] = useState<AnalysisFeatures | null>(null);
  const analyzer = useRef(new HeuristicAnalyzer());
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  
  // Ref para controle imediato de supressão de eventos
  const activeRef = useRef(false);

  const stopStream = () => {
    activeRef.current = false;
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setError(null);
    cancelAnimationFrame(requestRef.current);
  };

  const startStream = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          frameRate: { ideal: 30 },
          cursor: "always"
        } as any,
        audio: false,
      });

      activeRef.current = true;
      setIsStreaming(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      stream.getVideoTracks()[0].onended = () => {
        stopStream();
      };
      
    } catch (err: any) {
      console.error("Erro de permissão ou captura:", err);
      setError("ACESSO NEGADO: Falha ao inicializar sensores.");
      setIsStreaming(false);
      activeRef.current = false;
      throw err;
    }
  };

  useImperativeHandle(ref, () => ({
    start: startStream,
    stop: stopStream,
    isActive: isStreaming,
    error: error
  }));

  const animate = (time: number) => {
    if (!activeRef.current) return;

    const msPerFrame = 1000 / fps;
    if (time - lastTimeRef.current >= msPerFrame) {
      if (videoRef.current && canvasRef.current && videoRef.current.readyState >= 2) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const result = analyzer.current.analyzeFrame(canvas);
          setLiveMetrics(result);
          // Só emite se ainda estiver ativo
          if (activeRef.current) onAnalysis(result);
        }
      }
      lastTimeRef.current = time;
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isStreaming) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(requestRef.current);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isStreaming, fps]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 flex items-center justify-center">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className={`w-full h-full object-contain transition-opacity duration-1000 ${isStreaming ? 'opacity-100' : 'opacity-0'}`} 
      />
      <canvas ref={canvasRef} className="hidden" />
      
      {error && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 p-10 text-center">
          <h3 className="text-red-500 font-black text-xl uppercase mb-4 italic">Erro de Conexão Neural</h3>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{error}</p>
          <button onClick={startStream} className="mt-8 px-8 py-3 bg-red-500/10 border border-red-500/50 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest">Reconectar</button>
        </div>
      )}

      {!isStreaming && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-10">
          <div className="w-48 h-48 border-4 border-dashed border-cyan-500 rounded-full animate-spin-slow"></div>
        </div>
      )}

      <VisionOverlay features={liveMetrics} isActive={isStreaming} />
    </div>
  );
});

export default StreamPanel;
