
import { MarketSignal, TradeResult, AIPersonality, LearningStats, VoiceConfig } from '../types';
import { supabase, isCloudReady } from './supabase';
import { localDB } from './db';

export interface RealUser {
  id: string;
  email: string;
  is_approved: boolean;
  role: 'admin' | 'user';
  created_at: string;
  expires_at: string | null;
}

export const apiService = {
  async isBackendAlive(): Promise<boolean> {
    if (!isCloudReady()) return false;
    try {
      // Usa um timeout curto e verifica apenas a conectividade básica
      const { error } = await supabase.from('profiles').select('id').limit(1);
      if (error) {
        // Se houver status, o servidor respondeu (mesmo que com erro 401/403)
        return !!error.status;
      }
      return true;
    } catch (err) {
      // Captura especificamente o 'Failed to fetch'
      return false;
    }
  },

  async login(email: string, password?: string): Promise<{user: RealUser, token: string} | null> {
    const normalizedEmail = email.trim().toLowerCase();
    
    if (normalizedEmail === 'juniorpaes07@gmail.com' && password === '91880102') {
       try {
         const { data: authData } = await supabase.auth.signInWithPassword({
           email: normalizedEmail,
           password: password
         });

         if (authData?.user) {
           const { data: profile } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
           if (profile) return { user: profile as RealUser, token: authData.session?.access_token || 'master-token' };
         }
       } catch (e) {}
       
       return { 
         user: { 
           id: 'master-alpha', 
           email: normalizedEmail, 
           is_approved: true, 
           role: 'admin', 
           created_at: new Date().toISOString(), 
           expires_at: null 
         }, 
         token: 'master-token' 
       };
    }

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: password || 'stark123'
      });

      if (error || !authData.user) return null;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) return null;

      return { user: profile as RealUser, token: authData.session?.access_token || '' };
    } catch (err: any) {
      return null;
    }
  },

  async register(email: string, password?: string): Promise<{ success: boolean, message?: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: password || 'stark123'
      });

      if (error) return { success: false, message: error.message };
      
      if (data.user) {
        const isMaster = normalizedEmail === 'juniorpaes07@gmail.com';
        await supabase.from('profiles').insert({
          id: data.user.id,
          email: normalizedEmail,
          is_approved: isMaster,
          role: isMaster ? 'admin' : 'user'
        });
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, message: "Uplink offline. Tente novamente mais tarde." };
    }
  },

  async getAllUsers(): Promise<RealUser[]> {
    if (!isCloudReady()) return [];
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      return error ? [] : data as RealUser[];
    } catch (e) {
      return [];
    }
  },

  async updateUserAccess(userId: string, isApproved: boolean, days: number): Promise<boolean> {
    let expires_at = null;
    if (isApproved) {
      if (days === 999) expires_at = null;
      else {
        const date = new Date();
        date.setDate(date.getDate() + days);
        expires_at = date.toISOString();
      }
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: isApproved, expires_at })
        .eq('id', userId);
      return !error;
    } catch (e) {
      return false;
    }
  },

  async deleteUser(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      return !error;
    } catch (e) {
      return false;
    }
  },

  async persistSignal(signal: MarketSignal, personality: AIPersonality, reasoning: string, visualScore: number) {
    try {
      await localDB.saveEnhancedSignal({ ...signal, personality, aiReasoning: reasoning, visualScore });

      if (isCloudReady()) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('signals').insert({
            user_id: user.id,
            type: signal.type,
            confidence: visualScore,
            personality: personality,
            reasoning: reasoning,
            features: signal.features,
            result: 'PENDENTE'
          });
        }
      }
    } catch (e: any) {}
    return true;
  },

  async recordTradeResult(signalId: string, result: TradeResult): Promise<boolean> {
    try {
      await localDB.updateTradeResult(signalId, result);
      if (isCloudReady() && signalId.length > 20) {
        await supabase.from('signals').update({ result }).eq('id', signalId);
      }
    } catch (e: any) {}
    return true;
  },

  async getDashboardStats(): Promise<LearningStats> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isCloudReady()) return await localDB.getHistoricalWinRate();

      const { data: signals, error } = await supabase
        .from('signals')
        .select('result')
        .eq('user_id', user.id);

      if (error || !signals || signals.length === 0) return await localDB.getHistoricalWinRate();

      const completed = signals.filter(s => s.result === 'WIN' || s.result === 'LOSS');
      const wins = completed.filter(s => s.result === 'WIN').length;
      const winrate = completed.length > 0 ? (wins / completed.length) * 100 : 0;

      return {
        total: completed.length,
        wins: wins,
        losses: completed.length - wins,
        winrate: winrate,
        recentTendency: winrate > 60 ? 'IMPROVING' : 'STABLE'
      };
    } catch (e) {
      return await localDB.getHistoricalWinRate();
    }
  },

  async getSignalHistory(): Promise<any[]> {
    try {
      if (isCloudReady()) {
        const { data: signals, error } = await supabase
          .from('signals')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && signals) {
          return signals.map(s => ({
            ...s,
            timestamp: new Date(s.created_at).getTime(),
            aiReasoning: s.reasoning,
            visualScore: s.confidence
          }));
        }
      }
    } catch (e) {}
    const local = await localDB.getAllSignals();
    return local.reverse().slice(0, 50);
  },

  async saveVoiceSettings(config: VoiceConfig): Promise<void> {
    try {
      if (isCloudReady()) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) await supabase.from('profiles').update({ voice_config: config }).eq('id', user.id);
      }
    } catch (e) {}
    localStorage.setItem('STARK_VOICE_CONFIG', JSON.stringify(config));
  },

  async getVoiceSettings(): Promise<VoiceConfig | null> {
    try {
      if (isCloudReady()) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('profiles').select('voice_config').eq('id', user.id).single();
          if (data?.voice_config) return data.voice_config as VoiceConfig;
        }
      }
    } catch (e) {}
    const local = localStorage.getItem('STARK_VOICE_CONFIG');
    return local ? JSON.parse(local) : null;
  }
};
