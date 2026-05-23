import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard, Building2, Users, LogOut, ShieldCheck, ChevronRight,
} from "lucide-react";
import { authService } from "@/services/auth.services";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Imobiliárias", href: "/admin/imobiliarias", icon: Building2 },
  { name: "Corretores Autônomos", href: "/admin/corretores", icon: Users },
];

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate("/auth");
    } catch {
      toast.error("Erro ao sair");
    }
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex fixed left-0 top-0 h-full flex-col z-50 transition-all duration-300",
          "bg-[#0f1623] border-r border-white/5",
          expanded ? "w-56" : "w-16"
        )}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-3 h-16 border-b border-white/5 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-red-400" />
          </div>
          {expanded && (
            <div className="overflow-hidden">
              <p className="text-white font-bold text-sm leading-none">Admin</p>
              <p className="text-red-400 text-xs mt-0.5">Painel Kelmor</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.href || location.pathname.startsWith(item.href + "/");
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-2 py-2.5 rounded-xl transition-all duration-150 group",
                  active
                    ? "bg-red-600/20 text-red-400"
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0", active ? "text-red-400" : "")} />
                {expanded && (
                  <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
                    {item.name}
                  </span>
                )}
                {expanded && active && <ChevronRight className="w-3 h-3 ml-auto shrink-0" />}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-2 pb-4 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-2 py-2.5 rounded-xl w-full text-white/40 hover:bg-white/5 hover:text-white transition-all"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {expanded && <span className="text-sm font-medium">Sair</span>}
          </button>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0f1623] border-t border-white/10 flex">
        {navItems.map((item) => {
          const active = location.pathname === item.href || location.pathname.startsWith(item.href + "/");
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 gap-1 text-xs transition-colors",
                active ? "text-red-400" : "text-white/40"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="truncate px-1 text-[10px]">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
