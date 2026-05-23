import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { accessToken, user } = useAuthStore();

  if (!accessToken) return <Navigate to="/auth" replace />;
  if (user?.tipo_conta !== "admin") return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

export default AdminRoute;
