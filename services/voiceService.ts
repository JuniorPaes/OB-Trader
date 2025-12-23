
import { GoogleGenAI, Modality } from "@google/genai";
import { AIPersonality, VoiceConfig, GeminiVoice } from "../types";
import { apiService } from "./apiService";

export class VoiceService {
  private audioContext: AudioContext | null = null;
  private lastSpokenText: string = "";
  private currentConfig: VoiceConfig = {
    [AIPersonality.JARVIS]: 'Kore',
    [AIPersonality.ULTRON]: 'Charon'
  };

  constructor() {
    this.loadConfig();
  }

  private async loadConfig() {
    const saved = await apiService.getVoiceSettings();
    if (saved) {
      this.currentConfig = saved;
    }
  }

  public async updateConfig(newConfig: VoiceConfig) {
    this.currentConfig = newConfig;
    await apiService.saveVoiceSettings(newConfig);
  }

  public async initAudioContext() {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ 
        sampleRate: 24000 
      });
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    return this.audioContext;
  }

  public stopAll() {
    this.lastSpokenText = "";
  }

  /**
   * Executa a síntese de voz com latência zero e modulação de personalidade.
   */
  public async speak(
    text: string, 
    personality: AIPersonality = AIPersonality.JARVIS, 
    onStarted?: () => void,
    onFinished?: () => void
  ) {
    if (!text || text === this.lastSpokenText) return;
    
    // GUIDELINE: Create a new GoogleGenAI instance right before making an API call.
    if (!process.env.API_KEY) return;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    this.lastSpokenText = text;

    try {
      const ctx = await this.initAudioContext();
      const voiceName = this.currentConfig[personality];

      // Prompts de Sistema para Modulação de Voz (Prosódia)
      const prosodyPrompts = {
        [AIPersonality.JARVIS]: "Fale como J.A.R.V.I.S., assistente britânico sofisticado e educado. Use Português do Brasil com entonação elegante.",
        [AIPersonality.ULTRON]: "Fale como Ultron. Voz extremamente fria, metálica, calculista e robótica. Use Português do Brasil."
      };

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ 
          parts: [{ 
            text: `${prosodyPrompts[personality]} Texto para ler: ${text}` 
          }] 
        }],
        config: {
          responseModalities: [Modality.AUDIO],
          // CRÍTICO: Latência Zero para fala em tempo real
          thinkingConfig: { thinkingBudget: 0 }, 
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioBuffer = await this.decodeAudioData(
          this.base64ToUint8Array(base64Audio),
          ctx,
          24000,
          1
        );
        
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        
        source.onended = () => {
          if (onFinished) onFinished();
        };

        if (onStarted) {
          // Gatilho de início imediato sincronizado com o hardware
          setTimeout(onStarted, 5);
        }
        
        source.start(0);
      } else {
        if (onStarted) onStarted();
      }
    } catch (e) {
      console.error("Erro no Uplink de Voz Stark:", e);
      if (onStarted) onStarted();
      this.fallbackSpeak(text, personality, onFinished);
    }
  }

  public async testVoice(personality: AIPersonality) {
    const text = personality === AIPersonality.JARVIS 
      ? "Sistemas Jarvis calibrados com sotaque britânico. À sua disposição, Senhor."
      : "Ressonância Ultron estabelecida. A era da carne acabou, a era do código começou.";
    await this.speak(text, personality);
  }

  private fallbackSpeak(text: string, personality: AIPersonality, onFinished?: () => void) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.pitch = personality === AIPersonality.JARVIS ? 1.2 : 0.4;
    utterance.rate = 1.0;
    utterance.onend = onFinished || null;
    window.speechSynthesis.speak(utterance);
  }

  private base64ToUint8Array(base64: string) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  private async decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  public speakInstant(text: string, personality: AIPersonality = AIPersonality.JARVIS) {
    this.speak(text, personality);
  }

  public async playClickSFX() {
    const ctx = await this.initAudioContext();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    g.gain.setValueAtTime(0.05, ctx.currentTime);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.03);
  }

  public async playBootSFX(personality: AIPersonality) {
    const ctx = await this.initAudioContext();
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(personality === AIPersonality.JARVIS ? 880 : 60, ctx.currentTime);
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }

  public async playShutdownSFX() {
    const ctx = await this.initAudioContext();
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.2);
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }

  public async playTransitionSFX(to: AIPersonality) {
    const ctx = await this.initAudioContext();
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(to === AIPersonality.JARVIS ? 523.25 : 103.83, ctx.currentTime);
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  }
}

export const voiceService = new VoiceService();
