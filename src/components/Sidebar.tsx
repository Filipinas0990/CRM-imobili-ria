import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { ChevronRight, Sun, Moon } from "lucide-react";
import { useTheme } from "@/useTheme";
import {
  Banknote,
  Wallet,
  CreditCard,
  Landmark,
  LayoutDashboard,
  Users,
  UserCheck,
  DollarSign,
  BarChart3,
  Home,
  LogOut,
  Filter,
  CheckSquare,
  MessageCircle,
  Rocket,
  Repeat,
  Megaphone
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, darkColor: "text-blue-400", lightColor: "text-white" },
  { name: "Leads", href: "/dashboard/leads", icon: Users, darkColor: "text-green-400", lightColor: "text-white" },
  { name: "Pipeline", href: "/dashboard/Pipeline", icon: Filter, darkColor: "text-purple-400", lightColor: "text-white" },
  { name: "WhatsApp", href: "/dashboard/whatsapp", icon: MessageCircle, darkColor: "text-emerald-400", lightColor: "text-white" },
  {
    name: "Imóveis",
    icon: Home,
    darkColor: "text-orange-400",
    lightColor: "text-white",
    children: [
      { name: "Loteamentos", href: "/dashboard/loteamentos", icon: Landmark, darkColor: "text-orange-400", lightColor: "text-white" },
      { name: "Aluguéis", href: "/dashboard/alugueis", icon: Wallet, darkColor: "text-orange-300", lightColor: "text-white" },
      { name: "Financiamentos", href: "/dashboard/financiamentos", icon: Banknote, darkColor: "text-orange-300", lightColor: "text-white" },
    ],
  },
  {
    name: "Campanhas",
    icon: Megaphone,
    darkColor: "text-emerald-400",
    lightColor: "text-white",
    children: [
      { name: "Disparos", href: "/dashboard/disparos", icon: Rocket, darkColor: "text-emerald-400", lightColor: "text-white" },
      { name: "Follow-ups", href: "/dashboard/Followups", icon: Repeat, darkColor: "text-emerald-300", lightColor: "text-white" },
    ]
  },



  { name: "Clientes", href: "/dashboard/clientes", icon: UserCheck, darkColor: "text-cyan-400", lightColor: "text-white" },
  { name: "Vendas", href: "/dashboard/vendas", icon: CreditCard, darkColor: "text-pink-400", lightColor: "text-white" },
  { name: "Tarefas", href: "/dashboard/tarefas", icon: CheckSquare, darkColor: "text-violet-400", lightColor: "text-white" },
  { name: "Visitas", href: "/dashboard/visitas", icon: Home, darkColor: "text-teal-400", lightColor: "text-white" },
  {
    name: "Fluxo de Caixa",
    icon: DollarSign,
    darkColor: "text-yellow-400",
    lightColor: "text-white",
    children: [
      { name: "Finanças", href: "/dashboard/balanco", icon: DollarSign, darkColor: "text-yellow-400", lightColor: "text-white" },
      { name: "Despesas Fixas", href: "/dashboard/despesas", icon: DollarSign, darkColor: "text-yellow-300", lightColor: "text-white" },
      { name: "Balanço", href: "/dashboard/visao", icon: DollarSign, darkColor: "text-yellow-300", lightColor: "text-white" },
    ],
  },

  { name: "Relatórios", href: "/dashboard/relatorios", icon: BarChart3, darkColor: "text-indigo-400", lightColor: "text-white" },

  { name: "Configurações", href: "/dashboard/configuracoes", icon: Home, darkColor: "text-gray-400", lightColor: "text-white" },
]
  ;

export const Sidebar = () => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao sair");
    } else {
      toast.success("Logout realizado com sucesso");
      navigate("/auth");
    }
  };

  return (
    <aside
      onMouseLeave={() => setOpenMenu(null)}
      className={`
        group fixed left-0 top-0 z-40 h-screen
        w-16 hover:w-64
        transition-all duration-300
        border-r flex flex-col
        overflow-hidden
        ${isDark
          ? "bg-[#1e2536] border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.4)]"
          : "bg-gradient-to-b from-[#0B0F1C] to-[#050816] border-white/5 shadow-[0_0_30px_rgba(59,130,246,0.12)]"
        }
      `}
    >
      {/* LOGO */}
      <div className={`flex h-16 items-center justify-center border-b flex-shrink-0 ${isDark ? "border-white/10" : "border-white/5"}`}>
        <span className="text-xl font-bold tracking-wide text-white opacity-0 group-hover:opacity-100 transition-all duration-300">
          KELMOR CRM
        </span>
      </div>

      {/* MENU */}
      <nav
        className="flex-1 px-2 py-3"
        style={{ overflowY: "auto", scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`nav::-webkit-scrollbar { display: none; }`}</style>

        <div className="flex flex-col gap-1">
          {navigation.map((item) => {
            const isOpen = openMenu === item.name;

            if ("children" in item) {
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

      {/* BOTTOM: Tema + Logout */}
      <div className={`p-2 border-t flex-shrink-0 flex flex-col gap-1 ${isDark ? "border-white/10" : "border-white/5"}`}>

        {/* Botão Tema */}
        <button
          onClick={toggleTheme}
          className={`
            w-full flex items-center gap-3 px-3 py-3
            transition-all rounded-xl text-sm
            ${isDark
              ? "text-slate-300 hover:text-white hover:bg-white/8"
              : "text-white/70 hover:text-white hover:bg-white/5"
            }
          `}
        >
          {isDark ? (
            <Sun className="h-[22px] w-[22px] min-w-[22px] text-yellow-400" />
          ) : (
            <Moon className="h-[22px] w-[22px] min-w-[22px] text-blue-300" />
          )}
          <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap">
            {isDark ? "Modo Claro" : "Modo Escuro"}
          </span>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`
            w-full flex items-center gap-3 px-3 py-3
            transition-all rounded-xl text-sm
            ${isDark
              ? "text-slate-300 hover:text-red-400 hover:bg-red-500/10"
              : "text-white/70 hover:text-white hover:bg-red-500/10"
            }
          `}
        >
          <LogOut className="h-[22px] w-[22px] min-w-[22px] text-red-400" />
          <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap">
            Sair
          </span>
        </button>
      </div>
    </aside>
  );
};