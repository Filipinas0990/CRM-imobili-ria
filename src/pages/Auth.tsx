import { useState, useEffect, useRef } from "react";
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
  UserCheck,
  Building2,
  Home,
  PhoneCall,
  Star,
  Eye,
  EyeOff,
  MessageCircle,
  ArrowLeft,
  Headphones,
  ShieldCheck,
} from "lucide-react";
import { Typewriter } from "react-simple-typewriter";
import { authService } from "@/services/auth.services";
import { useAuthStore } from "@/store/auth.store";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const WelcomeTyper = ({
  text, fontSize, fontWeight, color, delay, cursor,
}: {
  text: string; fontSize: number; fontWeight: number;
  color: string; delay: number; cursor: boolean;
}) => {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    const startTimer = setTimeout(() => {
      setStarted(true);
    }, delay);
    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    indexRef.current = 0;
    setDisplayed("");
    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayed(text.slice(0, indexRef.current + 1));
        indexRef.current++;
      } else {
        clearInterval(interval);
      }
    }, 55);
    return () => clearInterval(interval);
  }, [started, text]);

  return (
    <span style={{ fontSize, fontWeight, color, fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em" }}>
      {displayed}
      {cursor && <span className="welcome-cursor" style={{ marginLeft: 2, opacity: 1 }}>|</span>}
    </span>
  );
};

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

const BRAND = "#1653cc";
const BRAND_DARK = "#1147b2";

type UserType = "corretor" | "imobiliaria";

const KelmorLogo = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center gap-2", className)}>
    <span
      style={{ fontWeight: 900, letterSpacing: "-0.05em", fontSize: 24, lineHeight: 1 }}
      className="text-white"
    >
      kelmor
    </span>
    <span
      className="inline-flex items-center justify-center rounded-md text-white"
      style={{ background: "rgba(255,255,255,0.15)", width: 22, height: 22, flexShrink: 0 }}
    >
      <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
        <path d="M2 10L6 2L10 10L6 7.5L2 10Z" fill="white" />
      </svg>
    </span>
  </div>
);

const KelmorLogoBlue = () => (
  <div className="flex items-center gap-2">
    <span
      style={{ fontWeight: 900, letterSpacing: "-0.05em", fontSize: 22, lineHeight: 1, color: BRAND }}
    >
      kelmor
    </span>
    <span
      className="inline-flex items-center justify-center rounded-md"
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
    features: { icon: React.ElementType; title: string; sub: string }[];
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
      { icon: PhoneCall, title: "Follow-up automático", sub: "Com seus leads" },
      { icon: Home, title: "Carteira de imóveis", sub: "Sempre atualizada" },
      { icon: Star, title: "Controle de comissões", sub: "E metas" },
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
      { icon: Users, title: "Gestão de corretores", sub: "Equipes completas" },
      { icon: TrendingUp, title: "Pipeline de vendas", sub: "Visual e intuitivo" },
      { icon: BarChart3, title: "Relatórios e KPIs", sub: "Em tempo real" },
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
  const [showPass, setShowPass] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeLines, setWelcomeLines] = useState<string[]>([]);

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

      const conviteToken = localStorage.getItem("convite_token");
      if (conviteToken) {
        localStorage.removeItem("convite_token");
        navigate(`/aceitar-convite?token=${conviteToken}`);
        return;
      }

      const user = useAuthStore.getState().user;
      const firstName = (user?.name || "").split(" ")[0] || "Corretor";
      const hour = new Date().getHours();
      const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
      const motivation = [
        "Vamos vender muito hoje!",
        "Hoje é dia de fechar negócios!",
        "Sua melhor venda começa agora!",
      ][Math.floor(Math.random() * 3)];

      setWelcomeLines([`${greeting}, ${firstName}!`, motivation]);
      setShowWelcome(true);

      setTimeout(() => {
        if (user?.tipo_conta === "admin") {
          navigate("/admin/dashboard");
        } else if (user?.tipo_conta === "imobiliaria") {
          navigate("/imobiliaria/dashboard");
        } else {
          navigate("/dashboard");
        }
      }, 3800);
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

  if (showWelcome) {
    return (
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "linear-gradient(135deg, #1e60e8 0%, #0f3fa8 60%, #092d82 100%)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;700;900&display=swap');
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
          .welcome-cursor { animation: blink 0.8s step-end infinite; }
          .welcome-line1 { animation: fadeInUp 0.5s ease forwards; }
          .welcome-line2 { opacity: 0; animation: fadeInUp 0.5s ease 1.8s forwards; }
        `}</style>

        {/* Logo */}
        <div style={{ marginBottom: 48, opacity: 0.9 }}>
          <span style={{ color: "white", fontWeight: 900, fontSize: 28, letterSpacing: "-0.05em" }}>
            kelmor
          </span>
        </div>

        <div style={{ textAlign: "center", padding: "0 24px" }}>
          {/* Linha 1 — saudação com nome */}
          <div className="welcome-line1">
            <WelcomeTyper
              text={welcomeLines[0] ?? ""}
              fontSize={42}
              fontWeight={900}
              color="white"
              delay={0}
              cursor
            />
          </div>

          {/* Linha 2 — frase motivacional */}
          <div className="welcome-line2" style={{ marginTop: 12 }}>
            <WelcomeTyper
              text={welcomeLines[1] ?? ""}
              fontSize={22}
              fontWeight={400}
              color="rgba(255,255,255,0.7)"
              delay={1800}
              cursor={false}
            />
          </div>
        </div>

        {/* Barra de progresso */}
        <div
          style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            height: 3,
            background: "rgba(255,255,255,0.15)",
          }}
        >
          <div
            style={{
              height: "100%",
              background: "rgba(255,255,255,0.7)",
              animation: "progress 3.8s linear forwards",
            }}
          />
          <style>{`@keyframes progress { from { width: 0% } to { width: 100% } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[55%_45%]">

      {/* ── PAINEL DA MARCA ── */}
      <div
        className="hidden lg:flex flex-col justify-between px-14 py-12 relative overflow-hidden transition-colors duration-500"
        style={{
          background:
            userType === "corretor"
              ? `linear-gradient(145deg, #1e60e8 0%, #0f3fa8 60%, #092d82 100%)`
              : `linear-gradient(145deg, #1147b2 0%, #07225e 60%, #041640 100%)`,
        }}
      >
        {/* Formas decorativas */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: -120, right: -120,
            width: 400, height: 400,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: -100, left: -100,
            width: 360, height: 360,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            top: "40%", right: 40,
            width: 180, height: 180,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
            transform: "translateY(-50%)",
          }}
        />
        {/* Grade de pontos */}
        <div className="absolute pointer-events-none" style={{ bottom: 80, right: 60, opacity: 0.12 }}>
          {Array.from({ length: 5 }).map((_, r) => (
            <div key={r} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              {Array.from({ length: 6 }).map((_, c) => (
                <div key={c} style={{ width: 4, height: 4, borderRadius: "50%", background: "white" }} />
              ))}
            </div>
          ))}
        </div>

        {/* Wordmark */}
        <div className="relative z-10">
          <KelmorLogo />
        </div>

        {/* Headline central */}
        <div className="relative z-10 py-8">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 text-sm font-medium"
            style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)" }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {panel.badge}
          </div>

          <h1
            className="text-white leading-[1.1] tracking-tight mb-6"
            style={{ fontSize: 46, fontWeight: 900 }}
          >
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

          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, lineHeight: 1.65, maxWidth: 360 }}>
            {panel.description}
          </p>

          <div className="flex flex-col gap-3 mt-10">
            {panel.features.map(({ icon: Icon, title, sub }) => (
              <div key={title} className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 40, height: 40,
                    borderRadius: 11,
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div style={{ color: "rgba(255,255,255,0.95)", fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>{title}</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12.5, marginTop: 1 }}>{sub}</div>
                </div>
              </div>
            ))}

            {/* Card especial — Segurança */}
            <div
              className="flex items-center gap-3 mt-1"
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 14,
                padding: "12px 14px",
              }}
            >
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 40, height: 40,
                  borderRadius: 11,
                  background: "rgba(255,255,255,0.9)",
                }}
              >
                <ShieldCheck className="w-4 h-4" style={{ color: BRAND }} />
              </div>
              <div>
                <div style={{ color: "rgba(255,255,255,0.95)", fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>Segurança e performance</div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12.5, marginTop: 1 }}>Seus dados protegidos com tecnologia de ponta.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé esquerdo */}
        <div className="relative z-10" style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
          © 2026 Kelmor. Todos os direitos reservados.
        </div>
      </div>

      {/* ── PAINEL DO FORMULÁRIO ── */}
      <div
        className="flex items-center justify-center p-6 lg:p-12"
        style={{ background: "#f4f6fb" }}
      >
        <div className="w-full max-w-sm">

          {/* Logo mobile */}
          <div className="flex justify-center mb-8 lg:hidden">
            <KelmorLogoBlue />
          </div>

          {/* Toggle Corretor / Imobiliária */}
          <div
            className="flex items-center p-1 mb-8 gap-1"
            style={{ background: "#e8eaf0", borderRadius: 14 }}
          >
            {(["corretor", "imobiliaria"] as UserType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleSwitchType(type)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 transition-all duration-200",
                  "text-sm font-semibold"
                )}
                style={{
                  height: 38,
                  borderRadius: 11,
                  background: userType === type ? "#ffffff" : "transparent",
                  color: userType === type ? BRAND : "#94a3b8",
                  boxShadow: userType === type ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {type === "corretor" ? <UserCheck className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                {type === "corretor" ? "Corretor" : "Imobiliária"}
              </button>
            ))}
          </div>

          {/* ── FLIP CARD ── */}
          <div style={{ perspective: 1200, width: "100%" }}>
            <div
              style={{
                position: "relative",
                width: "100%",
                transformStyle: "preserve-3d",
                transition: "transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1)",
                transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >

              {/* ── FRENTE: card completo ── */}
              <div style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: 24,
                    padding: "28px 28px 24px",
                    boxShadow: "0 0 0 4px rgba(22, 83, 204, 0.07), 0 24px 60px rgba(22, 83, 204, 0.15), 0 4px 16px rgba(0,0,0,0.05)",
                    border: "1px solid rgba(22, 83, 204, 0.1)",
                    borderTop: "3px solid #1653cc",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Brilho sutil no topo */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0, left: "10%", right: "10%",
                      height: 1,
                      background: "linear-gradient(90deg, transparent, rgba(22,83,204,0.35), transparent)",
                      pointerEvents: "none",
                    }}
                  />

                  {/* Saudação dentro do card */}
                  <div style={{ marginBottom: 22 }}>
                    <h2
                      className="tracking-tight leading-tight"
                      style={{ fontSize: 28, fontWeight: 900, color: "#0f172a" }}
                    >
                      {userType === "corretor" ? (
                        <>Bem-vindo,<br /><span style={{ color: BRAND }}>Corretor!</span></>
                      ) : (
                        <>Acesso da<br /><span style={{ color: BRAND }}>Imobiliária!</span></>
                      )}
                    </h2>
                    <p style={{ color: "#94a3b8", fontSize: 13.5, marginTop: 6 }}>
                      {userType === "corretor"
                        ? "Entre com suas credenciais para acessar o painel."
                        : "Entre com as credenciais da sua imobiliária."}
                    </p>
                  </div>

                  {/* Divisor */}
                  <div style={{ height: 1, background: "#f1f5f9", marginBottom: 20 }} />

                  {/* Formulário */}
                  <form onSubmit={handleAuth}>
                    <div style={{ marginBottom: 16 }}>
                      <Label
                        style={{
                          fontSize: 11, fontWeight: 700, color: "#64748b",
                          textTransform: "uppercase", letterSpacing: "0.06em",
                          display: "block", marginBottom: 6,
                        }}
                      >
                        E-mail
                      </Label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        disabled={loading}
                        className="h-11 bg-slate-50 border-slate-200 text-slate-800 rounded-xl"
                        style={{ fontSize: 14 }}
                      />
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <Label
                        style={{
                          fontSize: 11, fontWeight: 700, color: "#64748b",
                          textTransform: "uppercase", letterSpacing: "0.06em",
                          display: "block", marginBottom: 6,
                        }}
                      >
                        Senha
                      </Label>
                      <div style={{ position: "relative" }}>
                        <Input
                          type={showPass ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          disabled={loading}
                          className="h-11 bg-slate-50 border-slate-200 text-slate-800 rounded-xl pr-11"
                          style={{ fontSize: 14 }}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowPass((v) => !v)}
                          style={{
                            position: "absolute", right: 12, top: "50%",
                            transform: "translateY(-50%)",
                            background: "none", border: "none", cursor: "pointer",
                            color: "#94a3b8", display: "flex", alignItems: "center", padding: 0,
                          }}
                        >
                          {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 font-semibold text-white transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{
                        height: 44, borderRadius: 12, background: BRAND,
                        border: "none", cursor: loading ? "not-allowed" : "pointer",
                        fontSize: 14.5, boxShadow: `0 6px 18px ${BRAND}40`,
                      }}
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

                  {/* Divisor */}
                  <div style={{ height: 1, background: "#f1f5f9", margin: "20px 0 16px" }} />

                  {/* Botão "Não tem conta" dentro do card */}
                  <button
                    type="button"
                    onClick={() => setFlipped(true)}
                    className="w-full flex items-center justify-center gap-2 font-semibold transition-all duration-150"
                    style={{
                      height: 42, borderRadius: 12, background: "#f8fafc",
                      border: "1.5px solid #e2e8f0", color: "#64748b",
                      fontSize: 14, cursor: "pointer",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#f1f5f9"; (e.currentTarget as HTMLButtonElement).style.color = "#334155"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#f8fafc"; (e.currentTarget as HTMLButtonElement).style.color = "#64748b"; }}
                  >
                    Não tem uma conta? Cadastre-se
                  </button>
                </div>
              </div>

              {/* ── VERSO: suporte ── */}
              <div
                style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0,
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: 20,
                    padding: "32px 24px 28px",
                    boxShadow: "0 4px 24px rgba(22, 83, 204, 0.08), 0 1px 4px rgba(0,0,0,0.04)",
                    border: "1px solid rgba(0,0,0,0.06)",
                    textAlign: "center",
                  }}
                >
                  {/* Ícone */}
                  <div
                    style={{
                      width: 64, height: 64, borderRadius: "50%",
                      background: "linear-gradient(135deg, #e8f0fe 0%, #c7d9fb 100%)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      margin: "0 auto 18px",
                    }}
                  >
                    <Headphones size={28} style={{ color: BRAND }} />
                  </div>

                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 10, letterSpacing: "-0.02em" }}>
                    Conta criada pelo suporte
                  </h3>
                  <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.65, marginBottom: 24 }}>
                    As contas no Kelmor são criadas exclusivamente após entrar em contato com nossa equipe. Fale com a gente pelo WhatsApp e a gente te cadastra rapidinho!
                  </p>

                  {/* Botão WhatsApp */}
                  <button
                    type="button"
                    onClick={() =>
                      window.open(
                        "https://wa.me/5564992957973?text=Ol%C3%A1%2C%20quero%20me%20cadastrar%20no%20CRM%20Im%C3%B3veis",
                        "_blank"
                      )
                    }
                    className="w-full flex items-center justify-center gap-2 font-semibold text-white transition-all duration-150"
                    style={{
                      height: 46, borderRadius: 12, background: "#25d366",
                      border: "none", cursor: "pointer", fontSize: 14.5,
                      boxShadow: "0 6px 18px rgba(37,211,102,0.35)",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#1db954"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#25d366"; }}
                  >
                    <MessageCircle size={18} />
                    Falar com o suporte
                  </button>

                  {/* Voltar */}
                  <button
                    type="button"
                    onClick={() => setFlipped(false)}
                    className="mt-3 w-full flex items-center justify-center gap-2 transition-all duration-150"
                    style={{
                      height: 40, borderRadius: 12, background: "transparent",
                      border: "1.5px solid #e2e8f0", color: "#94a3b8",
                      fontSize: 13.5, cursor: "pointer", fontWeight: 600,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#64748b"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; }}
                  >
                    <ArrowLeft size={15} />
                    Voltar para o login
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Rodapé */}
          <div style={{ marginTop: 28, textAlign: "center" }}>
            <p style={{ fontSize: 12, color: "#b0bac9" }}>
              Desenvolvimento @ 2026 — v0.55.0
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 10 }}>
              <button
                type="button"
                title="WhatsApp"
                onClick={() => window.open("https://wa.me/5564992957973?text=Ol%C3%A1%2C%20quero%20me%20cadastrar%20no%20CRM%20Im%C3%B3veis", "_blank")}
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "#25d366", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 3px 8px rgba(37,211,102,0.25)",
                }}
                className="hover:scale-110 active:scale-95 transition-transform duration-150"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </button>
              <button
                type="button"
                title="Instagram"
                onClick={() => window.open("https://instagram.com", "_blank")}
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)",
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 3px 8px rgba(220,39,67,0.25)",
                }}
                className="hover:scale-110 active:scale-95 transition-transform duration-150"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Auth;
