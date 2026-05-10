import { useNavigate } from "react-router-dom";
import {
  MessageSquare, Building2, Bell, TrendingUp, Users, Clock, ArrowRight, CheckCircle2,
} from "lucide-react";

const BLUE = "#1653cc";
const BLUE_DARK = "#0f3fa8";
const NAVY = "#0d1e3d";
const BG = "#f4f7fb";

const KelmorWordmark = ({ light = false }: { light?: boolean }) => (
  <div className="flex items-center gap-1.5">
    <span style={{ fontWeight: 900, letterSpacing: "-0.04em", fontSize: "1.5rem", lineHeight: 1, color: light ? "#fff" : BLUE }}>
      kelmor
    </span>
    <span style={{ background: "#1e2a3a", width: 18, height: 18, borderRadius: 4, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg viewBox="0 0 12 12" width="9" height="9" fill="none">
        <path d="M2 10L6 2L10 10L6 7.5L2 10Z" fill="white" />
      </svg>
    </span>
  </div>
);

const ChatMock = () => (
  <div className="mt-4 rounded-xl p-3 space-y-2" style={{ background: "#f0f4f8" }}>
    <div className="flex justify-start">
      <div className="bg-white rounded-xl px-3 py-2 shadow-sm max-w-[85%]">
        <p className="text-gray-700 text-xs">Oi, tem apê 2 dorms no centro?</p>
        <p className="text-gray-400 text-[9px] mt-0.5">5 Mai, 14:18</p>
      </div>
    </div>
    <div className="flex justify-end">
      <div className="rounded-xl px-3 py-2 max-w-[85%]" style={{ background: BLUE }}>
        <p className="text-white text-xs">Sim! 87m², 2 dorms, R$ 480.000. Quer ver fotos? ✓✓</p>
        <p className="text-blue-200 text-[9px] mt-0.5">5 Mai, 14:18 · IA</p>
      </div>
    </div>
  </div>
);

const FollowupMock = () => (
  <div className="mt-4 space-y-2">
    <div className="bg-white rounded-xl p-2.5 shadow-sm border border-gray-100">
      <p className="text-gray-700 text-xs">Olá João! Sou a IA da Kelmor. Como posso te ajudar?</p>
    </div>
    <div className="flex items-center gap-2 rounded-xl p-2 border text-xs" style={{ background: "#eff4ff", borderColor: "#d4e0ff" }}>
      <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: BLUE }} />
      <p style={{ color: BLUE }}>Follow-up agendado para amanhã às 09:30</p>
    </div>
    <div className="flex justify-end">
      <div className="rounded-xl px-3 py-2" style={{ background: BLUE }}>
        <p className="text-white text-xs">Te aviso semana que vem! 🔥</p>
        <p className="text-blue-200 text-[9px]">IA · agendado ✓</p>
      </div>
    </div>
  </div>
);

const PipelineMock = () => (
  <div className="mt-4 flex gap-2">
    {[
      { label: "Novo", count: 8, color: "#3b82f6", leads: ["Marina", "João"] },
      { label: "Aguardando", count: 3, color: "#f59e0b", leads: ["Camila"] },
      { label: "Atendendo", count: 4, color: "#10b981", leads: ["Juliana"] },
    ].map(({ label, count, color, leads }) => (
      <div key={label} className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-1.5">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
          <span className="font-semibold text-gray-500 truncate text-[8px]">{label}</span>
          <span className="ml-auto font-bold text-[9px]" style={{ color }}>{count}</span>
        </div>
        {leads.map(l => (
          <div key={l} className="bg-white rounded-lg p-1.5 mb-1 shadow-sm border border-gray-100 flex items-center gap-1">
            <div className="w-4 h-4 rounded-full flex items-center justify-center text-white font-bold text-[7px] flex-shrink-0" style={{ background: color }}>
              {l[0]}
            </div>
            <span className="text-gray-700 font-medium text-[9px] truncate">{l}</span>
          </div>
        ))}
      </div>
    ))}
  </div>
);

const ImoveisMock = () => (
  <div className="mt-4 space-y-2">
    <div className="rounded-xl h-14 flex items-center justify-center" style={{ background: "#e8ecf4" }}>
      <Building2 className="w-6 h-6 text-gray-400" />
    </div>
    <div className="grid grid-cols-3 gap-1.5">
      {["2 dorms", "87m²", "R$ 480k"].map(v => (
        <div key={v} className="bg-white rounded-lg p-1.5 text-center shadow-sm border border-gray-100">
          <span className="text-gray-600 font-semibold text-[9px]">{v}</span>
        </div>
      ))}
    </div>
  </div>
);

const DisparoMock = () => (
  <div className="mt-4 grid grid-cols-3 gap-2">
    {[
      { label: "ENVIADOS", value: "2.845", color: BLUE },
      { label: "RESPOSTAS", value: "461", color: "#10b981" },
      { label: "TAXA", value: "16,2%", color: "#f59e0b" },
    ].map(({ label, value, color }) => (
      <div key={label} className="bg-white rounded-xl p-2 text-center shadow-sm border border-gray-100">
        <p className="font-bold text-xs" style={{ color }}>{value}</p>
        <p className="text-[8px] text-gray-400 mt-0.5">{label}</p>
      </div>
    ))}
  </div>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FeatureCard = ({ num, Icon, title, desc, tag, Mock }: { num: string; Icon: any; title: string; desc: string; tag: string; Mock: any }) => (
  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative">
    <div className="absolute top-4 right-4">
      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "#eff4ff", color: BLUE, border: "1px solid #d4e0ff" }}>
        MOD · {num}
      </span>
    </div>
    <Icon className="w-5 h-5 mb-4" style={{ color: BLUE }} />
    <h3 className="font-black text-lg text-gray-900 mb-2 pr-20">{title}</h3>
    <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
    <Mock />
    <div className="mt-4 flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
      <span className="text-xs font-medium text-gray-500">{tag}</span>
    </div>
  </div>
);

const FEATURES = [
  { num: "01", Icon: MessageSquare, title: "Atendimento no WhatsApp", desc: "Responde em segundos com base nos seus imóveis, qualifica o lead pela conversa e define a temperatura em tempo real.", tag: "< 10s · 24/7", Mock: ChatMock },
  { num: "02", Icon: Bell, title: "Follow-up dinâmico", desc: "A IA lê o contexto, decide o melhor momento de voltar a contatar e conduz o lead até ele esquentar. Sem planilha, sem lembrete.", tag: "Nenhum lead esquecido", Mock: FollowupMock },
  { num: "03", Icon: Users, title: "Pipeline de leads", desc: "Funil visual completo. Mova leads entre etapas, veja o histórico e saiba exatamente onde cada negócio está.", tag: "Zero esforço manual", Mock: PipelineMock },
  { num: "04", Icon: Building2, title: "Gestão de imóveis", desc: "Cadastre imóveis com textos, fotos e documentos. A IA organiza o portfólio e responde sobre eles automaticamente.", tag: "Portfólio sempre atualizado", Mock: ImoveisMock },
  { num: "05", Icon: TrendingUp, title: "Disparo em massa com IA", desc: "Envie campanhas em escala e, quando alguém responder, a IA assume a conversa imediatamente. Massa com atendimento 1 a 1.", tag: "Escala sem perder qualidade", Mock: DisparoMock },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full" style={{ background: BG }}>

      {/* NAVBAR */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 flex items-center justify-between px-6 md:px-10 py-4">
        <KelmorWordmark />
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-500 font-medium">
          <span className="hover:text-gray-800 cursor-pointer transition">Funcionalidades</span>
          <span className="hover:text-gray-800 cursor-pointer transition">Como funciona</span>
          <span className="hover:text-gray-800 cursor-pointer transition">Planos</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/auth")}
            className="hidden sm:block text-gray-600 text-sm font-medium hover:text-gray-900 transition px-4 py-2"
          >
            Entrar
          </button>
          <button
            onClick={() => navigate("/auth")}
            className="text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
            style={{ background: BLUE }}
            onMouseEnter={e => (e.currentTarget.style.background = BLUE_DARK)}
            onMouseLeave={e => (e.currentTarget.style.background = BLUE)}
          >
            Agendar demo →
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-36 pb-28 px-6" style={{ background: BG }}>
        <div className="container mx-auto max-w-5xl text-center">
          <h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6">
            <span style={{ color: NAVY }}>CRM é pouco.</span>
            <br />
            <span style={{ color: "#9aa5b4" }}>Sua imobiliária precisa de</span>
            <br />
            <span style={{ color: BLUE }}>IA em cada etapa.</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Atendimento no WhatsApp, follow-up automático, pipeline de leads, gestão de
            imóveis e disparos em massa. Tudo com IA, tudo no mesmo lugar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
            <button
              onClick={() => navigate("/auth")}
              className="inline-flex items-center gap-2 text-white font-semibold text-base px-8 py-3.5 rounded-xl transition-all"
              style={{ background: BLUE, boxShadow: `0 4px 20px ${BLUE}40` }}
              onMouseEnter={e => (e.currentTarget.style.background = BLUE_DARK)}
              onMouseLeave={e => (e.currentTarget.style.background = BLUE)}
            >
              Agendar demonstração <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="inline-flex items-center gap-2 text-gray-700 font-semibold text-base px-8 py-3.5 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-all"
            >
              Já tenho conta
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-10">
            <div className="text-center">
              <p className="text-3xl font-black" style={{ color: BLUE }}>5</p>
              <p className="text-gray-500 text-sm mt-0.5">módulos integrados com IA.</p>
            </div>
            <div className="hidden sm:block w-px h-10 bg-gray-200" />
            <div className="text-center">
              <p className="text-3xl font-black" style={{ color: BLUE }}>{"<10s"}</p>
              <p className="text-gray-500 text-sm mt-0.5">de resposta ao lead no WhatsApp.</p>
            </div>
          </div>
        </div>
      </section>

      {/* TICKER STRIP */}
      <div className="overflow-hidden border-y border-gray-100 bg-white py-6">
        <style>{`
          @keyframes kelmor-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
        <div
          className="flex items-center gap-16 whitespace-nowrap"
          style={{ animation: "kelmor-scroll 40s linear infinite" }}
        >
          {[
            "Atendimento em < 10s",
            "IA em cada etapa",
            "Zero lead perdido",
            "Follow-up automático",
            "Pipeline visual completo",
            "WhatsApp integrado",
            "Disparos em massa com IA",
            "Gestão de imóveis",
            "Sem planilha, sem estresse",
            "Relatórios em tempo real",
            "Atendimento em < 10s",
            "IA em cada etapa",
            "Zero lead perdido",
            "Follow-up automático",
            "Pipeline visual completo",
            "WhatsApp integrado",
            "Disparos em massa com IA",
            "Gestão de imóveis",
            "Sem planilha, sem estresse",
            "Relatórios em tempo real",
          ].map((item, i) => (
            <span key={i} className="flex items-center gap-16 text-4xl font-black text-gray-900 tracking-tight">
              {item}
              <span style={{ color: BLUE, fontSize: "2rem" }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* BIG STAT */}
      <section className="py-24 px-6" style={{ background: BG }}>
        <div className="container mx-auto max-w-4xl">
          <div className="relative py-4">
            <div className="absolute top-6 left-0 sm:left-12 flex items-center gap-2 bg-white rounded-full px-4 py-2.5 shadow-md border border-gray-100 text-xs z-10">
              <Users className="w-3.5 h-3.5 flex-shrink-0" style={{ color: BLUE }} />
              <span className="text-gray-400 uppercase text-[9px] font-bold tracking-widest">MÉTODO</span>
              <span className="font-semibold text-gray-700">Sem aumentar equipe</span>
            </div>

            <p
              className="text-center font-black leading-none py-16 select-none"
              style={{ fontSize: "clamp(80px, 18vw, 160px)", color: BLUE }}
            >
              +3x
            </p>

            <div className="absolute bottom-6 right-0 sm:right-12 flex items-center gap-2 bg-white rounded-full px-4 py-2.5 shadow-md border border-gray-100 text-xs z-10">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: BLUE }} />
              <span className="text-gray-400 uppercase text-[9px] font-bold tracking-widest">PERÍODO</span>
              <span className="font-semibold text-gray-700">60 dias</span>
            </div>
          </div>

          <p className="text-center text-xl text-gray-600 max-w-2xl mx-auto mt-4 mb-12 leading-relaxed">
            foi o aumento de <strong className="text-gray-900">leads atendidos</strong> de uma
            imobiliária em 60 dias, com o{" "}
            <strong className="text-gray-900">mesmo time de sempre</strong>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { Icon: CheckCircle2, stat: "100%", desc: "dos leads respondidos. Nenhum esquecido pelo caminho." },
              { Icon: Clock, stat: "60 dias", desc: "da configuração ao primeiro resultado concreto." },
              { Icon: MessageSquare, stat: "24/7", desc: "sem pausa, sem plantão, sem corretor esperando." },
            ].map(({ Icon, stat, desc }) => (
              <div key={stat} className="bg-white rounded-2xl p-6 border border-gray-100 text-center shadow-sm">
                <Icon className="w-5 h-5 mx-auto mb-3" style={{ color: BLUE }} />
                <p className="font-black text-2xl mb-1" style={{ color: NAVY }}>{stat}</p>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES HEADER */}
      <section className="pt-20 pb-10 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">· FUNCIONALIDADES</p>
              <h2 className="text-3xl md:text-5xl font-black leading-tight" style={{ color: NAVY }}>
                Cinco módulos integrados.{" "}
                <span style={{ color: BLUE }}>Uma operação inteira.</span>
              </h2>
            </div>
            <p className="text-gray-500 text-lg leading-relaxed">
              Cada módulo é especialista em uma parte do funil.{" "}
              <strong className="text-gray-800">Todos compartilham os mesmos dados.</strong>{" "}
              O que acontece no WhatsApp aparece no CRM. O que o CRM sabe, o disparo usa.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="pb-24 px-6 bg-white">
        <div className="container mx-auto max-w-6xl space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURES.slice(0, 2).map(f => <FeatureCard key={f.num} {...f} />)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {FEATURES.slice(2).map(f => <FeatureCard key={f.num} {...f} />)}
          </div>
        </div>
      </section>

      {/* DARK CONNECTOR */}
      <section className="px-6 py-16" style={{ background: BG }}>
        <div
          className="container mx-auto max-w-6xl rounded-3xl py-14 px-8 md:px-16 flex flex-col md:flex-row items-center justify-between gap-8"
          style={{ background: NAVY }}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">+ INTEGRAÇÃO</p>
            <h2 className="text-2xl md:text-4xl font-black text-white leading-tight">
              Tudo <span style={{ color: "#93b8ff" }}>conectado</span> numa plataforma só.
            </h2>
            <p className="text-gray-400 mt-3 max-w-lg leading-relaxed">
              Não é integração. É um organismo. O WhatsApp alimenta o CRM, que alimenta o
              follow-up, que alimenta os disparos.
            </p>
          </div>
          <button
            onClick={() => window.open("https://wa.me/5564992957973?text=Quero+conhecer+o+Kelmor+CRM", "_blank")}
            className="flex-shrink-0 inline-flex items-center gap-2 text-white font-semibold px-8 py-4 rounded-xl transition whitespace-nowrap"
            style={{ background: BLUE }}
            onMouseEnter={e => (e.currentTarget.style.background = BLUE_DARK)}
            onMouseLeave={e => (e.currentTarget.style.background = BLUE)}
          >
            Ver demonstração <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-6 bg-white border-t border-gray-100">
        <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <KelmorWordmark />
          <p className="text-gray-400 text-sm">© 2025 Kelmor. Todos os direitos reservados.</p>
          <div className="flex gap-6 text-gray-400 text-sm">
            <span className="hover:text-gray-600 cursor-pointer transition">Termos</span>
            <span className="hover:text-gray-600 cursor-pointer transition">Privacidade</span>
            <span className="hover:text-gray-600 cursor-pointer transition">Contato</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
