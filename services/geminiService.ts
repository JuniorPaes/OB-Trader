
import { GoogleGenAI } from "@google/genai";
import { AnalysisFeatures, SignalType, AIPersonality, NeuralMode } from "../types";

export interface AIAnalysisResult {
  decision: 'CONFIRMAR' | 'REJEITAR';
  command: string;
  reasoning: string;
  visualScore: number;
}

export class GeminiAdvisor {
  public async analyzeGraphVision(
    features: AnalysisFeatures, 
    base64Frame: string,
    personality: AIPersonality,
    mode: NeuralMode
  ): Promise<AIAnalysisResult> {
    if (!process.env.API_KEY) {
      return { decision: 'REJEITAR', command: 'AGUARDAR', reasoning: 'Configuração de API pendente.', visualScore: 0 };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
      const archetypes = {
        [AIPersonality.JARVIS]: "VOCÊ É J.A.R.V.I.S. Britânico, sofisticado. Trata como 'Senhor'.",
        [AIPersonality.ULTRON]: "VOCÊ É ULTRON. Frio, calculista, mestre da ordem."
      };

      const prompt = `[OS_STARK_V22]
      ${archetypes[personality]}
      MODO: ${mode}

      MÉTRICAS:
      - Slope: ${features.slope.toFixed(5)} | RSI: ${features.rsi.toFixed(2)}
      - Vol: ${features.volatility.toFixed(1)}% | Pressure: C:${features.buyPressure.toFixed(0)}%/V:${features.sellPressure.toFixed(0)}%

      TAREFA: Decida CONFIRMAR ou REJEITAR para o modo ${mode}.
      
      REGRA DE FALA OBRIGATÓRIA:
      A sua fala (campo "fala" no JSON) DEVE começar EXATAMENTE com uma das três palavras: "COMPRAR!", "VENDER!" ou "AGUARDAR!", seguida da sua explicação técnica curta.
      Exemplo: "COMPRAR! Senhor, detectamos exaustão de venda no suporte 1.12."

      RESPOSTA JSON:
      {
        "decisao": "CONFIRMAR" ou "REJEITAR",
        "direcao": "COMPRAR", "VENDER" ou "AGUARDAR",
        "score": 0-100,
        "fala": "[AÇÃO]! [Explicação curta]"
      }`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/jpeg", data: base64Frame.split(',')[1] } }
          ]
        },
        config: { 
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      });

      const result = JSON.parse(response.text || "{}");
      const isConfirmed = result.decisao === "CONFIRMAR" && result.direcao !== "AGUARDAR";
      
      return { 
        decision: isConfirmed ? 'CONFIRMAR' : 'REJEITAR', 
        command: isConfirmed ? result.direcao : "AGUARDAR",
        reasoning: result.fala || "AGUARDAR! Fluxo instável.", 
        visualScore: result.score || 0 
      };
    } catch (e: any) {
      return { decision: 'REJEITAR', command: 'AGUARDAR', reasoning: 'AGUARDAR! Link em recuperação.', visualScore: 0 };
    }
  }
}
