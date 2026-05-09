import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuthInit } from "@/hooks/use-auth-init";

import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Leads from "./pages/Leads";
import Agenda from "./pages/Agenda";
import Relatorios from "./pages/Relatorios";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import Imoveis from "./pages/Imoveis";
import Loteamentos from "./pages/loteamentos";
import Vendas from "./pages/Vendas";
import Alugueis from "./pages/Alugueis";
import PipelineLeads from "./pages/PipelineLeads";
import Tarafas from "./pages/Tarefas";
import WhatsApp from "./pages/WhatsApp";
import DespesasFixas from "./pages/DespesasFixas";
import Disparo from "./pages/Disparos";
import Automacoes from "./pages/Automacoes";
import Financiamentos from "./pages/Financiamentos";
import Visitas from "./pages/Visitas";
;
import Financeiro from "./pages/Financeiro";
import Visao from "./pages/Visao";
import Configuracoes from "./pages/Configuracoes";
import FollowUps from "./pages/Followups";
import Campanhas from "./pages/Campanhas";
import ImobiliariaRoute from "./components/ImobiliariaRoute";
import DashboardImobiliaria from "./pages/imobiliaria/DashboardImobiliaria";
import MinhaImobiliaria from "./pages/imobiliaria/MinhaImobiliaria";
import Corretores from "./pages/imobiliaria/Corretores";
import Convites from "./pages/imobiliaria/Convites";
import AceitarConvite from "./pages/AceitarConvite";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Inicializa auth uma única vez para toda a aplicação
function AppRoutes() {
  const { isLoading } = useAuthInit();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard/whatsapp" element={<ProtectedRoute><WhatsApp /></ProtectedRoute>} />
      <Route path="/dashboard/Followups" element={<ProtectedRoute><FollowUps /></ProtectedRoute>} />
      <Route path="/dashboard/disparos" element={<ProtectedRoute><Disparo /></ProtectedRoute>} />
      <Route path="/dashboard/despesas" element={<ProtectedRoute><DespesasFixas /></ProtectedRoute>} />
      <Route path="/dashboard/visao" element={<ProtectedRoute><Visao /></ProtectedRoute>} />
      <Route path="/dashboard/tarefas" element={<ProtectedRoute><Tarafas /></ProtectedRoute>} />
      <Route path="/dashboard/vendas" element={<ProtectedRoute><Vendas /></ProtectedRoute>} />
      <Route path="/dashboard/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
      <Route path="/dashboard/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
      <Route path="/dashboard/balanco" element={<ProtectedRoute><Financeiro /></ProtectedRoute>} />
      <Route path="/dashboard/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
      <Route path="/dashboard/pipeline" element={<ProtectedRoute><PipelineLeads /></ProtectedRoute>} />
      <Route path="/dashboard/imoveis" element={<ProtectedRoute><Imoveis /></ProtectedRoute>} />
      <Route path="/dashboard/loteamentos" element={<ProtectedRoute><Loteamentos /></ProtectedRoute>} />
      <Route path="/dashboard/alugueis" element={<ProtectedRoute><Alugueis /></ProtectedRoute>} />
      <Route path="/dashboard/financiamentos" element={<ProtectedRoute><Financiamentos /></ProtectedRoute>} />
      <Route path="/dashboard/visitas" element={<ProtectedRoute><Visitas /></ProtectedRoute>} />

      <Route path="/dashboard/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
      <Route path="/dashboard/automacoes" element={<ProtectedRoute><Automacoes /></ProtectedRoute>} />
      <Route path="/dashboard/campanhas" element={<ProtectedRoute><Campanhas /></ProtectedRoute>} />

      {/* Rotas públicas */}
      <Route path="/aceitar-convite" element={<AceitarConvite />} />

      {/* Rotas da imobiliária */}
      <Route path="/imobiliaria/dashboard" element={<ImobiliariaRoute><DashboardImobiliaria /></ImobiliariaRoute>} />
      <Route path="/imobiliaria/perfil" element={<ImobiliariaRoute><MinhaImobiliaria /></ImobiliariaRoute>} />
      <Route path="/imobiliaria/corretores" element={<ImobiliariaRoute><Corretores /></ImobiliariaRoute>} />
      <Route path="/imobiliaria/convites" element={<ImobiliariaRoute><Convites /></ImobiliariaRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
