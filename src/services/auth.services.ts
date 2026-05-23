import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  creci?: string;
}

interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    name: string;
    email: string;
    tipo_conta: 'corretor' | 'imobiliaria' | 'admin';
    role: 'owner' | 'member' | 'admin';
    organization_id: string | null;
    plano?: string;
    features_ativas?: string[];
    features_bloqueadas?: string[];
  };
}

// Features bloqueadas no plano Basic — fallback caso o backend não retorne
const BLOQUEADAS_POR_PLANO: Record<string, string[]> = {
  basic: ['relatorios', 'whatsapp', 'whatsapp-ia', 'automacoes', 'campanhas'],
  premium: [],
  gold: [],
};

function resolverFeaturesBloqueadas(user: AuthResponse['user']): string[] {
  if (user.features_bloqueadas !== undefined) return user.features_bloqueadas;
  if (user.plano) return BLOQUEADAS_POR_PLANO[user.plano] ?? [];
  return [];
}

export const authService = {
  async login(payload: LoginPayload): Promise<void> {
    const { data } = await api.post<AuthResponse>('/auth/login', payload);
    const userComFeatures = {
      ...data.user,
      features_bloqueadas: resolverFeaturesBloqueadas(data.user),
    };
    useAuthStore.getState().setAuth(userComFeatures, data.access_token);
  },

  async register(payload: RegisterPayload): Promise<void> {
    const { data } = await api.post<AuthResponse>('/auth/register', payload);
    const userComFeatures = {
      ...data.user,
      features_bloqueadas: resolverFeaturesBloqueadas(data.user),
    };
    useAuthStore.getState().setAuth(userComFeatures, data.access_token);
  },

  async logout(): Promise<void> {
    await api.delete('/auth/logout');
    useAuthStore.getState().clearAuth();
  },

  async me(): Promise<void> {
    const { data } = await api.get<AuthResponse['user']>('/auth/me');
    const token = useAuthStore.getState().accessToken;
    if (token) {
      const userComFeatures = {
        ...data,
        features_bloqueadas: resolverFeaturesBloqueadas(data),
      };
      useAuthStore.getState().setAuth(userComFeatures, token);
    }
  },
};