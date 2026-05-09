import { useNavigate } from "react-router-dom";
import {
  TrendingUp, Bell, LayoutDashboard, DollarSign,
  Calendar, BarChart3, Target, Users, Building2,
  CheckCircle2, ArrowRight, MessageSquare, Zap, ChevronRight,
} from "lucide-react";

const BLUE = "#1653cc";
const BLUE_DARK = "#0f3fa8";
const NAVY = "#0d1e3d";

const KelmorWordmark = ({ light = false }: { light?: boolean }) => (
  <div className="flex items-center gap-1.5">
    <span
      style={{
        fontWeight: 900,
        letterSpacing: "-0.04em",
        fontSize: "1.5rem",
        lineHeight: 1,
        color: light ? "#fff" : BLUE,
      }}
    >
      kelmor
    </span>
    <span
      style={{
        background: "#1e2a3a",
        width: 18,
        height: 18,
        borderRadius: 4,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg viewBox="0 0 12 12" width="9" height="9" fill="none">
        <path d="M2 10L6 2L10 10L6 7.5L2 10Z" fill="white" />
      </svg>
    </span>
  </div>
);

const MockDashboard = () => (
  <div
    className="rounded-2xl overflow-hidden shadow-2xl border border-white/10"
    style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(16px)" }}
  >
    {/* Top bar */}
    <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/10">
      <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
      <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
      <span className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
      <span className="ml-3 text-white/40 text-xs font-mono">kelmor.online/dashboard</span>
    </div>
    {/* Stats row */}
    <div className="grid grid-cols-4 gap-2 p-4">
      {[
        { label: "Leads", value: "248", up: true },
        { label: "Visitas", value: "34", up: true },
        { label: "Vendas", value: "R$ 1.2M", up: true },
        { label: "Conversão", value: "18%", up: false },
      ].map(({ label, value, up }) => (
        <div key={label} className="rounded-lg p-2.5" style={{ background: "rgba(255,255,255,0.07)" }}>
          <p className="text-white/50 text-[10px] mb-1">{label}</p>
          <p className="text-white font-bold text-sm">{value}</p>
          <p className={`text-[10px] mt-0.5 ${up ? "text-emerald-400" : "text-red-400"}`}>
            {up ? "▲" : "▼"} {up ? "+12%" : "-3%"}
          </p>
        </div>
      ))}
    </div>
    {/* Chart area */}
    <div className="px-4 pb-2">
      <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.05)" }}>
        <p className="text-white/40 text-[10px] mb-3">Vendas — últimos 6 meses</p>
        <div className="flex items-end gap-1.5 h-16">
          {[40, 65, 45, 80, 55, 90].map((h, i) => (
            <div key={i} className="flex-1 rounded-t-sm" style={{
              height: `${h}%`,
              background: i === 5
                ? "rgba(255,255,255,0.85)"
                : `rgba(255,255,255,${0.15 + i * 0.06})`,
            }} />
          ))}
        </div>
        <div className="flex justify-between mt-1.5">
          {["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"].map(m => (
            <span key={m} className="text-white/30 text-[9px]">{m}</span>
          ))}
        </div>
      </div>
    </div>
    {/* Pipeline mini */}
    <div className="px-4 pb-4">
      <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.05)" }}>
        <p className="text-white/40 text-[10px] mb-2">Pipeline de leads</p>
        <div className="flex gap-1">
          {[
            { label: "Novo", w: "40%", color: "rgba(99,179,237,0.6)" },
            { label: "Qualif.", w: "25%", color: "rgba(104,211,145,0.6)" },
            { label: "Proposta", w: "20%", color: "rgba(246,173,85,0.6)" },
            { label: "Fechado", w: "15%", color: "rgba(154,117,234,0.6)" },
          ].map(({ label, w, color }) => (
            <div key={label} style={{ width: w }}>
              <div className="rounded-sm h-2" style={{ background: color }} />
              <p className="text-white/30 text-[8px] mt-1 truncate">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const Landing = () => {
  const navigate = useNavigate();

  const benefits = [
    { icon: TrendingUp, title: "Aumente sua conversão", desc: "Gerencie leads de forma inteligente e converta mais oportunidades em vendas reais." },
    { icon: Bell, title: "Alertas automáticos", desc: "Nunca perca prazos com notificações inteligentes e lembretes de follow-up." },
    { icon: LayoutDashboard, title: "Gestão centralizada", desc: "Leads, imóveis, visitas e vendas em um único painel visual e intuitivo." },
    { icon: DollarSign, title: "Controle financeiro", desc: "Acompanhe comissões, despesas e receitas com relatórios claros e precisos." },
    { icon: MessageSquare, title: "WhatsApp integrado", desc: "Atenda clientes, dispare campanhas e automatize conversas direto no CRM." },
    { icon: BarChart3, title: "Relatórios e BI", desc: "Dashboards visuais com KPIs para decisões rápidas e baseadas em dados." },
  ];

  const features = [
    { icon: Users, title: "Gestão de Leads", desc: "Funil visual completo" },
    { icon: Building2, title: "Imóveis", desc: "Cadastro e documentação" },
    { icon: DollarSign, title: "Financeiro", desc: "Fluxo de caixa" },
    { icon: Calendar, title: "Agenda", desc: "Visitas e lembretes" },
    { icon: BarChart3, title: "Relatórios", desc: "Performance detalhada" },
    { icon: Target, title: "Metas", desc: "Indicadores visuais" },
    { icon: CheckCircle2, title: "Pós-venda", desc: "Relacionamento contínuo" },
    { icon: Zap, title: "Automações", desc: "Fluxos sem código" },
  ];

  return (
    <div className="min-h-screen w-full bg-white">

      {/* ── NAVBAR ── */}
      <nav
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/10"
        style={{ background: NAVY, backdropFilter: "blur(16px)" }}
      >
        <KelmorWordmark light />
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/auth")}
            className="text-white/70 text-sm font-medium hover:text-white transition px-4 py-2 rounded-lg hover:bg-white/10"
          >
            Entrar
          </button>
          <button
            onClick={() => navigate("/auth")}
            className="text-white text-sm font-semibold px-5 py-2 rounded-lg transition"
            style={{ background: BLUE }}
            onMouseEnter={(e) => (e.currentTarget.style.background = BLUE_DARK)}
            onMouseLeave={(e) => (e.currentTarget.style.background = BLUE)}
          >
            Começar grátis
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden pt-32 pb-24 px-6"
        style={{ background: `linear-gradient(160deg, ${NAVY} 0%, #0a1628 55%, #091326 100%)` }}
      >
        {/* Glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-20 pointer-events-none"
          style={{ background: `radial-gradient(circle, ${BLUE} 0%, transparent 70%)` }}
        />

        <div className="relative container mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Copy */}
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 text-sm font-medium"
              style={{ background: "rgba(22,83,204,0.25)", color: "#93b8ff", border: "1px solid rgba(22,83,204,0.4)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              CRM Imobiliário com IA e WhatsApp
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.05] tracking-tight mb-6">
              A IA que{" "}
              <span style={{ color: "#93b8ff" }}>trabalha</span>{" "}
              <br className="hidden lg:block" />
              <span style={{ color: "#93b8ff" }}>por você</span>
            </h1>

            <p className="text-white/60 text-lg leading-relaxed max-w-lg mb-10">
              Automatize follow-ups, gerencie leads, feche mais vendas e
              controle todo seu negócio imobiliário em um só lugar.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/auth")}
                className="inline-flex items-center justify-center gap-2 text-white font-semibold text-base px-8 py-3.5 rounded-xl transition-all"
                style={{ background: BLUE, boxShadow: `0 4px 24px ${BLUE}55` }}
                onMouseEnter={(e) => (e.currentTarget.style.background = BLUE_DARK)}
                onMouseLeave={(e) => (e.currentTarget.style.background = BLUE)}
              >
                Entrar na minha conta
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => window.open("https://wa.me/5564992957973?text=Quero+conhecer+o+Kelmor+CRM", "_blank")}
                className="inline-flex items-center justify-center gap-2 text-white/80 font-semibold text-base px-8 py-3.5 rounded-xl border border-white/15 hover:border-white/30 hover:text-white transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                Falar com vendas
              </button>
            </div>

            <p className="text-white/30 text-sm mt-6 flex items-center gap-4">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />Sem cartão de crédito</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />Setup em minutos</span>
            </p>
          </div>

          {/* Mock dashboard */}
          <div className="relative hidden lg:block">
            <div
              className="absolute -inset-4 rounded-3xl opacity-30 blur-2xl"
              style={{ background: `radial-gradient(circle, ${BLUE}, transparent 70%)` }}
            />
            <div className="relative">
              <MockDashboard />
            </div>
          </div>
        </div>
      </section>

      {/* ── LOGOS / SOCIAL PROOF ── */}
      <section className="py-10 px-6 border-b border-slate-100">
        <div className="container mx-auto max-w-5xl text-center">
          <p className="text-slate-400 text-sm mb-6 font-medium uppercase tracking-widest">
            Confiado por imobiliárias em todo o Brasil
          </p>
          <div className="flex flex-wrap justify-center gap-8 items-center opacity-40">
            {["Imobiliária Alpha", "Grupo Beta Imóveis", "Casa & Vida", "Prime Imóveis", "RealEstate Co."].map(name => (
              <span key={name} className="text-slate-500 font-bold text-sm">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section className="py-24 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p
              className="text-sm font-semibold uppercase tracking-widest mb-3"
              style={{ color: BLUE }}
            >
              Por que o Kelmor?
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Tudo que sua imobiliária precisa
            </h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">
              Desenvolvido para corretores e gestores que querem escalar com tecnologia
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group p-6 rounded-2xl border border-slate-100 hover:border-blue-100 hover:shadow-lg hover:shadow-blue-50 transition-all duration-200"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: `${BLUE}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color: BLUE }} />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AUTOMATION HIGHLIGHT ── */}
      <section
        className="py-24 px-6"
        style={{ background: `linear-gradient(160deg, ${NAVY} 0%, #0c1e40 100%)` }}
      >
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 text-sm font-medium"
              style={{ background: "rgba(22,83,204,0.25)", color: "#93b8ff", border: "1px solid rgba(22,83,204,0.4)" }}
            >
              <Zap className="w-3.5 h-3.5" />
              Automação inteligente
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">
              O sistema trabalha enquanto você vende
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Fluxos automáticos de WhatsApp, lembretes de visita, follow-ups e
              muito mais — tudo configurado sem escrever uma linha de código.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { icon: MessageSquare, title: "WhatsApp automático", desc: "Responda leads, envie lembretes e dispare campanhas direto pelo CRM." },
              { icon: Zap, title: "Fluxos sem código", desc: "Crie automações visuais com nós de mensagem, menu e transferência." },
              { icon: Bell, title: "Lembretes de visita", desc: "24h antes da visita o cliente recebe confirmação automática via WhatsApp." },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl p-6 border"
                style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.08)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${BLUE}40` }}
                >
                  <Icon className="w-5 h-5 text-blue-300" />
                </div>
                <h3 className="text-white font-bold mb-2">{title}</h3>
                <p className="text-white/55 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: BLUE }}>
              Módulos
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Funcionalidades completas
            </h2>
            <p className="text-slate-500 mt-3">Tudo que você precisa em um único sistema</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group bg-white p-5 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all text-center"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: `${BLUE}12` }}
                >
                  <Icon className="w-5 h-5" style={{ color: BLUE }} />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
                <p className="text-slate-400 text-xs mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section
        className="py-24 px-6"
        style={{ background: `linear-gradient(135deg, ${BLUE} 0%, #0f3fa8 100%)` }}
      >
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">
            Pronto para vender mais?
          </h2>
          <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto">
            Junte-se a centenas de corretores que já usam o Kelmor para
            automatizar processos e fechar mais negócios.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate("/auth")}
              className="inline-flex items-center justify-center gap-2 bg-white font-bold text-base px-10 py-3.5 rounded-xl hover:bg-slate-100 transition"
              style={{ color: BLUE }}
            >
              Acessar o sistema
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.open("https://wa.me/5564992957973?text=Quero+conhecer+o+Kelmor+CRM", "_blank")}
              className="inline-flex items-center justify-center gap-2 text-white font-semibold text-base px-10 py-3.5 rounded-xl border-2 border-white/30 hover:border-white/60 transition"
            >
              <MessageSquare className="w-4 h-4" />
              Falar com a equipe
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: NAVY }} className="py-8 px-6">
        <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <KelmorWordmark light />
          <p className="text-white/30 text-sm">© 2025 Kelmor. Todos os direitos reservados.</p>
          <div className="flex gap-6 text-white/40 text-sm">
            <span className="hover:text-white/70 cursor-pointer transition">Termos</span>
            <span className="hover:text-white/70 cursor-pointer transition">Privacidade</span>
            <span className="hover:text-white/70 cursor-pointer transition">Contato</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
