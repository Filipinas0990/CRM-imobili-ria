import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { ChevronRight } from "lucide-react";

import {
  Banknote,

  Wallet,
  CreditCard,
  Landmark
} from "lucide-react";




import {
  LayoutDashboard,
  Users,
  UserCheck,
  Calendar,
  DollarSign,
  BarChart3,
  Settings,
  Home,
  LogOut,

} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Leads", href: "/dashboard/leads", icon: Users },

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
  { name: "Visitas", href: "/dashboard/visitas", icon: Home },
  { name: "Finanças", href: "/dashboard/financeiro", icon: DollarSign },
  { name: "Agenda", href: "/dashboard/agenda", icon: Calendar },
  { name: "Relatórios", href: "/dashboard/relatorios", icon: BarChart3 },
  // { name: "Configurações", href: "/dashboard/configuracoes", icon: Settings },
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
      className="group fixed left-0 top-0 z-40 h-screen w-16 hover:w-64 transition-all duration-300 bg-sidebar border-r border-sidebar-border overflow-hidden"
    >


      {/* LOGO */}
      <div className="flex h-16 items-center justify-center border-b border-sidebar-border">
        <span className="text-xl font-bold text-sidebar-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          CRM Imóveis
        </span>
      </div>

      {/* MENU */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isOpen = openMenu === item.name;

          //  ITEM COM SUBMENU
          if ("children" in item) {
            return (
              <div key={item.name}>
                <button
                  onClick={() => setOpenMenu(isOpen ? null : item.name)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2
    text-sidebar-foreground/80
    hover:bg-sidebar-accent hover:text-sidebar-foreground
    transition-colors
    ${isOpen ? "bg-sidebar-accent/60" : ""}
  `}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 min-w-[20px]" />
                    <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap">
                      {item.name}
                    </span>
                  </div>

                  <ChevronRight
                    className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-90" : ""
                      } opacity-0 group-hover:opacity-100`}
                  />
                </button>
                {isOpen && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.name}
                        to={child.href}
                        className="
  group flex items-center gap-3
  px-2 py-2
  rounded-md
  text-sm
  text-sidebar-foreground/70
  hover:text-sidebar-foreground
  hover:bg-sidebar-accent
  transition-all
"
                      >
                        {child.icon && (
                          <child.icon className="h-5 w-5 min-w-[20px]" />
                        )}

                        <span className="opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {child.name}
                        </span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          // 👉 ITEM NORMAL
          return (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === "/dashboard"}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
              activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
            >
              <item.icon className="h-5 w-5 min-w-[20px]" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                {item.name}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* LOGOUT */}
      <div className="p-2 border-t border-sidebar-border">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full flex items-center gap-3 px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="h-5 w-5 min-w-[20px]" />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Sair
          </span>
        </Button>
      </div>
    </aside>
  );
};
