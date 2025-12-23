
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { TradeResult } from '../types';

const AnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState({ winrate: 0, total: 0, wins: 0, losses: 0 });
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const s = await apiService.getDashboardStats();
      const history = await apiService.getSignalHistory();
      setStats(s);
      setSignals(history);
    } catch (e) {
      console.error("Erro ao carregar dados da nuvem.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700 pb-20">
      {/* Mobile Navigation Bar */}
      <div className="lg:hidden flex justify-between items-center mb-4">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase text-zinc-400"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Terminal
        </Link>
        <button onClick={loadData} className="w-12 h-12 bg-cyan-600/20 border border-cyan-500/30 rounded-2xl flex items-center justify-center text-cyan-400 active:scale-90 transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white italic">Cloud <span className="text-cyan-500">Analytics</span></h2>
          <p className="text-zinc-500 text-[8px] md:text-[10px] font-bold uppercase tracking-[0.3em] mt-2 italic">Histórico de Performance_Neural</p>
        </div>
        <div className="hidden md:flex gap-4">
          <button onClick={loadData} className="px-6 py-3 bg-cyan-600 text-black text-[9px] font-black uppercase rounded-xl hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-600/20">Sincronizar Agora</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
        <div className="p-6 md:p-8 bg-[#0c0c0e] rounded-[2rem] md:rounded-[2.5rem] border border-white/5 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500"></div>
          <span className="text-[8px] md:text-[10px] font-black text-zinc-600 uppercase block mb-2 md:mb-4">Winrate</span>
          <div className="text-3xl md:text-6xl font-black text-white italic">{stats.winrate.toFixed(1)}%</div>
        </div>
        <div className="p-6 md:p-8 bg-[#0c0c0e] rounded-[2rem] md:rounded-[2.5rem] border border-white/5 shadow-2xl">
          <span className="text-[8px] md:text-[10px] font-black text-zinc-600 uppercase block mb-2 md:mb-4">Total</span>
          <div className="text-3xl md:text-6xl font-black text-white italic">{stats.total}</div>
        </div>
        <div className="p-6 md:p-8 bg-[#0c0c0e] rounded-[2rem] md:rounded-[2.5rem] border border-white/5 shadow-2xl">
          <span className="text-[8px] md:text-[10px] font-black text-zinc-600 uppercase block mb-2 md:mb-4">Wins</span>
          <div className="text-3xl md:text-6xl font-black text-emerald-500 italic">{stats.wins}</div>
        </div>
        <div className="p-6 md:p-8 bg-[#0c0c0e] rounded-[2rem] md:rounded-[2.5rem] border border-white/5 shadow-2xl">
          <span className="text-[8px] md:text-[10px] font-black text-zinc-600 uppercase block mb-2 md:mb-4">Losses</span>
          <div className="text-3xl md:text-6xl font-black text-red-500 italic">{stats.losses}</div>
        </div>
      </div>

      <div className="bg-[#0c0c0e] rounded-[2.5rem] md:rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
        <div className="px-6 md:px-10 py-6 md:py-8 border-b border-white/5 bg-white/[0.01]">
           <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic">Logs_Inteligência_Neural</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-black/40 text-zinc-500 font-black uppercase text-[8px] md:text-[9px] tracking-[0.2em]">
              <tr>
                <th className="px-6 md:px-10 py-4 md:py-6">Timestamp</th>
                <th className="px-6 md:px-10 py-4 md:py-6">IA</th>
                <th className="px-6 md:px-10 py-4 md:py-6">Raciocínio</th>
                <th className="px-6 md:px-10 py-4 md:py-6 text-center">Score</th>
                <th className="px-6 md:px-10 py-4 md:py-6 text-right">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                 <tr><td colSpan={5} className="px-10 py-20 text-center text-zinc-600 font-black uppercase animate-pulse">Sincronizando com Banco de Dados...</td></tr>
              ) : signals.length === 0 ? (
                <tr><td colSpan={5} className="px-10 py-20 text-center text-zinc-700 font-black uppercase italic">Nenhuma operação registrada na nuvem.</td></tr>
              ) : signals.map(signal => (
                <tr key={signal.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 md:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-bold text-white">
                    <span className="block text-zinc-400 font-mono mb-1">{signal.id.substring(0, 8).toUpperCase()}</span>
                    <span className="text-[8px] text-zinc-600">{new Date(signal.timestamp).toLocaleString([], {hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'})}</span>
                  </td>
                  <td className="px-6 md:px-10 py-4 md:py-6">
                    <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${signal.personality === 'JARVIS' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-red-500/10 text-red-400'}`}>
                      {signal.personality}
                    </span>
                  </td>
                  <td className="px-6 md:px-10 py-4 md:py-6 max-w-xs text-[10px] md:text-[11px] text-zinc-400 italic font-medium">"{signal.aiReasoning}"</td>
                  <td className="px-6 md:px-10 py-4 md:py-6 text-[10px] md:text-[11px] font-black text-white text-center">{signal.visualScore}%</td>
                  <td className="px-6 md:px-10 py-4 md:py-6 text-right">
                    <span className={`px-3 md:px-4 py-1.5 rounded-lg text-[8px] md:text-[9px] font-black uppercase inline-block ${
                      signal.result === TradeResult.WIN ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 
                      signal.result === TradeResult.LOSS ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      {signal.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
