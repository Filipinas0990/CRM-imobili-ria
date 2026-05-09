import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

export function useAuthInit() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const store = useAuthStore.getState();

    // Se já tem token em memória (ex: logo após o login), não precisa fazer nada
    if (store.accessToken) {
      setIsLoading(false);
      return;
    }

    // Tenta renovar a sessão via cookie httpOnly
    api.post<{ access_token: string }>('/auth/refresh')
      .then(async ({ data }) => {
        const { data: user } = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${data.access_token}` }
        });
        useAuthStore.getState().setAuth(user, data.access_token);
      })
      .catch(() => {
        // Race condition: o refresh foi disparado ANTES do login completar.
        // Só limpa a auth se o usuário ainda não logou nesse meio tempo.
        if (!useAuthStore.getState().accessToken) {
          useAuthStore.getState().clearAuth();
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return { isLoading };
}