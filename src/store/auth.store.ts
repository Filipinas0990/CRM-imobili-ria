import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
  tipo_conta: 'corretor' | 'imobiliaria' | 'admin';
  role: 'owner' | 'member' | 'admin';
  organization_id: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, token: string) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,

  setAuth: (user, accessToken) => set({ user, accessToken }),

  setAccessToken: (accessToken) => set({ accessToken }),

  clearAuth: () => set({ user: null, accessToken: null }),
}));