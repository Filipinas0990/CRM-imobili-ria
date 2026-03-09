import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Clientes from "./pages/Clientes";
import Leads from "./pages/Leads";
import Agenda from "./pages/Agenda";
import Financeiro from "./pages/Financeiro";
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
import visao from "./pages/Visao";



console.log("Olá mundo! Este é um teste para verificar se o console.log está funcionando corretamente.");

import Financiamentos from "./pages/Financiamentos";
import Visitas from "./pages/Visitas";
import Servicos from "./pages/serviços";

import ClientePerfil from "./pages/ClientePerfil"; // <<< IMPORTAÇÃO ADICIONADA

import { supabase } from "./lib/supabaseClient";
import Balanco from "./pages/Financeiro";
import Visao from "./pages/Visao";

const queryClient = new QueryClient();

function App() {
  async function test() {
    const { data, error } = await supabase.from("teste").select("*");
    console.log("DATA:", data);
    console.log("ERROR:", error);
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <button
            style={{ position: "fixed", top: 10, right: 10, zIndex: 9999 }}
            onClick={test}
          >

          </button>

          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* LISTA DE CLIENTES */}
            <Route
              path="/dashboard/clientes"
              element={
                <ProtectedRoute>
                  <Clientes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/whatsapp"
              element={
                <ProtectedRoute>
                  <WhatsApp />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/despesas"
              element={
                <ProtectedRoute>
                  <DespesasFixas />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/visao"
              element={
                <ProtectedRoute>
                  <Visao />
                </ProtectedRoute>
              }
            />


            <Route
              path="/dashboard/tarefas"
              element={
                <ProtectedRoute>
                  <Tarafas />
                </ProtectedRoute>
              }
            />

            {/* PERFIL INDIVIDUAL DO CLIENTE (NOVA ROTA) */}
            <Route
              path="/dashboard/clientes/:id"
              element={
                <ProtectedRoute>
                  <ClientePerfil />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/vendas"
              element={
                <ProtectedRoute>
                  <Vendas />
                </ProtectedRoute>
              }
            />



            <Route
              path="/dashboard/leads"
              element={
                <ProtectedRoute>
                  <Leads />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/agenda"
              element={
                <ProtectedRoute>
                  <Agenda />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/balanco"
              element={
                <ProtectedRoute>
                  <Balanco />
                </ProtectedRoute>
              }
            />


            <Route
              path="/dashboard/relatorios"
              element={
                <ProtectedRoute>
                  <Relatorios />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/pipeline"
              element={
                <ProtectedRoute>
                  <PipelineLeads />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/imoveis"
              element={
                <ProtectedRoute>
                  <Imoveis />
                </ProtectedRoute>

              }
            />
            <Route
              path="/dashboard/loteamentos"
              element={
                <ProtectedRoute>
                  <Loteamentos />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/alugueis"
              element={
                <ProtectedRoute>
                  <Alugueis />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/financiamentos"
              element={
                <ProtectedRoute>
                  <Financiamentos />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/visitas"
              element={
                <ProtectedRoute>
                  <Visitas />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/servicos"
              element={
                <ProtectedRoute>
                  <Servicos />
                </ProtectedRoute>
              }
            />



            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider >
  );
}

export default App;