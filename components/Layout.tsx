
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { voiceService } from '../services/voiceService';
import { useAuth } from '../context/AuthContext';
import { NAVIGATION } from '../constants';
import { apiService } from '../services/apiService';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pendingCount, setPendingCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isAdmin } = useAuth();

  const isHome = location.pathname === '/';

  useEffect(() => {
    const updateStats = async () => {
      if (isAdmin) {
        try {
          const users = await apiService.getAllUsers();
          const count = users.filter(u => !u.is_approved).length;
          setPendingCount(count);
        } catch (e) {}
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 15000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  // Fechar menu mobile ao mudar de rota
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col font-sans selection:bg-cyan-500/30 text-slate-200 overflow-x-hidden">
      {/* Mobile Nav Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 flex flex-col p-10">
          <div className="flex justify-between items-center mb-16">
            <h2 className="text-2xl font-black text-white italic tracking-tighter">SISTEMA_NAVEGAÇÃO</h2>
            <button onClick={() => setIsMobileMenuOpen(false)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <nav className="flex flex-col gap-6">
            {NAVIGATION.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-2xl font-black uppercase tracking-[0.2em] italic ${location.pathname === item.path ? 'text-cyan-500' : 'text-zinc-600'}`}
              >
                {item.name}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" className={`text-2xl font-black uppercase tracking-[0.2em] italic ${location.pathname === '/admin' ? 'text-purple-500' : 'text-zinc-600'}`}>
                ADMINISTRAÇÃO
              </Link>
            )}
            <button onClick={signOut} className="text-2xl font-black uppercase tracking-[0.2em] italic text-red-500 mt-10 text-left">
              LOGOUT_SISTEMA
            </button>
          </nav>
        </div>
      )}

      <header className="h-20 md:h-24 px-4 md:px-10 flex items-center justify-between border-b border-cyan-500/10 bg-black/40 backdrop-blur-xl relative z-50">
        <div className="flex items-center gap-4">
          {/* Botão de Voltar no Mobile (apenas em sub-páginas) */}
          {!isHome && (
            <button 
              onClick={() => navigate(-1)} 
              className="lg:hidden w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-500 active:scale-90 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
          )}

          <Link to="/" className="flex items-center gap-3 md:gap-5 group">
            <div className="w-10 h-10 md:w-14 md:h-14 border-2 border-cyan-500/30 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.2)] bg-cyan-950/20 group-hover:border-cyan-400 transition-all">
               <div className="w-4 h-4 md:w-6 md:h-6 bg-cyan-400 rounded-sm rotate-45 animate-pulse shadow-[0_0_10px_#22d3ee]"></div>
            </div>
            <div>
              <h1 className="text-lg md:text-3xl font-black tracking-tighter text-white flex items-center gap-2 md:gap-3">
                J.A.R.V.I.S. <span className="hidden xs:inline text-[8px] md:text-[10px] bg-cyan-600 text-black px-2 md:px-3 py-0.5 md:py-1 rounded font-bold uppercase italic tracking-widest">OB_NEURAL</span>
              </h1>
              <p className="text-[7px] md:text-[9px] font-black text-cyan-500/60 uppercase tracking-[0.3em] md:tracking-[0.5em] mt-0.5">STARK INDUSTRIES</p>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-4 bg-black/20 p-1.5 rounded-2xl border border-white/5">
          {NAVIGATION.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                location.pathname === item.path
                  ? 'bg-cyan-500 text-black shadow-lg'
                  : 'text-zinc-500 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.name}
            </Link>
          ))}
          
          {isAdmin && (
            <Link
              to="/admin"
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative flex items-center gap-2 ${
                location.pathname === '/admin'
                  ? 'bg-purple-600 text-white shadow-[0_0_30px_rgba(147,51,234,0.5)] border-purple-400'
                  : 'text-purple-400 border border-purple-500/30 hover:bg-purple-500/10'
              }`}
            >
              GESTÃO_MASTER
              {pendingCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-[8px] font-black animate-bounce shadow-[0_0_10px_red]">
                  {pendingCount}
                </span>
              )}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
          </button>

          <div className="flex items-center gap-2 md:gap-4 h-full">
            <div className="text-right hidden sm:block">
              <div className={`text-[9px] font-black uppercase tracking-wider ${isAdmin ? 'text-purple-400' : 'text-white'}`}>
                {isAdmin ? 'COMANDO_ALPHA' : user?.email?.split('@')[0]}
              </div>
              <button 
                onClick={signOut}
                className="text-[7px] font-black text-zinc-500 uppercase tracking-[0.2em] hover:text-red-500 transition-colors"
              >
                LOGOUT
              </button>
            </div>
            
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/5 border flex items-center justify-center transition-all ${isAdmin ? 'border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'border-white/10'}`}>
              <svg className={`w-4 h-4 md:w-5 md:h-5 ${isAdmin ? 'text-purple-400' : 'text-zinc-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 lg:p-12 max-w-[1700px] mx-auto w-full relative">
         <div className="absolute top-0 left-0 w-full md:w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] md:blur-[180px] pointer-events-none"></div>
         <div className="relative z-10">{children}</div>
      </main>

      <footer className="h-10 md:h-14 border-t border-white/5 flex items-center justify-between px-6 md:px-12 bg-black/60 backdrop-blur-md">
        <div className="text-[7px] md:text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] md:tracking-[0.6em]">INTERFACE: <span className="text-cyan-500">OB_PRECISION</span></div>
        <div className="text-[7px] md:text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] md:tracking-[0.6em] hidden xs:block">UPLINK: <span className="text-emerald-500 font-bold">STABLE</span></div>
      </footer>
    </div>
  );
};

export default Layout;
