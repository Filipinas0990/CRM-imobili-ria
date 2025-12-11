import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  UserCheck,
  Calendar,
  DollarSign,
  BarChart3,
  Settings,
  Home,
  LogOut
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Leads", href: "/dashboard/leads", icon: Users },
  { name: "Imóveis/Lotes", href: "/dashboard/imoveis", icon: Building2 },
  { name: "Serviços", href: "/dashboard/servicos", icon: Briefcase },
  { name: "Clientes", href: "/dashboard/clientes", icon: UserCheck },
  { name: "Visitas", href: "/dashboard/visitas", icon: Home },
  { name: "Financeiro", href: "/dashboard/financeiro", icon: DollarSign },
  { name: "Agenda", href: "/dashboard/agenda", icon: Calendar },
  { name: "Relatórios", href: "/dashboard/relatorios", icon: BarChart3 },
  { name: "Configurações", href: "/dashboard/configuracoes", icon: Settings },
];

export const Sidebar = () => {
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
    <div className="flex h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex h-16 items-center justify-center border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-foreground">CRM Imóveis</h1>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === "/dashboard"}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sair
        </Button>
      </div>
    </div>
  );
};
