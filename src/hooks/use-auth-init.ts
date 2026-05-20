import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

export function useAuthInit() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const store = useAuthStore.getState();

    if (store.accessToken) {
      setIsLoading(false);
      return;
    }

    api.post<{ access_token: string }>('/auth/refresh')
      .then(async ({ data }) => {
        if (cancelled) return;
        const { data: user } = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${data.access_token}` }
        });
        if (cancelled) return;
        // Usa o token mais recente do store (pode ter sido renovado pelo interceptor)
        const token = useAuthStore.getState().accessToken ?? data.access_token;
        useAuthStore.getState().setAuth(user, token);
      })
      .catch(() => {
        if (cancelled) return;
        if (!useAuthStore.getState().accessToken) {
          useAuthStore.getState().clearAuth();
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { isLoading };
}