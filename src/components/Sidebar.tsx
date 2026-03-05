import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { ChevronRight, Filter, CheckSquare } from "lucide-react";

import {
  Banknote,
  Wallet,
  CreditCard,
  Landmark,
  LayoutDashboard,
  Users,
  UserCheck,
  Calendar,
  DollarSign,
  BarChart3,
  Home,
  LogOut,
} from "lucide-react";
import { i } from "node_modules/framer-motion/dist/types.d-DagZKalS";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Leads", href: "/dashboard/leads", icon: Users },
  { name: "Pipeline", href: "/dashboard/Pipeline", icon: Filter },
  { name: "WhatsApp", href: "/dashboard/whatsapp", icon: Users },
  {
    name: "Imóveis",
    icon: Home,
    children: [
      { name: "Loteamentos", href: "/dashboard/loteamentos", icon: Landmark },
      { name: "Aluguéis", href: "/dashboard/alugueis", icon: Wallet },
      { name: "Financiamentos", href: "/dashboard/financiamentos", icon: Banknote },
    ],
  },
  { name: "Clientes", href: "/dashboard/clientes", icon: UserCheck },
  { name: "Vendas", href: "/dashboard/vendas", icon: CreditCard },
  { name: "Tarefas", href: "/dashboard/tarefas", icon: CheckSquare },
  { name: "Visitas", href: "/dashboard/visitas", icon: Home },
  {
    name: "Fluxo de Caixa",
    icon: DollarSign,
    children: [
      { name: "Balanço", href: "/dashboard/balanco", icon: DollarSign },
      { name: "Despesas Fixas", href: "/dashboard/despesas", icon: DollarSign },
    ]
  },
  //{ name: "Fluxo de Caixa", href: "/dashboard/financeiro", icon: DollarSign },
  // { name: "Agenda", href: "/dashboard/agenda", icon: Calendar },
  { name: "Relatórios", href: "/dashboard/relatorios", icon: BarChart3 },
];

export const Sidebar = () => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const navigate = useNavigate();

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
      className="
        group fixed left-0 top-0 z-40 h-screen
        w-16 hover:w-64
        transition-all duration-300
        bg-gradient-to-b from-[#0B0F1C] to-[#050816]
        border-r border-white/5
        shadow-[0_0_30px_rgba(59,130,246,0.12)]
        overflow-hidden
      "
    >
      {/* LOGO */}
      <div className="flex h-16 items-center justify-center border-b border-white/5">
        <span className="text-xl font-bold tracking-wide text-white opacity-0 group-hover:opacity-100 transition-all duration-300">
          KELMOR CRM
        </span>
      </div>

      {/* MENU */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isOpen = openMenu === item.name;

          // ITEM COM SUBMENU
          if ("children" in item) {
            return (
              <div key={item.name}>
                <button
                  onClick={() => setOpenMenu(isOpen ? null : item.name)}
                  className={`
                    flex w-full items-center justify-between rounded-xl px-3 py-2.5
                    text-white/70
                    hover:bg-white/5 hover:text-white
                    transition-all duration-200
                    ${isOpen ? "bg-white/5" : ""}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 min-w-[20px] text-white" />
                    <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap transition-all">
                      {item.name}
                    </span>
                  </div>

                  <ChevronRight
                    className={`h-4 w-4 text-white transition-transform duration-200 ${isOpen ? "rotate-90" : ""
                      } opacity-0 group-hover:opacity-100`}
                  />
                </button>

                {isOpen && (
                  <div className="ml-6 mt-2 space-y-1 border-l border-white/10 pl-3">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.name}
                        to={child.href}
                        className="
                          flex items-center gap-3 px-3 py-2 rounded-lg
                          text-sm text-white/60
                          hover:text-white hover:bg-white/5
                          transition-all
                        "
                      >
                        {child.icon && (
                          <child.icon className="h-4 w-4 min-w-[16px] text-white" />
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

          // ITEM NORMAL
          return (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === "/dashboard"}
              className="
                flex items-center gap-3 rounded-xl px-3 py-2.5
                text-white/70
                hover:bg-white/5 hover:text-white
                transition-all duration-200
              "
              activeClassName="
                bg-gradient-to-r from-blue-600/30 to-indigo-600/30
                text-white font-medium
                shadow-[0_0_15px_rgba(59,130,246,0.25)]
              "
            >
              <item.icon className="h-5 w-5 min-w-[20px] text-white" />
              <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap">
                {item.name}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* LOGOUT */}
      <div className="p-2 border-t border-white/5">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="
            w-full flex items-center gap-3 px-3 py-2
            text-white/70 hover:text-white
            hover:bg-red-500/10
            transition-all rounded-xl
          "
        >
          <LogOut className="h-5 w-5 min-w-[20px] text-white" />
          <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap">
            Sair
          </span>
        </Button>
      </div>
    </aside>
  );
};
