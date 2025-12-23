
import React, { useState, useEffect } from 'react';
import { voiceService } from '../services/voiceService';
import { AIPersonality } from '../types';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'ONLINE' | 'SIMULATED'>('SIMULATED');
  const [hasApiKey, setHasApiKey] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { signIn, register } = useAuth();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const alive = await apiService.isBackendAlive();
        setBackendStatus(alive ? 'ONLINE' : 'SIMULATED');
        
        // Verifica se a chave de API do Gemini foi selecionada
        if ((window as any).aistudio?.hasSelectedApiKey) {
          const has = await (window as any).aistudio.hasSelectedApiKey();
          setHasApiKey(has);
        }
      } catch (e) {
        setBackendStatus('SIMULATED');
      }
    };
    checkStatus();
  }, []);

  const handleOpenKeyPicker = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      setHasApiKey(true);
      setError(null);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (!hasApiKey && !isSignUp) {
      setError("CHAVE_API_REQUERIDA: Configure sua chave do Google AI Studio antes de continuar.");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const result = await register(email, password);
        if (result.success) {
          voiceService.speakInstant("Registro efetuado com sucesso. Aguarde aprovação master.", AIPersonality.JARVIS);
          setError("CONTA CRIADA! Solicite aprovação ao administrador.");
          setTimeout(() => setIsSignUp(false), 3000);
        } else {
          setError(`ERRO_CADASTRO: ${result.message || 'Verifique os dados.'}`);
        }
      } else {
        const success = await signIn(email, password);
        if (success) {
          voiceService.speakInstant("Acesso autorizado. Bem-vindo de volta.", AIPersonality.JARVIS);
        } else {
          setError("ACESSO NEGADO: Credenciais incorretas ou acesso pendente.");
          voiceService.speakInstant("Protocolo de acesso negado.", AIPersonality.JARVIS);
        }
      }
    } catch (err: any) {
      console.error("Auth Failure:", err);
      setError(err.message || "FALHA_CRÍTICA: Erro de comunicação com o núcleo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.05)_0%,transparent_70%)] pointer-events-none"></div>
      
      <div className="w-full max-w-md relative z-10">
        {!hasApiKey && !isSignUp && (
          <div className="mb-8 p-8 bg-amber-500/10 border-2 border-amber-500/30 rounded-[2.5rem] animate-in slide-in-from-top-4">
             <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-500">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <h3 className="text-xs font-black text-white uppercase">Ação Requerida</h3>
             </div>
             <p className="text-[10px] text-zinc-400 uppercase font-bold leading-relaxed mb-6">
               Para garantir que o motor de análise visual Stark funcione, você deve selecionar sua própria chave de API.
             </p>
             <button 
               onClick={handleOpenKeyPicker}
               className="w-full py-4 bg-amber-500 text-black rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/10 active:scale-95 transition-all"
             >
               Configurar Chave do Google AI Studio
             </button>
             <p className="text-[7px] text-amber-500/50 uppercase mt-4 text-center font-bold">Consulte ai.google.dev/gemini-api/docs/billing</p>
          </div>
        )}

        <div className="bg-black/60 backdrop-blur-3xl border-2 border-cyan-500/20 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden transition-all duration-500">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-20"></div>

          <div className="flex flex-col items-center mb-10">
            <div className={`w-20 h-20 border-2 rounded-full flex items-center justify-center mb-6 transition-colors duration-700 ${isSignUp ? 'border-amber-500/30' : 'border-cyan-500/30'}`}>
               <div className={`w-8 h-8 rounded-sm rotate-45 animate-pulse ${isSignUp ? 'bg-amber-400 shadow-[0_0_15px_#fbbf24]' : 'bg-cyan-400 shadow-[0_0_15px_#22d3ee]'}`}></div>
            </div>
            <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">
              {isSignUp ? 'NOVO_OPERADOR' : 'ACESSO_STARK'}
            </h1>
            <div className="flex items-center gap-2 mt-3">
              <div className={`w-1.5 h-1.5 rounded-full ${backendStatus === 'ONLINE' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></div>
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.4em] italic leading-none">
                SISTEMA_{backendStatus}
              </p>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Endereço de Uplink (Email)</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operador@stark.com"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-mono text-sm focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-zinc-700"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Código Biométrico (Senha)</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-mono text-sm focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-zinc-700"
                required
              />
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-[9px] font-black uppercase text-red-400 text-center animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-5 text-black rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 disabled:opacity-50 ${
                isSignUp ? 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/20' : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-500/20'
              }`}
            >
              {loading ? 'SINCRONIZANDO...' : isSignUp ? 'SOLICITAR ACESSO' : 'INICIAR PROTOCOLO'}
            </button>
          </form>

          <button 
             onClick={() => { setIsSignUp(!isSignUp); setError(null); }} 
             className="w-full mt-8 text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-colors"
           >
             {isSignUp ? '← VOLTAR AO LOGIN' : 'NÃO POSSUI UM PLANO? REGISTRE-SE'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
