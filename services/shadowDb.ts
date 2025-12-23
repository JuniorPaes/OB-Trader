
import { AIPersonality } from '../types';

export interface ShadowUser {
  id: string;
  email: string;
  password?: string;
  is_approved: boolean;
  role: 'admin' | 'user';
  created_at: string;
  access_days?: number;
  expires_at?: string | null;
}

const SHADOW_DB_KEY = 'stark_shadow_users';

export const shadowDb = {
  getUsers: (): ShadowUser[] => {
    try {
      const data = localStorage.getItem(SHADOW_DB_KEY);
      let users = data ? JSON.parse(data) : [];
      if (!Array.isArray(users)) users = [];
      
      // Auto-injeção do Admin se não existir
      if (!users.find((u: any) => u.email === 'juniorpaes07@gmail.com')) {
        users.push({
          id: 'master-id',
          email: 'juniorpaes07@gmail.com',
          password: '91880102',
          is_approved: true,
          role: 'admin',
          created_at: new Date().toISOString(),
          expires_at: null
        });
        localStorage.setItem(SHADOW_DB_KEY, JSON.stringify(users));
      }
      
      return users;
    } catch (e) {
      return [];
    }
  },

  saveUser: (email: string, password?: string, role: 'admin' | 'user' = 'user'): ShadowUser => {
    const users = shadowDb.getUsers();
    const normalizedEmail = email.toLowerCase().trim();
    const existingIndex = users.findIndex(u => u.email === normalizedEmail);
    
    if (existingIndex !== -1) {
      return users[existingIndex];
    }

    const newUser: ShadowUser = {
      id: `shadow-${Math.random().toString(36).substr(2, 9)}`,
      email: normalizedEmail,
      password: password,
      is_approved: normalizedEmail === 'juniorpaes07@gmail.com',
      role: normalizedEmail === 'juniorpaes07@gmail.com' ? 'admin' : role,
      created_at: new Date().toISOString(),
      expires_at: normalizedEmail === 'juniorpaes07@gmail.com' ? null : undefined
    };
    
    users.push(newUser);
    localStorage.setItem(SHADOW_DB_KEY, JSON.stringify(users));
    return newUser;
  },

  updateStatus: (userId: string, isApproved: boolean, days: number = 30): void => {
    const users = shadowDb.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index].is_approved = isApproved;
      if (isApproved) {
        if (days === 999) {
          users[index].expires_at = null;
        } else {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + days);
          users[index].expires_at = expiryDate.toISOString();
        }
      }
      localStorage.setItem(SHADOW_DB_KEY, JSON.stringify(users));
    }
  },

  deleteUser: (userId: string): void => {
    const users = shadowDb.getUsers();
    localStorage.setItem(SHADOW_DB_KEY, JSON.stringify(users.filter(u => u.id !== userId)));
  },

  findUser: (email: string): ShadowUser | undefined => {
    return shadowDb.getUsers().find(u => u.email === email.toLowerCase().trim());
  }
};
