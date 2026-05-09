import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import {
  Loader2,
  ArrowRight,
  Users,
  TrendingUp,
  BarChart3,
  Building2,
  UserCheck,
  Home,
  PhoneCall,
  Star,
} from "lucide-react";
import { Typewriter } from "react-simple-typewriter";
import { authService } from "@/services/auth.services";
import { useAuthStore } from "@/store/auth.store";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

const BRAND = "#1653cc";
const BRAND_DARK = "#1147b2";

type UserType = "corretor" | "imobiliaria";

const KelmorLogo = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center gap-1.5", className)}>
    <span style={{ fontWeight: 900, letterSpacing: "-0.04em" }} className="text-white text-2xl leading-none">
      kelmor
    </span>
    <span
      className="inline-flex items-center justify-center rounded-sm text-white"
      style={{ background: "#1e2a3a", width: 20, height: 20, flexShrink: 0 }}
    >
      <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
        <path d="M2 10L6 2L10 10L6 7.5L2 10Z" fill="white" />
      </svg>
    </span>
  </div>
);

const KelmorLogoBlue = () => (
  <div className="flex items-center gap-1.5">
    <span style={{ fontWeight: 900, letterSpacing: "-0.04em", color: BRAND }} className="text-2xl leading-none">
      kelmor
    </span>
    <span
      className="inline-flex items-center justify-center rounded-sm"
      style={{ background: "#1e2a3a", width: 20, height: 20, flexShrink: 0 }}
    >
      <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
        <path d="M2 10L6 2L10 10L6 7.5L2 10Z" fill="white" />
      </svg>
    </span>
  </div>
);

const panelContent: Record<
  UserType,
  {
    badge: string;
    words: string[];
    description: string;
    features: { icon: React.ElementType; text: string }[];
  }
> = {
  corretor: {
    badge: "Acesso Corretor",
    words: [
      "Nunca foi tão fácil vender imóvel!",
      "Gerencie seus leads com inteligência!",
      "Organize sua carteira de clientes!",
    ],
    description:
      "Tudo que você precisa para fechar mais negócios: leads, visitas, follow-ups e comissões em um só lugar.",
    features: [
      { icon: PhoneCall, text: "Follow-up automático com seus leads" },
      { icon: Home, text: "Carteira de imóveis sempre atualizada" },
      { icon: Star, text: "Controle de comissões e metas" },
    ],
  },
  imobiliaria: {
    badge: "Acesso Imobiliária",
    words: [
      "Gerencie sua equipe de corretores!",
      "Controle total do seu negócio!",
      "Mais organização, mais vendas!",
    ],
    description:
      "CRM completo para imobiliárias: gerencie corretores, leads, contratos e relatórios em tempo real.",
    features: [
      { icon: Users, text: "Gestão completa de corretores e equipes" },
      { icon: TrendingUp, text: "Pipeline de vendas visual e intuitivo" },
      { icon: BarChart3, text: "Relatórios e KPIs em tempo real" },
    ],
  },
};

const Auth = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userType, setUserType] = useState<UserType>("corretor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const panel = panelContent[userType];

  const handleSwitchType = (type: UserType) => {
    setUserType(type);
    setEmail("");
    setPassword("");
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validation = loginSchema.safeParse({ email: email.trim(), password });
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        setLoading(false);
        return;
      }

      await authService.login({ email: email.trim(), password });
      queryClient.clear();
      toast.success("Login realizado com sucesso!");

      const conviteToken = localStorage.getItem("convite_token");
      if (conviteToken) {
        localStorage.removeItem("convite_token");
        navigate(`/aceitar-convite?token=${conviteToken}`);
        return;
      }

      const user = useAuthStore.getState().user;
      navigate(user?.tipo_conta === 'imobiliaria' ? "/imobiliaria/dashboard" : "/dashboard");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Erro inesperado. Tente novamente.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[55%_45%]">

      {/* ── PAINEL DA MARCA ── */}
      <div
        className="hidden lg:flex flex-col justify-between px-14 py-12 relative overflow-hidden transition-all duration-500"
        style={{
          background:
            userType === "corretor"
              ? `linear-gradient(145deg, ${BRAND} 0%, #0f3fa8 100%)`
              : `linear-gradient(145deg, #0f3fa8 0%, #07225e 100%)`,
        }}
      >
        {/* Círculos decorativos */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10 bg-white" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-10 bg-white" />
        <div className="absolute top-1/2 right-8 w-48 h-48 rounded-full opacity-5 bg-white -translate-y-1/2" />

        {/* Wordmark */}
        <div className="relative z-10">
          <KelmorLogo />
        </div>

        {/* Headline central */}
        <div className="relative z-10 py-8">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-8 text-white/80 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {panel.badge}
          </div>

          <h1 className="text-5xl font-black text-white leading-[1.1] tracking-tight mb-6">
            <Typewriter
              key={userType}
              words={panel.words}
              loop={0}
              cursor
              cursorStyle="|"
              typeSpeed={55}
              deleteSpeed={35}
              delaySpeed={2200}
            />
          </h1>

          <p className="text-white/65 text-lg leading-relaxed max-w-sm">
            {panel.description}
          </p>

          {/* Feature pills */}
          <div className="flex flex-col gap-3 mt-10">
            {panel.features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white/75 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé */}
        <div className="relative z-10 text-white/30 text-xs">
          © 2025 Kelmor. Todos os direitos reservados.
        </div>
      </div>

      {/* ── PAINEL DO FORMULÁRIO ── */}
      <div className="flex items-center justify-center bg-[#f7f8fc] p-6 lg:p-12">
        <div className="w-full max-w-sm">

          {/* Logo mobile */}
          <div className="flex justify-center mb-6 lg:hidden">
            <KelmorLogoBlue />
          </div>

          {/* ── TOGGLE DE PERFIL ── */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 mb-8 gap-1">
            <button
              type="button"
              onClick={() => handleSwitchType("corretor")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-semibold transition-all duration-200",
                userType === "corretor"
                  ? "bg-white text-[#1653cc] shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <UserCheck className="w-4 h-4" />
              Corretor
            </button>
            <button
              type="button"
              onClick={() => handleSwitchType("imobiliaria")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-semibold transition-all duration-200",
                userType === "imobiliaria"
                  ? "bg-white text-[#1653cc] shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Building2 className="w-4 h-4" />
              Imobiliária
            </button>
          </div>

          {/* Saudação */}
          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {userType === "corretor" ? (
                <>Bem-vindo,<br /><span style={{ color: BRAND }}>Corretor!</span></>
              ) : (
                <>Acesso da<br /><span style={{ color: BRAND }}>Imobiliária!</span></>
              )}
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              {userType === "corretor"
                ? "Entre com suas credenciais para acessar o painel."
                : "Entre com as credenciais da sua imobiliária."}
            </p>
          </div>

          {/* Card do formulário */}
          <form
            onSubmit={handleAuth}
            className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-4"
          >
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                E-mail
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                disabled={loading}
                className="h-11 bg-slate-50 border-slate-200 focus:border-[#1653cc] focus:ring-[#1653cc]/20 text-slate-800"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Senha
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="h-11 bg-slate-50 border-slate-200 focus:border-[#1653cc] focus:ring-[#1653cc]/20 text-slate-800"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: BRAND, boxShadow: `0 4px 14px ${BRAND}55` }}
              onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = BRAND_DARK; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = BRAND; }}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {userType === "corretor" ? "Entrar como Corretor" : "Entrar como Imobiliária"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Link para cadastro via WhatsApp */}
          <button
            type="button"
            onClick={() =>
              window.open(
                "https://wa.me/5564992957973?text=Ol%C3%A1%2C%20quero%20me%20cadastrar%20no%20CRM%20Im%C3%B3veis",
                "_blank"
              )
            }
            disabled={loading}
            className="mt-4 w-full h-11 rounded-xl border-2 border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:border-slate-300 hover:text-slate-800 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Não tem uma conta? Cadastre-se
          </button>

          <p className="text-center text-xs text-slate-400 mt-6">
            Ao entrar, você concorda com os nossos{" "}
            <span className="underline cursor-pointer" style={{ color: BRAND }}>Termos de Uso</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
