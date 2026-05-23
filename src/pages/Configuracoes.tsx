import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import {
  Wifi, Zap, MessageSquare, Tag, Send, BarChart3,
  Megaphone, GitBranch, User, Clock, Bell, Shield, Bot,
} from "lucide-react";

interface ConfigTile {
  icon: React.ElementType;
  label: string;
  desc: string;
  href?: string;
  badge?: string;
  color: string;
  bg: string;
}

const SECTIONS: { title: string; tiles: ConfigTile[] }[] = [
  {
    title: "WhatsApp & Comunicação",
    tiles: [
      {
        icon: Wifi,
        label: "Conexão",
        desc: "Conecte e gerencie seu WhatsApp",
        badge: "Em breve",
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50 dark:bg-emerald-900/30",
      },
      {
        icon: MessageSquare,
        label: "Mensagens Rápidas",
        desc: "Templates prontos para atendimento",
        badge: "Em breve",
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-50 dark:bg-blue-900/30",
      },
      {
        icon: GitBranch,
        label: "Automações",
        desc: "Fluxos automáticos de resposta",
        badge: "Em breve",
        color: "text-purple-600 dark:text-purple-400",
        bg: "bg-purple-50 dark:bg-purple-900/30",
      },
      {
        icon: Send,
        label: "Disparos",
        desc: "Envio em massa para contatos",
        badge: "Em breve",
        color: "text-indigo-600 dark:text-indigo-400",
        bg: "bg-indigo-50 dark:bg-indigo-900/30",
      },
      {
        icon: Megaphone,
        label: "Campanhas",
        desc: "Campanhas de marketing",
        badge: "Em breve",
        color: "text-pink-600 dark:text-pink-400",
        bg: "bg-pink-50 dark:bg-pink-900/30",
      },
    ],
  },
  {
    title: "CRM & Leads",
    tiles: [
      {
        icon: Tag,
        label: "Etiquetas",
        desc: "Organize leads por categorias",
        badge: "Em breve",
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-900/30",
      },
      {
        icon: BarChart3,
        label: "Relatórios",
        desc: "Análise de desempenho e vendas",
        badge: "Em breve",
        color: "text-cyan-600 dark:text-cyan-400",
        bg: "bg-cyan-50 dark:bg-cyan-900/30",
      },
      {
        icon: Clock,
        label: "Follow-ups",
        desc: "Agendamentos e lembretes",
        badge: "Em breve",
        color: "text-orange-600 dark:text-orange-400",
        bg: "bg-orange-50 dark:bg-orange-900/30",
      },
    ],
  },
  {
    title: "Assistente IA",
    tiles: [
      {
        icon: Bot,
        label: "Assistente Filipe",
        desc: "Cadastre leads e imóveis pelo WhatsApp",
        href: "/dashboard/configuracoes/assistente",
        color: "text-violet-600 dark:text-violet-400",
        bg: "bg-violet-50 dark:bg-violet-900/30",
      },
    ],
  },
  {
    title: "Conta",
    tiles: [
      {
        icon: User,
        label: "Meu Perfil",
        desc: "Nome, CRECI e dados pessoais",
        badge: "Em breve",
        color: "text-slate-600 dark:text-slate-400",
        bg: "bg-slate-100 dark:bg-slate-800/50",
      },
      {
        icon: Bell,
        label: "Notificações",
        desc: "Preferências de alertas",
        badge: "Em breve",
        color: "text-rose-600 dark:text-rose-400",
        bg: "bg-rose-50 dark:bg-rose-900/30",
      },
      {
        icon: Shield,
        label: "Segurança",
        desc: "Senha e acesso",
        badge: "Em breve",
        color: "text-teal-600 dark:text-teal-400",
        bg: "bg-teal-50 dark:bg-teal-900/30",
      },
      {
        icon: Zap,
        label: "Integrações",
        desc: "Conexão com outras ferramentas",
        badge: "Em breve",
        color: "text-yellow-600 dark:text-yellow-400",
        bg: "bg-yellow-50 dark:bg-yellow-900/30",
      },
    ],
  },
];

export default function Configuracoes() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="md:ml-16 p-4 md:p-8 pb-24 md:pb-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Configurações</h1>
          <p className="text-sm text-muted-foreground mt-1">Personalize seu CRM e gerencie suas preferências</p>
        </div>

        {/* Sections */}
        {SECTIONS.map((section) => (
          <div key={section.title} className="space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              {section.title}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {section.tiles.map((tile) => {
                const isClickable = !!tile.href && !tile.badge;
                return (
                  <button
                    key={tile.label}
                    onClick={() => tile.href && !tile.badge && navigate(tile.href)}
                    disabled={!!tile.badge}
                    className={`
                      relative flex flex-col items-center gap-3 p-5 rounded-2xl border border-border bg-card text-center
                      transition-all duration-150
                      ${isClickable
                        ? "hover:shadow-md hover:border-border/80 hover:-translate-y-0.5 cursor-pointer active:translate-y-0"
                        : "opacity-60 cursor-default"
                      }
                    `}
                  >
                    {tile.badge && (
                      <span className="absolute top-2.5 right-2.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-wide">
                        {tile.badge}
                      </span>
                    )}
                    <div className={`w-12 h-12 rounded-2xl ${tile.bg} flex items-center justify-center`}>
                      <tile.icon className={`w-6 h-6 ${tile.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground leading-tight">{tile.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{tile.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
