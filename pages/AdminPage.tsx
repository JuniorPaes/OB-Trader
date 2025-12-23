
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { voiceService } from '../services/voiceService';
import { apiService, RealUser } from '../services/apiService';
import { AIPersonality } from '../types';
import { supabase, isCloudReady } from '../services/supabase';

const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<RealUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<Record<string, number>>({});
  const [isCloudActive, setIsCloudActive] = useState(isCloudReady());

  const fetchUsers = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await apiService.getAllUsers();
      setUsers(data);
      setError(null);
    } catch (e: any) {
      setError("Falha no uplink com o satélite de dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();

    if (isCloudReady()) {
      const channel = supabase
        .channel('admin_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
          fetchUsers(false);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [fetchUsers]);

  const handleToggleAccess = async (user: RealUser) => {
    const days = selectedDays[user.id] || 30;
    const newStatus = !user.is_approved;
    const success = await apiService.updateUserAccess(user.id, newStatus, days);
    
    if (success) {
      voiceService.speakInstant(
        newStatus ? `Protocolo de acesso liberado para ${user.email.split('@')[0]}.` : "Acesso revogado.",
        AIPersonality.JARVIS
      );
      fetchUsers(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Confirmar exclusão permanente deste operador?")) return;
    const success = await apiService.deleteUser(userId);
    if (success) {
      voiceService.speakInstant("Registro deletado da nuvem.", AIPersonality.JARVIS);
      fetchUsers(false);
    }
  };

  const getRemainingDays = (expiresAt: string | null) => {
    if (!expiresAt) return "VITALÍCIO";
    const diff = new Date(expiresAt).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} dias restantes` : "EXPIRADO";
  };

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-500 pb-20">
      {/* Botão de Voltar Mobile */}
      <div className="lg:hidden mb-4">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase text-zinc-400"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Voltar ao Terminal
        </Link>
      </div>

      <div className="bg-zinc-950/40 p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] border border-purple-500/20 backdrop-blur-3xl flex flex-col md:flex-row justify-between items-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 blur-[100px] pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 relative z-10 text-center md:text-left">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-purple-600 rounded-[1.4rem] md:rounded-[1.8rem] flex items-center justify-center shadow-[0_0_40px_rgba(147,51,234,0.4)] border border-purple-400/30">
            <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <div>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white italic">Gestão <span className="text-purple-500">Cloud</span></h2>
            <div className="flex items-center justify-center md:justify-start gap-3 mt-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${isCloudActive ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
              <p className="text-[8px] md:text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] italic">
                SISTEMA_OPERACIONAL_MASTER
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6 md:mt-0 flex gap-4 hidden md:block">
           <div className="text-right">
              <div className="text-[10px] font-black text-purple-400 uppercase">Status do Link</div>
              <div className="text-xl font-mono font-black text-white">{users.length} <span className="text-zinc-600">OPERADORES</span></div>
           </div>
        </div>
      </div>

      {error && (
        <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-500 text-center font-black uppercase text-[10px] tracking-widest">
           {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:gap-8">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="h-48 flex items-center justify-center border-2 border-dashed border-white/5 rounded-[2.5rem] md:rounded-[3rem] text-zinc-600 uppercase font-black text-xs">
            Nenhum sinal de novos operadores no uplink.
          </div>
        ) : users.map((u) => (
          <div key={u.id} className={`p-6 md:p-10 rounded-[2rem] md:rounded-[3.5rem] border-2 bg-black/40 flex flex-col xl:flex-row items-center justify-between gap-6 md:gap-10 transition-all duration-500 ${u.is_approved ? 'border-white/5' : 'border-purple-500/40 shadow-[0_0_50px_rgba(168,85,247,0.1)] animate-pulse'}`}>
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 flex-1 w-full">
              <div className={`w-16 h-16 md:w-20 md:h-20 rounded-[1.4rem] md:rounded-[1.8rem] flex items-center justify-center border-2 transition-colors flex-shrink-0 ${u.is_approved ? 'border-emerald-500/20 text-emerald-500' : 'border-purple-500/20 text-purple-500'}`}>
                <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              </div>
              <div className="overflow-hidden text-center md:text-left w-full">
                <div className="text-xl md:text-2xl font-black text-white italic tracking-tight truncate mb-2">{u.email}</div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4 mt-2">
                   <span className="text-[8px] md:text-[10px] font-mono text-zinc-600 uppercase tracking-widest hidden sm:block">ID: {u.id.substring(0, 13)}</span>
                   <span className={`px-3 md:px-4 py-1.5 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest ${u.is_approved ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                     {u.is_approved ? '✅ Ativo' : '❌ Bloqueado'}
                   </span>
                   {u.is_approved && (
                     <span className="text-[8px] md:text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                       ⏱️ {getRemainingDays(u.expires_at)}
                     </span>
                   )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 w-full xl:w-auto">
              {!u.is_approved && (
                <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5 w-full sm:w-auto overflow-x-auto">
                  {[7, 30, 999].map(d => (
                    <button 
                      key={d} 
                      onClick={() => setSelectedDays({...selectedDays, [u.id]: d})} 
                      className={`flex-1 sm:flex-none px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-[8px] md:text-[9px] font-black transition-all whitespace-nowrap ${ (selectedDays[u.id] || 30) === d ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-600 hover:text-white' }`}
                    >
                      {d === 999 ? 'VITALÍCIO' : d + ' DIAS'}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-3 md:gap-4 w-full sm:w-auto">
                <button 
                  onClick={() => handleToggleAccess(u)}
                  className={`flex-1 sm:flex-none px-6 md:px-12 py-4 md:py-5 rounded-2xl md:rounded-[2rem] font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all active:scale-95 ${
                    u.is_approved ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20' : 'bg-purple-600 text-white shadow-[0_0_30px_rgba(147,51,234,0.3)] hover:bg-purple-500'
                  }`}
                >
                  {u.is_approved ? 'SUSPENDER' : `APROVAR`}
                </button>
                
                <button 
                  onClick={() => handleDelete(u.id)}
                  className="w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-[2rem] bg-red-600/10 border border-red-600/30 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all active:scale-95 flex-shrink-0"
                  title="Deletar permanentemente"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPage;
