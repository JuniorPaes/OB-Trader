
import React, { useEffect, useState } from 'react';
import { AnalysisFeatures, LearningStats } from '../types';
import { apiService } from '../services/apiService';

interface MarketFlowCardProps {
  features: AnalysisFeatures | null;
}

const MarketFlowCard: React.FC<MarketFlowCardProps> = ({ features }) => {
  const [stats, setStats] = useState<LearningStats | null>(null);
  
  useEffect(() => {
    const fetchStats = async () => {
      const s = await apiService.getDashboardStats();
      setStats(s);
    };
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const buyP = features?.buyPressure ?? 50;
  const sellP = features?.sellPressure ?? 50;

  return (
    <div className="bg-[#0f172a]/80 backdrop-blur-md p-4 md:p-6 border-t border-cyan-500/10 relative overflow-hidden group rounded-[2rem] md:rounded-none">
      {/* Background Pulse se a IA estiver "expert" */}
      {stats && stats.winrate > 70 && (
        <div className="absolute inset-0 bg-emerald-500/5 animate-pulse pointer-events-none"></div>
      )}

      <div className="flex justify-between items-center mb-4 md:mb-6 relative z-10">
        <div className="flex items-center gap-2 md:gap-3">
           <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${stats && stats.winrate > 50 ? 'bg-cyan-500' : 'bg-amber-500'} animate-pulse`}></div>
           <span className="text-[8px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest">
             NEURAL LEARNING
           </span>
        </div>
        <div className="text-right">
          <span className="text-cyan-400 font-mono text-[8px] md:text-[10px] block font-bold">WR: {stats?.winrate.toFixed(1)}%</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4 relative z-10">
        <div className="bg-black/40 p-2 md:p-3 rounded-xl border border-white/5">
           <span className="text-[7px] md:text-[8px] font-black text-zinc-500 block mb-1 uppercase">Trades</span>
           <div className="flex items-end gap-1">
              <div className="text-lg md:text-xl font-black text-white">{stats?.total ?? 0}</div>
           </div>
        </div>
        <div className="bg-black/40 p-2 md:p-3 rounded-xl border border-white/5">
           <span className="text-[7px] md:text-[8px] font-black text-zinc-500 block mb-1 uppercase">Stability</span>
           <div className="flex items-end gap-1">
              <div className={`text-sm md:text-xl font-black ${stats && stats.winrate < 50 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {stats && stats.winrate > 80 ? 'HIGH' : stats && stats.winrate > 50 ? 'STABLE' : 'LOW'}
              </div>
           </div>
        </div>
      </div>

      <div className="relative h-1.5 md:h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5 shadow-inner z-10">
        <div 
          className="absolute left-0 h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-1000 ease-out" 
          style={{ width: `${sellP}%` }}
        ></div>
        <div 
          className="absolute right-0 h-full bg-gradient-to-l from-emerald-600 to-emerald-400 transition-all duration-1000 ease-out" 
          style={{ width: `${buyP}%` }}
        ></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-white/20 z-10"></div>
      </div>

      <div className="mt-3 flex justify-between text-[6px] md:text-[8px] font-black text-zinc-600 uppercase tracking-widest z-10">
         <span className={sellP > 60 ? 'text-red-500' : ''}>Bear Momentum</span>
         <span className={buyP > 60 ? 'text-emerald-500' : ''}>Bull Momentum</span>
      </div>
    </div>
  );
};

export default MarketFlowCard;
