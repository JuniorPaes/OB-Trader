
# Market Vision Live - AI Trading Intelligence

Sistema avançado de análise de gráficos em tempo real utilizando visão computacional heurística e IA.

## Arquitetura
- **Frontend**: React + TypeScript + Tailwind (Análise local via Canvas/WebRTC).
- **Backend**: Node.js + Express + WebSocket (Socket.IO).
- **Database**: PostgreSQL + Prisma ORM.
- **AI**: Gemini 2.5/3.0 para advisor técnico.

## Como Rodar Local

### 1. Requisitos
- Node.js 18+
- Docker & Docker Compose

### 2. Configuração do Ambiente
Crie um arquivo `.env` na raiz:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/market_vision_live?schema=public"
API_KEY="SUA_CHAVE_GEMINI_API"
PORT=3000
```

### 3. Iniciar Infraestrutura
```bash
docker-compose up -d
```

### 4. Instalar Dependências e Iniciar
```bash
npm install
npx prisma migrate dev
npm run dev
```

## Como Testar o Stream
1. Abra o módulo **Forex Vision** ou **Binary Pro**.
2. Clique em **"Iniciar Tela Compartilhada"**.
3. Selecione a aba ou janela onde o gráfico (TradingView, IQ Option, etc.) está aberto.
4. O sistema começará a capturar frames e gerar heurísticas de cores e volatilidade imediatamente.

## Regras de Operação
- **Forex**: Análise baseada em tendência e pullbacks. Sinais gerados com 65%+ confiança.
- **Binárias**: Regras rígidas. Sinais bloqueados se Risco de Manipulação > 60% ou Probabilidade < 85%.

---
**Isenção de Responsabilidade**: Este sistema é estritamente educacional. O trading envolve riscos financeiros significativos.
