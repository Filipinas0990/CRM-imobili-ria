import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";

interface ImobiliariaRouteProps {
  children: React.ReactNode;
}

const ImobiliariaRoute = ({ children }: ImobiliariaRouteProps) => {
  const { accessToken, user } = useAuthStore();

  if (!accessToken) {
    return <Navigate to="/auth" replace />;
  }

  if (user?.tipo_conta !== 'imobiliaria') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ImobiliariaRoute;
