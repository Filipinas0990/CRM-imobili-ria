import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth.services";
import { Button } from "@/components/ui/button";

const LogoutButton = () => {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignora erro de rede no logout
    }
    clearAuth();
    navigate("/auth");
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
      <LogOut className="h-4 w-4" />
      Sair
    </Button>
  );
};

export default LogoutButton;
