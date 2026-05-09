import { api } from '@/lib/api';

export type TabStatus = "pendentes" | "atendimento" | "fechados";

export interface WhatsAppConversa {
  id: string;
  telefone: string;
  nome: string | null;
  status: TabStatus;
}

export interface WhatsAppTemplate {
  id: string;
  titulo: string;
  mensagem: string;
}

// backend: pendente | em_atendimento | fechado
// frontend: pendentes | atendimento | fechados
function toFrontendStatus(s: string): TabStatus {
  if (s === 'em_atendimento') return 'atendimento';
  if (s === 'fechado') return 'fechados';
  return 'pendentes';
}

function toBackendStatus(s: TabStatus): string {
  if (s === 'atendimento') return 'em_atendimento';
  if (s === 'fechados') return 'fechado';
  return 'pendente';
}

export const whatsappService = {
  async getConversas(): Promise<WhatsAppConversa[]> {
    try {
      const { data } = await api.get<Array<{
        id: string;
        telefone: string;
        nome: string | null;
        status: string;
      }>>('/whatsapp/conversas');
      return (data ?? []).map((c) => ({
        id: c.id,
        telefone: c.telefone,
        nome: c.nome,
        status: toFrontendStatus(c.status),
      }));
    } catch {
      return [];
    }
  },

  async updateConversaStatus(id: string, status: TabStatus): Promise<void> {
    try {
      await api.patch(`/whatsapp/conversas/${id}`, { status: toBackendStatus(status) });
    } catch {
      // silent — best effort
    }
  },

  // Placeholder — backend templates endpoint not yet implemented
  async getTemplates(): Promise<WhatsAppTemplate[]> {
    return [];
  },
};
