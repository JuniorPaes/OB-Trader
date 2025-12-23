
import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiService, RealUser } from '../services/apiService';
import { supabase, isCloudReady } from '../services/supabase';

interface AuthContextType {
  user: RealUser | null;
  loading: boolean;
  signOut: () => void;
  signIn: (email: string, password?: string) => Promise<boolean>;
  register: (email: string, password?: string) => Promise<boolean>;
  isAdmin: boolean;
}

export const ADMIN_EMAIL = 'juniorpaes07@gmail.com';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<RealUser | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'admin' || user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setUser(profile as RealUser);
        }
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setUser(profile as RealUser);
        } else {
          setUser(null);
        }
      });

      setLoading(false);
      return () => subscription.unsubscribe();
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password?: string) => {
    const data = await apiService.login(email, password);
    if (data) {
      setUser(data.user);
      return true;
    }
    return false;
  };

  const register = async (email: string, password?: string) => {
    return await apiService.register(email, password);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, signIn, register, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
