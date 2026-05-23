import { NavLink } from "@/components/NavLink";
import { useNavigate, useLocation } from "react-router-dom";
import { authService } from "@/services/auth.services";
import { toast } from "sonner";
import { useState } from "react";
import { ChevronRight, Sun, Moon, Lock } from "lucide-react";
import { useTheme } from "@/useTheme";
import { useAuthStore } from "@/store/auth.store";
import {
  Banknote, Wallet, CreditCard, Landmark, LayoutDashboard,
  Users, UserCheck, DollarSign, BarChart3, Home, LogOut,
  Filter, CheckSquare, MessageCircle, Rocket, Repeat,
  Megaphone, Mic, Headphones, Bot, Calendar, Zap,
  Building2, Mail, TrendingUp, UserCircle,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, darkColor: "text-blue-400", lightColor: "text-white" },
  {
    name: "Leads", icon: Users, darkColor: "text-cyan-400", lightColor: "text-white", featureKey: "leads",
    children: [
      { name: "Lista de Leads", href: "/dashboard/leads", icon: UserCheck, darkColor: "text-cyan-400", lightColor: "text-white" },
      { name: "Pipeline", href: "/dashboard/Pipeline", icon: Filter, darkColor: "text-cyan-300", lightColor: "text-white" },
    ]
  },
  {
    name: "Atendimento", icon: Bot, darkColor: "text-green-400", lightColor: "text-white",
    somenteCorretor: true, featureKey: "whatsapp",
    children: [
      { name: "Mensagens", href: "/dashboard/whatsapp", icon: MessageCircle, darkColor: "text-green-400", lightColor: "text-white" },
      { name: "Automação", href: "/dashboard/automacoes", icon: Mic, darkColor: "text-green-300", lightColor: "text-white" },
      { name: "Follow-ups", href: "/dashboard/Followups", icon: Repeat, darkColor: "text-emerald-300", lightColor: "text-white" },
    ]
  },
  {
    name: "Imóveis", icon: Home, darkColor: "text-orange-400", lightColor: "text-white", featureKey: "imoveis",
    children: [
      { name: "Loteamentos", href: "/dashboard/loteamentos", icon: Landmark, darkColor: "text-orange-400", lightColor: "text-white" },
      { name: "Aluguéis", href: "/dashboard/alugueis", icon: Wallet, darkColor: "text-orange-300", lightColor: "text-white" },
      { name: "Financiamentos", href: "/dashboard/financiamentos", icon: Banknote, darkColor: "text-orange-300", lightColor: "text-white" },
    ],
  },
  {
    name: "Campanhas", icon: Megaphone, darkColor: "text-emerald-400", lightColor: "text-white",
    somenteCorretor: true, featureKey: "campanhas",
    children: [
      { name: "Disparos", href: "/dashboard/campanhas", icon: Rocket, darkColor: "text-emerald-400", lightColor: "text-white" },
      { name: "Funis", href: "/dashboard/funis", icon: Zap, darkColor: "text-emerald-300", lightColor: "text-white" },
      { name: "Histórico", href: "/dashboard/campanhas/historico", icon: BarChart3, darkColor: "text-emerald-300", lightColor: "text-white" },
    ]
  },
  { name: "I.A.", href: "/dashboard/ia", icon: Bot, darkColor: "text-violet-400", lightColor: "text-white", somenteCorretor: true, featureKey: "whatsapp-ia" },
  { name: "Assistente IA", href: "/dashboard/configuracoes/assistente", icon: Bot, darkColor: "text-violet-400", lightColor: "text-white", somenteCorretor: true },
  { name: "Vendas", href: "/dashboard/vendas", icon: CreditCard, darkColor: "text-pink-400", lightColor: "text-white", featureKey: "vendas" },
  { name: "Tarefas", href: "/dashboard/tarefas", icon: CheckSquare, darkColor: "text-violet-400", lightColor: "text-white", featureKey: "tarefas" },
  { name: "Visitas", href: "/dashboard/visitas", icon: Calendar, darkColor: "text-teal-400", lightColor: "text-white", featureKey: "visitas" },
  {
    name: "Fluxo de Caixa", icon: DollarSign, darkColor: "text-yellow-400", lightColor: "text-white", featureKey: "fluxo-caixa",
    children: [
      { name: "Finanças", href: "/dashboard/balanco", icon: DollarSign, darkColor: "text-yellow-400", lightColor: "text-white" },
      { name: "Despesas Fixas", href: "/dashboard/despesas", icon: DollarSign, darkColor: "text-yellow-300", lightColor: "text-white" },
      { name: "Balanço", href: "/dashboard/visao", icon: DollarSign, darkColor: "text-yellow-300", lightColor: "text-white" },
    ],
  },
  { name: "Relatórios", href: "/dashboard/relatorios", icon: BarChart3, darkColor: "text-indigo-400", lightColor: "text-white", featureKey: "relatorios" },
  { name: "Configurações", href: "/dashboard/configuracoes", icon: Home, darkColor: "text-gray-400", lightColor: "text-white" },
];

const mobileNav = [
  { name: "Início", href: "/dashboard", icon: LayoutDashboard, color: "text-blue-400", activeColor: "#60a5fa" },
  { name: "Leads", href: "/dashboard/leads", icon: Users, color: "text-cyan-400", activeColor: "#22d3ee" },
  { name: "Visitas", href: "/dashboard/visitas", icon: Calendar, color: "text-teal-400", activeColor: "#2dd4bf" },
  { name: "Tarefas", href: "/dashboard/tarefas", icon: CheckSquare, color: "text-violet-400", activeColor: "#a78bfa" },
  { name: "Financeiro", href: "/dashboard/balanco", icon: DollarSign, color: "text-yellow-400", activeColor: "#facc15" },
];

const MobileBottomBar = () => {
  const location = useLocation();
  const { isDark } = useTheme();

  return (
    <nav className={`
      fixed bottom-4 left-4 right-4 z-50
      flex items-center justify-around
      h-16 px-2
      rounded-2xl
      border md:hidden
      shadow-lg
      ${isDark
        ? "bg-[#1e2536] border-white/10"
        : "bg-[#0B0F1C] border-white/10"
      }
    `}>
      {mobileNav.map((item) => {
        const isActive = location.pathname === item.href ||
          (item.href !== "/dashboard" && location.pathname.startsWith(item.href));

        return (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === "/dashboard"}
            className="flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-xl flex-1 transition-all"
            activeClassName=""
          >
            <div className={`
              flex flex-col items-center gap-1 transition-all duration-200
              ${isActive ? "scale-110" : "opacity-60"}
            `}>
              <div className={`
                p-1.5 rounded-xl transition-all duration-200
                ${isActive ? "bg-white/10" : ""}
              `}>
                <item.icon className={`h-5 w-5 ${isActive ? item.color : "text-white/50"}`} />
              </div>
              <span className={`text-[10px] font-medium transition-all ${isActive ? "text-white" : "text-white/40"}`}>
                {item.name}
              </span>
            </div>
          </NavLink>
        );
      })}
    </nav>
  );
};

const imobiliariaNav = [
  { name: "Painel", href: "/imobiliaria/dashboard", icon: Building2, darkColor: "text-blue-400", lightColor: "text-white" },
  { name: "Pipeline equipe", href: "/imobiliaria/pipeline", icon: TrendingUp, darkColor: "text-indigo-400", lightColor: "text-white" },
  { name: "Leads equipe", href: "/imobiliaria/equipe/leads", icon: Users, darkColor: "text-cyan-400", lightColor: "text-white" },
  { name: "Vendas equipe", href: "/imobiliaria/equipe/vendas", icon: DollarSign, darkColor: "text-emerald-400", lightColor: "text-white" },
  { name: "Corretores", href: "/imobiliaria/corretores", icon: UserCircle, darkColor: "text-cyan-300", lightColor: "text-white" },
  { name: "Convites", href: "/imobiliaria/convites", icon: Mail, darkColor: "text-amber-400", lightColor: "text-white" },
  { name: "Minha Imobiliária", href: "/imobiliaria/perfil", icon: Building2, darkColor: "text-blue-300", lightColor: "text-white" },
];

export const Sidebar = () => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [moduloBloqueado, setModuloBloqueado] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuthStore();
  const isImobiliaria = user?.tipo_conta === 'imobiliaria';
  const bloqueados = user?.features_bloqueadas ?? [];

  function isBloqueado(featureKey?: string) {
    if (!featureKey) return false;
    return bloqueados.includes(featureKey);
  }

  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.success("Logout realizado com sucesso");
      navigate("/auth");
    } catch {
      toast.error("Erro ao sair");
    }
  };

  return (
    <>
      <aside
        onMouseLeave={() => setOpenMenu(null)}
        className={`
          group fixed left-0 top-0 z-40 h-screen
          w-16 hover:w-64
          transition-all duration-300
          border-r flex flex-col
          overflow-hidden
          hidden md:flex
          ${isDark
            ? "bg-[#1e2536] border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.4)]"
            : "bg-gradient-to-b from-[#0B0F1C] to-[#050816] border-white/5 shadow-[0_0_30px_rgba(59,130,246,0.12)]"
          }
        `}
      >
        <div className={`flex h-16 items-center justify-center px-3 border-b flex-shrink-0 ${isDark ? "border-white/10" : "border-white/5"}`}>
          <span
            className="text-white text-lg leading-none opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap"
            style={{ fontWeight: 900, letterSpacing: "-0.04em" }}
          >
            kelmor
          </span>
        </div>

        <nav
          className="flex-1 px-2 py-3"
          style={{ overflowY: "auto", scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <style>{`nav::-webkit-scrollbar { display: none; }`}</style>
          <div className="flex flex-col gap-1">
            {isImobiliaria && (
              <div className="mb-1">
                <p className={`text-[10px] font-semibold uppercase tracking-widest px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-all ${isDark ? "text-slate-500" : "text-white/40"}`}>
                  Imobiliária
                </p>
                {imobiliariaNav.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    end={item.href === "/imobiliaria/dashboard"}
                    className={`
                      flex items-center gap-3 rounded-xl px-3 py-3
                      transition-all duration-200
                      ${isDark ? "text-slate-300 hover:bg-white/8 hover:text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}
                    `}
                    activeClassName={
                      isDark
                        ? "bg-indigo-500/20 text-white font-medium border border-indigo-500/30"
                        : "bg-gradient-to-r from-blue-600/30 to-indigo-600/30 text-white font-medium shadow-[0_0_15px_rgba(59,130,246,0.25)]"
                    }
                  >
                    <item.icon className={`h-[22px] w-[22px] min-w-[22px] ${isDark ? item.darkColor : item.lightColor}`} />
                    <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap text-sm">
                      {item.name}
                    </span>
                  </NavLink>
                ))}
                <div className={`mx-3 my-2 border-t ${isDark ? "border-white/10" : "border-white/10"}`} />
              </div>
            )}

            {navigation.filter((item) => !isImobiliaria || !item.somenteCorretor).map((item) => {
              const isOpen = openMenu === item.name;
              const locked = isBloqueado((item as any).featureKey);

              if ("children" in item) {
                if (locked) {
                  return (
                    <button
                      key={item.name}
                      onClick={() => setModuloBloqueado(item.name)}
                      className={`
                        flex w-full items-center justify-between rounded-xl px-3 py-3
                        transition-all duration-200 opacity-50 cursor-pointer
                        ${isDark ? "text-slate-400 hover:bg-white/5" : "text-white/50 hover:bg-white/5"}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-[22px] w-[22px] min-w-[22px] text-white/40" />
                        <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap transition-all text-sm font-medium">
                          {item.name}
                        </span>
                      </div>
                      <Lock className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 text-white/40" />
                    </button>
                  );
                }

                return (
                  <div key={item.name}>
                    <button
                      onClick={() => setOpenMenu(isOpen ? null : item.name)}
                      className={`
                        flex w-full items-center justify-between rounded-xl px-3 py-3
                        transition-all duration-200
                        ${isDark
                          ? `text-slate-300 hover:bg-white/8 hover:text-white ${isOpen ? "bg-white/8 text-white" : ""}`
                          : `text-white/70 hover:bg-white/5 hover:text-white ${isOpen ? "bg-white/5" : ""}`
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={`h-[22px] w-[22px] min-w-[22px] ${isDark ? item.darkColor : item.lightColor}`} />
                        <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap transition-all text-sm font-medium">
                          {item.name}
                        </span>
                      </div>
                      <ChevronRight
                        className={`h-4 w-4 transition-transform duration-200 opacity-0 group-hover:opacity-100
                          ${isOpen ? "rotate-90" : ""}
                          ${isDark ? "text-slate-400" : "text-white"}
                        `}
                      />
                    </button>

                    {isOpen && (
                      <div className={`ml-6 mt-1 flex flex-col gap-0.5 border-l pl-3 ${isDark ? "border-white/10" : "border-white/10"}`}>
                        {item.children.map((child) => (
                          <NavLink
                            key={child.name}
                            to={child.href}
                            className={`
                              flex items-center gap-3 px-3 py-2.5 rounded-lg
                              text-sm transition-all
                              ${isDark ? "text-slate-400 hover:text-white hover:bg-white/8" : "text-white/60 hover:text-white hover:bg-white/5"}
                            `}
                          >
                            {child.icon && (
                              <child.icon className={`h-[18px] w-[18px] min-w-[18px] ${isDark ? child.darkColor : child.lightColor}`} />
                            )}
                            <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap transition-all">
                              {child.name}
                            </span>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              if (locked) {
                return (
                  <button
                    key={item.name}
                    onClick={() => setModuloBloqueado(item.name)}
                    className={`
                      flex w-full items-center justify-between rounded-xl px-3 py-3
                      transition-all duration-200 opacity-50 cursor-pointer
                      ${isDark ? "text-slate-400 hover:bg-white/5" : "text-white/50 hover:bg-white/5"}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-[22px] w-[22px] min-w-[22px] text-white/40" />
                      <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap text-sm">
                        {item.name}
                      </span>
                    </div>
                    <Lock className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 text-white/40" />
                  </button>
                );
              }

              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.href === "/dashboard"}
                  className={`
                    flex items-center gap-3 rounded-xl px-3 py-3
                    transition-all duration-200
                    ${isDark ? "text-slate-300 hover:bg-white/8 hover:text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}
                  `}
                  activeClassName={
                    isDark
                      ? "bg-indigo-500/20 text-white font-medium border border-indigo-500/30"
                      : "bg-gradient-to-r from-blue-600/30 to-indigo-600/30 text-white font-medium shadow-[0_0_15px_rgba(59,130,246,0.25)]"
                  }
                >
                  <item.icon className={`h-[22px] w-[22px] min-w-[22px] ${isDark ? item.darkColor : item.lightColor}`} />
                  <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap text-sm">
                    {item.name}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        <div className={`p-2 border-t flex-shrink-0 flex flex-col gap-1 ${isDark ? "border-white/10" : "border-white/5"}`}>
          <a
            href="https://wa.me/5564993307382"
            target="_blank"
            rel="noopener noreferrer"
            className={`
              w-full flex items-center gap-3 px-3 py-3
              transition-all rounded-xl text-sm
              ${isDark ? "text-slate-300 hover:text-white hover:bg-white/8" : "text-white/70 hover:text-white hover:bg-white/5"}
            `}
          >
            <Headphones className="h-[22px] w-[22px] min-w-[22px] text-green-400" />
            <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap">Suporte</span>
          </a>

          <button
            onClick={toggleTheme}
            className={`
              w-full flex items-center gap-3 px-3 py-3
              transition-all rounded-xl text-sm
              ${isDark ? "text-slate-300 hover:text-white hover:bg-white/8" : "text-white/70 hover:text-white hover:bg-white/5"}
            `}
          >
            {isDark ? <Sun className="h-[22px] w-[22px] min-w-[22px] text-yellow-400" /> : <Moon className="h-[22px] w-[22px] min-w-[22px] text-blue-300" />}
            <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap">
              {isDark ? "Modo Claro" : "Modo Escuro"}
            </span>
          </button>

          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-3 px-3 py-3
              transition-all rounded-xl text-sm
              ${isDark ? "text-slate-300 hover:text-red-400 hover:bg-red-500/10" : "text-white/70 hover:text-white hover:bg-red-500/10"}
            `}
          >
            <LogOut className="h-[22px] w-[22px] min-w-[22px] text-red-400" />
            <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap">Sair</span>
          </button>
        </div>
      </aside>

      <MobileBottomBar />

      {/* Modal — Módulo Bloqueado */}
      <Dialog open={!!moduloBloqueado} onOpenChange={(open) => !open && setModuloBloqueado(null)}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader className="items-center">
            <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-2">
              <Lock className="w-6 h-6 text-violet-500" />
            </div>
            <DialogTitle className="text-xl text-violet-600">{moduloBloqueado}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground leading-relaxed px-2">
            Amplie seu alcance com o módulo <strong>{moduloBloqueado}</strong>. Solicite
            mais informações ao nosso time de suporte e descubra os benefícios exclusivos
            dessa ferramenta.
          </p>
          <div className="flex gap-3 justify-center mt-2">
            <Button variant="outline" className="border-red-300 text-red-500 hover:bg-red-50" onClick={() => setModuloBloqueado(null)}>
              Fechar
            </Button>
            <a
              href="https://wa.me/5564993307382"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-violet-600 hover:bg-violet-700 text-white">
                Falar com Suporte
              </Button>
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};