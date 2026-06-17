import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import styled, { keyframes, css, createGlobalStyle } from "styled-components";
import {
  Loader2, ArrowRight, Eye, EyeOff, Mail, Lock,
  Check, X as XIcon, ArrowLeft, ShieldCheck, KeyRound,
  PhoneCall, Home, TrendingUp,
} from "lucide-react";
import { Typewriter } from "react-simple-typewriter";

// ─── IMPORTAÇÕES DO SEU PROJETO ───────────────────────────────────────────────
import { authService } from "@/services/auth.services";
import { useAuthStore } from "@/store/auth.store";
import { useQueryClient } from "@tanstack/react-query";

// ─── IMAGEM DE FUNDO ──────────────────────────────────────────────────────────
import loginBg from "@/themes/loguin.webp";

// ─── TOKENS DE COR ────────────────────────────────────────────────────────────
// ← ALTERE: troque pela cor principal da sua marca
const BRAND = "#1653cc";   // azul principal
// const BRAND_DARK = "#1147b2";

// ─── FEATURES DA COLUNA ESQUERDA ─────────────────────────────────────────────
// ← ALTERE: substitua pelos benefícios do seu produto
const FEATURES = [
  { Icon: PhoneCall, title: "Follow-up automático", sub: "Com seus leads", solid: false },
  { Icon: Home, title: "Carteira de imóveis", sub: "Sempre atualizada", solid: false },
  { Icon: TrendingUp, title: "Controle de comissões", sub: "E metas", solid: false },
  { Icon: ShieldCheck, title: "Segurança e performance", sub: "Seus dados protegidos", solid: true },
];

// ─── TEXTOS DO CARD ───────────────────────────────────────────────────────────
// ← ALTERE: frases que aparecem em loop com animação de digitação
const TYPEWRITER_PHRASES = [
  "É muito bom ter você aqui",
  "Bem-vindo de volta!",
  "Pronto para fechar mais vendas?",
];

// ─── LINK DO SUPORTE WHATSAPP ─────────────────────────────────────────────────
// ← ALTERE: troque pelo número e mensagem do seu suporte
const WHATSAPP_URL =
  "https://wa.me/5500000000000?text=Ol%C3%A1%2C%20preciso%20recuperar%20minha%20senha.";

// ─── LINKS DE REDES SOCIAIS ───────────────────────────────────────────────────
// ← ALTERE: troque pelos links do seu app
const INSTAGRAM_URL = "https://www.instagram.com/kelmordigital/";

// ─── NOME E VERSÃO DO APP ────────────────────────────────────────────────────
// ← ALTERE
const APP_NAME = "Kelmor";
const APP_VERSION = "v0.55.0";

// ═════════════════════════════════════════════════════════════════════════════
//  KEYFRAMES
// ═════════════════════════════════════════════════════════════════════════════

const spin = keyframes`to { transform: rotate(360deg); }`;

const popIn = keyframes`
  0%   { transform: scale(0.4); opacity: 0; }
  60%  { transform: scale(1.25); opacity: 1; }
  100% { transform: scale(1);   opacity: 1; }
`;

const shake = keyframes`
  0%,100% { transform: translateX(0); }
  15%     { transform: translateX(-8px); }
  30%     { transform: translateX(7px); }
  45%     { transform: translateX(-5px); }
  60%     { transform: translateX(4px); }
  75%     { transform: translateX(-2px); }
`;

const pulseSuccess = keyframes`
  0%   { box-shadow: 0 8px 22px rgba(34,197,94,0); }
  50%  { box-shadow: 0 8px 22px rgba(34,197,94,.35), 0 0 0 10px rgba(34,197,94,0); }
  100% { box-shadow: 0 8px 22px rgba(34,197,94,.28); }
`;

const blink = keyframes`0%,100% { opacity: 1; } 50% { opacity: 0; }`;

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const progressBar = keyframes`from { width: 0% } to { width: 100% }`;

const floatY = keyframes`
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-12px); }
`;

const GlobalFloatY = createGlobalStyle`
  @keyframes floatY {
    0%,100% { transform: translateY(0); }
    50%      { transform: translateY(-12px); }
  }
`;

// ─── CONFETES — losangos decorativos espalhados pelo fundo ───────────────────
const CONFETES = [
  // canto superior esquerdo
  { top: 50, left: 120, size: 9, color: '#3b82f6' },
  { top: 90, left: 80, size: 7, color: '#93c5fd' },
  { top: 130, left: 160, size: 12, color: '#1d4ed8' },
  { top: 30, left: 200, size: 8, color: '#bfdbfe' },
  { top: 70, left: 240, size: 10, color: '#3b82f6' },
  // centro superior
  { top: 25, left: 440, size: 11, color: '#1d4ed8' },
  { top: 60, left: 510, size: 8, color: '#93c5fd' },
  { top: 35, left: 580, size: 13, color: '#3b82f6' },
  { top: 80, left: 650, size: 7, color: '#bfdbfe' },
  // lado esquerdo central
  { top: 300, left: 60, size: 10, color: '#3b82f6' },
  { top: 360, left: 110, size: 8, color: '#1d4ed8' },
  { top: 420, left: 50, size: 13, color: '#93c5fd' },
  { top: 480, left: 140, size: 9, color: '#3b82f6' },
  { top: 540, left: 80, size: 7, color: '#bfdbfe' },
  // rodapé esquerdo
  { top: 650, left: 130, size: 11, color: '#1d4ed8' },
  { top: 700, left: 70, size: 8, color: '#3b82f6' },
  { top: 730, left: 200, size: 12, color: '#93c5fd' },
  // centro inferior
  { top: 680, left: 380, size: 9, color: '#3b82f6' },
  { top: 720, left: 460, size: 7, color: '#1d4ed8' },
  { top: 700, left: 540, size: 11, color: '#bfdbfe' },
  // área central vazia — entre card e coroa/K
  { top: 100, left: 730, size: 10, color: '#3b82f6' },
  { top: 160, left: 790, size: 7, color: '#bfdbfe' },
  { top: 200, left: 740, size: 12, color: '#1d4ed8' },
  { top: 250, left: 820, size: 8, color: '#93c5fd' },
  { top: 300, left: 760, size: 11, color: '#3b82f6' },
  { top: 340, left: 850, size: 7, color: '#bfdbfe' },
  { top: 380, left: 720, size: 9, color: '#1d4ed8' },
  { top: 420, left: 880, size: 10, color: '#3b82f6' },
  { top: 460, left: 800, size: 8, color: '#93c5fd' },
  { top: 500, left: 750, size: 11, color: '#bfdbfe' },
  { top: 540, left: 900, size: 7, color: '#3b82f6' },
  // lado direito — entre card e K
  { top: 55, left: 980, size: 10, color: '#3b82f6' },
  { top: 110, left: 1030, size: 8, color: '#bfdbfe' },
  { top: 40, left: 1080, size: 12, color: '#1d4ed8' },
  { top: 150, left: 960, size: 7, color: '#93c5fd' },
  { top: 180, left: 1010, size: 11, color: '#3b82f6' },
  // canto superior direito (acima do worm)
  { top: 20, left: 1160, size: 9, color: '#bfdbfe' },
  { top: 60, left: 1220, size: 7, color: '#3b82f6' },
  { top: 30, left: 1300, size: 11, color: '#93c5fd' },
  // abaixo da coroa / ao lado do K
  { top: 220, left: 970, size: 8, color: '#1d4ed8' },
  { top: 270, left: 1050, size: 10, color: '#bfdbfe' },
  { top: 310, left: 990, size: 7, color: '#3b82f6' },
  // entre K e esfera (lado direito inferior)
  { top: 590, left: 960, size: 9, color: '#93c5fd' },
  { top: 630, left: 1020, size: 11, color: '#3b82f6' },
  { top: 660, left: 940, size: 7, color: '#bfdbfe' },
  { top: 700, left: 1060, size: 8, color: '#1d4ed8' },
];

function Confetes() {
  return (
    <>
      {CONFETES.map((c, i) => (
        <div key={i} style={{
          position: "absolute",
          top: c.top, left: c.left,
          width: c.size, height: c.size,
          backgroundColor: c.color,
          transform: "rotate(45deg)",
          zIndex: 0,
          pointerEvents: "none",
          opacity: 0.55,
        }} />
      ))}
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  STYLED COMPONENTS — LAYOUT
// ═════════════════════════════════════════════════════════════════════════════

// Wrapper principal: imagem de fundo webp, fullscreen, centralizado
const Page = styled.div<{ $ready: boolean }>`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #eef2f7;
  background-image: url(${loginBg});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  overflow: hidden;
  opacity: ${p => p.$ready ? 1 : 0};
  transition: opacity 0.45s ease;
`;

const ContentRow = styled.div`
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
`;

// ─── Coluna esquerda (absoluta, ocupa altura total) ───────────────────────────
const LeftColumn = styled.aside`
  position: absolute;
  left: 48px;
  top: 0;
  bottom: 0;
  height: 100vh;
  width: 360px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 44px 0;

  @media (max-width: 1100px) { left: 28px; width: 300px; }
  @media (max-width: 900px)  { display: none; }
`;

const LeftLogoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 28px;
`;

const DotGridLeft = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 10px);
  gap: 8px;
  margin-bottom: 28px;
`;

const DotBlue = styled.span`
  width: 5px; height: 5px;
  border-radius: 50%;
  background: ${BRAND};
  display: block;
  opacity: 0.35;
`;

const LeftHeadline = styled.h1`
  font-size: clamp(28px, 2.5vw, 40px);
  font-weight: 900;
  color: #0f172a;
  line-height: 1.15;
  letter-spacing: -0.03em;
  margin-bottom: 14px;
`;

const LeftDesc = styled.p`
  font-size: 15px;
  color: #64748b;
  line-height: 1.7;
  max-width: 320px;
  margin-bottom: 32px;
`;

const FeatureList = styled.div`
  display: flex; flex-direction: column; gap: 18px;
`;

const FeatureItem = styled.div`
  display: flex; align-items: center; gap: 14px;
`;

const FeatureIcon = styled.div<{ $solid?: boolean }>`
  width: 44px; height: 44px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: ${p => p.$solid ? BRAND : "#dbeafe"};
`;

const FeatureTitle = styled.div`
  font-size: 14px; font-weight: 700; color: #0f172a; line-height: 1.3;
`;

const FeatureSub = styled.div`
  font-size: 13px; color: #94a3b8; margin-top: 2px;
`;

// ═════════════════════════════════════════════════════════════════════════════
//  STYLED COMPONENTS — ELEMENTOS 3D DECORATIVOS
//  Ficam com position:absolute e zIndex:0 — atrás do card
// ═════════════════════════════════════════════════════════════════════════════

// Letra grande da marca — canto direito (efeito 3D via text-shadow)
const DecorK = styled.div`
  position: absolute;
  right: 60px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 380px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.05em;
  color: #2563eb;
  text-shadow:
    3px 3px 0 #1e50d0,
    6px 6px 0 #1844ba,
    9px 9px 0 #1338a4,
    12px 12px 0 #0e2c8e,
    16px 16px 28px rgba(14,44,142,.45);
  user-select: none;
  pointer-events: none;
  z-index: 0;

  @media (max-width: 1024px) { font-size: 300px; }
`;

// Coroa 3D flutuante — acima da letra
const DecorCrown = styled.div`
  position: absolute;
  top: calc(50% - 260px);
  right: 160px;
  pointer-events: none;
  animation: ${floatY} 5s ease-in-out infinite;
  z-index: 2;

  @media (max-width: 1024px) { display: none; }
`;

// Worm/tubo 3D — topo direito, termina no centro da tela
const DecorWormTop = styled.div`
  position: absolute; top: -20px; right: -10px;
  pointer-events: none; z-index: 0;
`;

// Worm/tubo 3D — canto inferior esquerdo
const DecorWormBottom = styled.div`
  position: absolute; bottom: -40px; left: 340px;
  pointer-events: none; z-index: 0;
`;

// Esfera/blob azul — grande, canto inferior direito (só o arco superior aparece)
const DecorSphere = styled.div`
  position: absolute;
  bottom: -620px;
  right: -180px;
  width: 900px;
  height: 900px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 26%, #3b82f6 0%, #1d4ed8 32%, #1147b2 62%, #050e2e 100%);
  box-shadow:
    inset -40px -40px 80px rgba(0,0,40,.55),
    16px 24px 60px rgba(22,83,204,.4);
  pointer-events: none;
  z-index: 0;
`;

// Grid de pontos brancos — sobre o arco da esfera
const DecorSphereDotsWrap = styled.div`
  position: absolute; bottom: 110px; right: 240px;
  pointer-events: none;
  display: flex; flex-direction: column; gap: 7px;
  opacity: 0.5; z-index: 1;
`;

const DecorDotRow = styled.div`display: flex; gap: 7px;`;

const DecorDot = styled.div<{ $color?: string; $size?: number }>`
  width: ${p => p.$size ?? 5}px; height: ${p => p.$size ?? 5}px;
  border-radius: 50%;
  background: ${p => p.$color ?? BRAND};
`;

// Foguete — canto superior esquerdo
const DecorRocket = styled.div`
  position: absolute;
  top: 30px;
  left: 200px;
  pointer-events: none;
  z-index: 2;
  animation: ${floatY} 4s ease-in-out infinite;
  filter: drop-shadow(4px 16px 18px rgba(22,83,204,0.35));
`;

// Nuvem branca — dentro da esfera
const DecorCloud = styled.div`
  position: absolute; bottom: 50px; right: 70px;
  pointer-events: none;
  animation: ${floatY} 6s ease-in-out 1s infinite;
  z-index: 2;
`;

// Tubo 3D curvo — sobre o arco da esfera, baixo direito
const DecorTubeK = styled.div`
  position: absolute;
  bottom: 60px;
  right: 40px;
  pointer-events: none;
  z-index: 2;
  filter: drop-shadow(2px 10px 12px rgba(30,58,138,0.32));
`;

// Círculo com listras — direita
const DecorStripeCircle = styled.div`
  position: absolute; right: -42px; top: 35%;
  width: 110px; height: 110px;
  border-radius: 50%;
  border: 10px solid ${BRAND}33;
  background: repeating-linear-gradient(
    45deg, ${BRAND}18 0px, ${BRAND}18 4px, transparent 4px, transparent 10px
  );
  pointer-events: none; z-index: 0;
`;

// ═════════════════════════════════════════════════════════════════════════════
//  STYLED COMPONENTS — FLIP CARD
// ═════════════════════════════════════════════════════════════════════════════

const CardScene = styled.div`
  width: 100%; max-width: 580px;
  perspective: 1600px;
  z-index: 10; position: relative;
`;

const CardFlipper = styled.div<{ $flipped: boolean }>`
  position: relative; width: 100%;
  transform-style: preserve-3d;
  transition: transform 0.85s cubic-bezier(0.65, 0, 0.35, 1);
  transform: ${p => p.$flipped ? "rotateY(180deg)" : "rotateY(0deg)"};
`;

const cardFaceBase = css`
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(24px) saturate(1.4);
  -webkit-backdrop-filter: blur(24px) saturate(1.4);
  border: 1px solid rgba(255, 255, 255, 0.70);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.08);
  border-radius: 24px;
  padding: 4rem 3.5rem 3.5rem;
  min-height: 560px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
`;

const FrontFace = styled.section<{ $flipped: boolean }>`
  ${cardFaceBase}
  visibility: ${p => p.$flipped ? "hidden" : "visible"};
  transition: visibility 0s linear 0.425s;
`;

const BackFace = styled.section<{ $flipped: boolean }>`
  ${cardFaceBase}
  position: absolute; inset: 0;
  transform: rotateY(180deg);
  visibility: ${p => p.$flipped ? "visible" : "hidden"};
  transition: visibility 0s linear 0.425s;
`;

// ═════════════════════════════════════════════════════════════════════════════
//  STYLED COMPONENTS — CONTEÚDO DO CARD
// ═════════════════════════════════════════════════════════════════════════════

const CardTitle = styled.h2`
  font-size: 1.4rem; font-weight: 700; color: #1a1a2e;
  text-align: center; min-height: 2rem; margin: 0 0 6px;
  letter-spacing: -0.02em;
`;

const CardSubtitle = styled.p`
  font-size: 13.5px; color: #666; text-align: center;
  margin: 0 0 1.4rem; line-height: 1.55;
`;

const CardForm = styled.form`
  width: 100%; display: flex; flex-direction: column; gap: 12px;
`;

const FieldLabel = styled.label`
  font-size: 13px; font-weight: 600; color: #374151;
  display: block; margin-bottom: 6px;
`;

const InputWrapper = styled.div<{ $focused: boolean; $error: boolean }>`
  position: relative;
  border: ${p =>
    p.$error ? "1.5px solid #dc2626" :
      p.$focused ? `1.5px solid ${BRAND}` :
        "1.5px solid #e5e7eb"};
  border-radius: 10px;
  background: ${p => p.$focused ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.50)"};
  box-shadow: ${p =>
    p.$focused ? `0 0 0 3px ${BRAND}1a` :
      p.$error ? "0 0 0 3px rgba(220,38,38,.1)" :
        "none"};
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  display: flex; align-items: center;

  svg.field-icon {
    position: absolute; left: 13px;
    color: ${p => p.$error ? "#dc2626" : p.$focused ? BRAND : "#9ca3af"};
    flex-shrink: 0; pointer-events: none;
    transition: color 0.15s;
  }
`;

const StyledInput = styled.input`
  flex: 1; min-width: 0; border: none; background: transparent;
  outline: none; font-size: 14px; color: #1a1a2e; font-family: inherit;
  padding: 13px 42px 13px 40px; width: 100%;

  &::placeholder { color: #9ca3af; }

  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0 1000px #fafafa inset;
    -webkit-text-fill-color: #1a1a2e;
    transition: background-color 9999s;
  }
`;

const EyeBtn = styled.button`
  position: absolute; right: 12px;
  background: none; border: none; cursor: pointer;
  padding: 0; display: flex; color: #9ca3af;
  &:hover { color: #64748b; }
`;

const FieldError = styled.p`
  font-size: 12px; color: #dc2626; margin: 4px 0 0 2px;
`;

const SubmitBtn = styled.button<{ $status: string }>`
  width: 100%;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 14px; margin-top: 6px;
  border: none; border-radius: 10px;
  font-size: 16px; font-weight: 600; color: #fff; font-family: inherit;
  cursor: ${p => p.$status === "loading" ? "not-allowed" : "pointer"};
  transition: background 0.25s, box-shadow 0.25s, filter 0.15s, transform 0.05s;

  background: ${p =>
    p.$status === "success" ? "#16a34a" :
      p.$status === "error" ? "#dc2626" : BRAND};

  box-shadow: ${p =>
    p.$status === "success" ? "0 8px 22px rgba(34,197,94,.32)" :
      p.$status === "error" ? "0 8px 22px rgba(220,38,38,.35)" :
        `0 8px 22px ${BRAND}45`};

  animation: ${p =>
    p.$status === "success" ? css`${pulseSuccess} 1.1s ease-out` :
      p.$status === "error" ? css`${shake} 0.55s cubic-bezier(0.36,.07,.19,.97)` :
        "none"};

  &:hover:not(:disabled) { filter: brightness(0.92); }
  &:active:not(:disabled) { transform: scale(0.985); }

  .spin-icon { animation: ${spin} 0.8s linear infinite; }
  .pop-icon  { animation: ${popIn} 0.45s cubic-bezier(0.34,1.56,0.64,1); }
`;

const ForgotBtn = styled.button`
  background: none; border: none; cursor: pointer;
  font-size: 13.5px; color: ${BRAND}; font-weight: 600;
  font-family: inherit; padding: 0; margin-top: 14px;
  &:hover { text-decoration: underline; }
`;

// ─── Footer dentro (ou abaixo) do card ───────────────────────────────────────
const CardFooter = styled.div`
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  margin-top: 20px; position: relative; z-index: 10;
`;

const FooterVersion = styled.span`font-size: 12px; color: #94a3b8;`;

const SocialRow = styled.div`display: flex; gap: 10px;`;

const SocialBtn = styled.a<{ $bg: string; $border: string }>`
  width: 34px; height: 34px; border-radius: 50%;
  background: ${p => p.$bg}; border: 1px solid ${p => p.$border};
  display: flex; align-items: center; justify-content: center;
  text-decoration: none;
  transition: opacity 0.2s, transform 0.15s;
  &:hover { opacity: 0.75; transform: scale(1.1); }
`;

// ─── Verso do card (recuperação de senha) ────────────────────────────────────
const RecoveryIconBadge = styled.div`
  width: 64px; height: 64px; border-radius: 50%;
  background: linear-gradient(135deg, #dce8ff 0%, #b8cfff 100%);
  display: flex; align-items: center; justify-content: center; margin-bottom: 4px;
`;

const RecoveryTitle = styled.h2`
  font-size: 20px; font-weight: 800; color: #0f172a;
  margin: 0; text-align: center; letter-spacing: -0.02em;
`;

const RecoveryText = styled.p`
  font-size: 14px; color: #64748b; line-height: 1.7; text-align: center; margin: 0;
  strong { color: #1a1a2e; }
`;

const RecoveryHighlight = styled.div`
  width: 100%; background: #f0f5ff;
  border: 1px solid #d9e5ff; border-radius: 12px;
  padding: 13px 16px; display: flex; align-items: flex-start; gap: 12px;
  p { font-size: 13px; color: #475569; margin: 0; line-height: 1.6; }
`;

const WhatsAppLink = styled.a`
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 13px 0; background: #25d366; border-radius: 12px;
  color: #fff; font-weight: 700; font-size: 14.5px; text-decoration: none;
  box-shadow: 0 6px 18px rgba(37,211,102,.3); transition: filter 0.15s;
  &:hover { filter: brightness(0.92); }
`;

const BackBtn = styled.button`
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
  background: transparent; border: 1px solid #e0e0e0; border-radius: 10px;
  cursor: pointer; padding: 12px 0; font-size: 14px; font-weight: 600;
  color: #64748b; font-family: inherit; transition: background 0.15s, color 0.15s;
  &:hover { background: #f1f5f9; color: #334155; }
`;

// ─── Splash de boas-vindas ────────────────────────────────────────────────────
const SplashWrap = styled.div`
  position: fixed; inset: 0; z-index: 9999;
  background: linear-gradient(135deg, #1e60e8 0%, #0f3fa8 60%, #092d82 100%);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
`;

const WelcomeLine1 = styled.div`animation: ${fadeInUp} 0.5s ease forwards;`;
const WelcomeLine2 = styled.div`
  opacity: 0; margin-top: 12px;
  animation: ${fadeInUp} 0.5s ease 1.8s forwards;
`;

const ProgressBar = styled.div`
  position: absolute; bottom: 0; left: 0; right: 0;
  height: 3px; background: rgba(255,255,255,.15);
  &::after {
    content: ""; display: block; height: 100%;
    background: rgba(255,255,255,.7);
    animation: ${progressBar} 3.8s linear forwards;
  }
`;

// ═════════════════════════════════════════════════════════════════════════════
//  SVG DECORATIVOS 3D (gerados via código — não precisam de imagens externas)
// ═════════════════════════════════════════════════════════════════════════════

// Coroa 3D azul
const CrownSvg = () => (
  <svg width="180" height="145" viewBox="0 0 180 145" fill="none">
    <defs>
      <linearGradient id="cg-front" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#60a5fa" /><stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
      <linearGradient id="cg-side" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1e40af" /><stop offset="100%" stopColor="#082060" />
      </linearGradient>
      <filter id="cg-sh" x="-20%" y="-20%" width="150%" height="160%">
        <feDropShadow dx="4" dy="12" stdDeviation="14" floodColor="#1e3a8a" floodOpacity="0.5" />
      </filter>
    </defs>
    <g filter="url(#cg-sh)">
      <path d="M10 106 L10 32 L40 72 L90 8 L140 72 L170 32 L170 106 Z" fill="url(#cg-front)" />
      <rect x="10" y="106" width="160" height="26" rx="6" fill="url(#cg-front)" />
      <rect x="10" y="122" width="160" height="11" rx="5" fill="url(#cg-side)" opacity="0.7" />
      <path d="M24 58 L40 32 L54 58" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.45" />
      <path d="M76 44 L90 8 L104 44" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.45" />
      <path d="M126 58 L142 32 L156 58" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.45" />
    </g>
  </svg>
);

// Foguete SVG — cores Kelmor (azul/branco)
const RocketSvg = () => (
  <svg width="110" height="176" viewBox="0 0 100 160" fill="none" style={{ overflow: "visible" }}>
    <defs>
      <linearGradient id="rk-body" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#e0eaff" />
        <stop offset="100%" stopColor="#93c5fd" />
      </linearGradient>
      <linearGradient id="rk-tip" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
      <linearGradient id="rk-wing" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1338a4" />
      </linearGradient>
    </defs>
    {/* corpo */}
    <ellipse cx="50" cy="82" rx="22" ry="52" fill="url(#rk-body)" />
    {/* reflexo lateral */}
    <ellipse cx="38" cy="75" rx="7" ry="28" fill="white" opacity="0.35" />
    {/* ponta */}
    <path d="M50 8 C34 28 28 50 28 62 L72 62 C72 50 66 28 50 8Z" fill="url(#rk-tip)" />
    {/* janela */}
    <circle cx="50" cy="78" r="13" fill="#0f172a" />
    <circle cx="45" cy="73" r="5" fill="white" opacity="0.45" />
    {/* asa esquerda */}
    <path d="M28 92 L8 124 L28 118Z" fill="url(#rk-wing)" />
    {/* asa direita */}
    <path d="M72 92 L92 124 L72 118Z" fill="url(#rk-wing)" />
    {/* chama externa */}
    <ellipse cx="50" cy="144" rx="15" ry="22" fill="#fbbf24" opacity="0.85" />
    {/* chama interna */}
    <ellipse cx="50" cy="150" rx="8" ry="13" fill="white" opacity="0.65" />
  </svg>
);

// Worm/tubo 3D — superior direito
const WormTop = () => (
  <svg width="700" height="210" viewBox="0 0 700 210" fill="none"
    style={{
      display: "block", overflow: "visible",
      filter: "drop-shadow(2px 12px 14px rgba(30,58,138,0.35))"
    }}>
    <defs>
      <linearGradient id="wt-g" x1="1" y1="0.3" x2="0" y2="1">
        <stop offset="0%" stopColor="#93c5fd" />
        <stop offset="50%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
    </defs>
    <path d="M710 30 C600 30 500 178 370 140 C250 105 140 168 0 122"
      stroke="url(#wt-g)" strokeWidth="82" strokeLinecap="round" fill="none" />
    <path d="M710 30 C600 30 500 178 370 140 C250 105 140 168 0 122"
      stroke="white" strokeWidth="28" strokeLinecap="round" fill="none" opacity="0.28" />
  </svg>
);

// Worm/tubo 3D — inferior esquerdo
const WormBottom = () => (
  <svg width="340" height="210" viewBox="0 0 340 210" fill="none"
    style={{
      display: "block", background: "transparent", overflow: "visible",
      filter: "drop-shadow(2px 12px 14px rgba(30,58,138,0.35))"
    }}>
    <defs>
      <linearGradient id="wb-g" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0%" stopColor="#93c5fd" /><stop offset="50%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
    </defs>
    <path d="M10 185 C75 185 115 55 190 110 C250 155 290 65 335 100"
      stroke="url(#wb-g)" strokeWidth="76" strokeLinecap="round" fill="none" />
    <path d="M10 185 C75 185 115 55 190 110 C250 155 290 65 335 100"
      stroke="white" strokeWidth="26" strokeLinecap="round" fill="none" opacity="0.28" />
  </svg>
);

// Tubo 3D curvo abaixo do K
const TubeKSvg = () => (
  <svg width="360" height="160" viewBox="0 0 360 160" fill="none"
    style={{ display: "block", overflow: "visible" }}>
    <defs>
      <linearGradient id="tk-g" x1="0" y1="0" x2="1" y2="0.8">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="45%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#1338a4" />
      </linearGradient>
    </defs>
    {/* tubo principal com gradiente */}
    <path d="M10 140 C60 140 80 40 160 60 C240 80 280 130 355 90"
      stroke="url(#tk-g)" strokeWidth="68" strokeLinecap="round" fill="none" />
    {/* highlight branco — simula reflexo de luz */}
    <path d="M10 140 C60 140 80 40 160 60 C240 80 280 130 355 90"
      stroke="white" strokeWidth="22" strokeLinecap="round" fill="none" opacity="0.25" />
  </svg>
);

// Nuvem branca 3D — técnica: elipses sobrepostas + feDropShadow cinza azulado
const CloudSvg = () => (
  <svg width="300" height="190" viewBox="0 0 280 180" fill="none"
    style={{ display: "block", overflow: "visible" }}>
    <defs>
      <filter id="cloud-sh" x="-20%" y="-20%" width="150%" height="160%">
        <feDropShadow dx="0" dy="12" stdDeviation="16"
          floodColor="#b0b8c8" floodOpacity="0.28" />
      </filter>
    </defs>
    <g filter="url(#cloud-sh)">
      {/* base larga e achatada */}
      <ellipse cx="140" cy="145" rx="120" ry="42" fill="white" />
      {/* corcova esquerda */}
      <ellipse cx="80" cy="105" rx="62" ry="58" fill="white" />
      {/* corcova central — a mais alta */}
      <ellipse cx="150" cy="88" rx="78" ry="72" fill="white" />
      {/* corcova direita */}
      <ellipse cx="218" cy="112" rx="55" ry="48" fill="white" />
      {/* brilho no topo — simula luz batendo */}
      <ellipse cx="145" cy="68" rx="44" ry="20" fill="white" opacity="0.6" />
    </g>
  </svg>
);

// ═════════════════════════════════════════════════════════════════════════════
//  LOGO DA EMPRESA
//  ← ALTERE: substitua este SVG pelo logo real da sua empresa
// ═════════════════════════════════════════════════════════════════════════════

const LogoText = styled.span<{ $variant?: "dark" | "white" | "blue"; $size?: number }>`
  font-weight: 900;
  font-size: ${p => p.$size ?? 24}px;
  letter-spacing: -0.05em;
  line-height: 1;
  color: ${p =>
    p.$variant === "white" ? "white" :
      p.$variant === "blue" ? BRAND : "#0f172a"};
`;

const AppLogo = ({
  variant = "dark",
  size = 24,
}: {
  variant?: "dark" | "white" | "blue";
  size?: number;
}) => {
  const iconColor = variant === "white" ? "white" : BRAND;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      {/* ← ALTERE: substitua este SVG pelo ícone real da sua marca */}
      <svg width={size * 0.75} height={size * 0.65} viewBox="0 0 20 16" fill="none">
        <path d="M2 15L7 2L10 8L13 2L18 15L13 11.5L10 14L7 11.5L2 15Z" fill={iconColor} />
      </svg>
      {/* ← ALTERE: substitua pelo nome da sua empresa */}
      <LogoText $variant={variant} $size={size}>{APP_NAME.toLowerCase()}</LogoText>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  ANIMAÇÃO DE DIGITAÇÃO DO SPLASH
// ═════════════════════════════════════════════════════════════════════════════

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
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    indexRef.current = 0;
    setDisplayed("");
    const iv = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayed(text.slice(0, indexRef.current + 1));
        indexRef.current++;
      } else clearInterval(iv);
    }, 55);
    return () => clearInterval(iv);
  }, [started, text]);

  return (
    <span style={{ fontSize, fontWeight, color, letterSpacing: "-0.02em" }}>
      {displayed}
      {cursor && (
        <span style={{
          marginLeft: 2, display: "inline-block",
          animation: `${blink.getName()} 0.8s step-end infinite`
        }}>|</span>
      )}
    </span>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  VALIDAÇÃO COM ZOD
// ═════════════════════════════════════════════════════════════════════════════

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

type SubmitStatus = "idle" | "loading" | "success" | "error";

// ═════════════════════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ═════════════════════════════════════════════════════════════════════════════

const Auth = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [bgReady, setBgReady] = useState(false);

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => setBgReady(true);
    img.src = loginBg;
    if (img.complete) setBgReady(true);
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeLines, setWelcomeLines] = useState<string[]>([]);
  const resetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLoading = status === "loading";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setEmailError(null);
    setPasswordError(null);
    setSubmitError(null);

    const result = loginSchema.safeParse({ email: email.trim(), password });
    if (!result.success) {
      result.error.errors.forEach(err => {
        if (err.path[0] === "email") setEmailError(err.message);
        if (err.path[0] === "password") setPasswordError(err.message);
      });
      return;
    }

    setStatus("loading");
    try {
      // ← ALTERE: substitua pela chamada de login do seu projeto
      await authService.login({ email: email.trim(), password });
      queryClient.clear();

      // ← ALTERE: ajuste a lógica de redirecionamento conforme suas rotas
      const user = useAuthStore.getState().user;
      const firstName = (user?.name || "").split(" ")[0] || "Usuário";
      const hour = new Date().getHours();
      const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
      const motivation = [
        "Vamos vender muito hoje!",
        "Hoje é dia de fechar negócios!",
        "Sua melhor venda começa agora!",
      ][Math.floor(Math.random() * 3)];

      setWelcomeLines([`${greeting}, ${firstName}!`, motivation]);
      setStatus("success");
      setTimeout(() => {
        setShowWelcome(true);
        setTimeout(() => {
          // ← ALTERE: rota de destino após login
          navigate("/dashboard");
        }, 3800);
      }, 600);
    } catch (err: any) {
      setStatus("error");
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Erro inesperado. Tente novamente.";
      setSubmitError(message);
      toast.error(message);
      if (resetTimeout.current) clearTimeout(resetTimeout.current);
      resetTimeout.current = setTimeout(() => setStatus("idle"), 1800);
    }
  };

  // ─── SPLASH DE BOAS-VINDAS ────────────────────────────────────────────────
  if (showWelcome) {
    return (
      <SplashWrap>
        <div style={{ marginBottom: 48 }}>
          <AppLogo variant="white" size={28} />
        </div>
        <div style={{ textAlign: "center", padding: "0 24px" }}>
          <WelcomeLine1>
            <WelcomeTyper text={welcomeLines[0] ?? ""} fontSize={42} fontWeight={900}
              color="white" delay={0} cursor />
          </WelcomeLine1>
          <WelcomeLine2>
            <WelcomeTyper text={welcomeLines[1] ?? ""} fontSize={22} fontWeight={400}
              color="rgba(255,255,255,.7)" delay={1800} cursor={false} />
          </WelcomeLine2>
        </div>
        <ProgressBar />
      </SplashWrap>
    );
  }

  // ─── ESTADOS DO BOTÃO ────────────────────────────────────────────────────
  const btnMap: Record<SubmitStatus, { icon: React.ReactNode; label: string }> = {
    idle: { icon: <ArrowRight size={18} />, label: "Entrar" },
    loading: { icon: <Loader2 size={18} className="spin-icon" />, label: "Entrando..." },
    success: { icon: <Check size={18} className="pop-icon" />, label: "Bem-vindo!" },
    error: { icon: <XIcon size={18} className="pop-icon" />, label: "Falha no login" },
  };

  // ─── RENDER PRINCIPAL ─────────────────────────────────────────────────────
  return (
    <Page $ready={bgReady}>

      {/* ══ COLUNA ESQUERDA (absoluta, esquerda da tela) ════════════════════ */}
      <LeftColumn>
        {/* Logo no topo */}
        <LeftLogoRow>
          <AppLogo size={22} />
        </LeftLogoRow>

        {/* Conteúdo central: grid de pontos + tagline + features */}
        <div>
          <DotGridLeft>
            {Array.from({ length: 20 }).map((_, i) => <DotBlue key={i} />)}
          </DotGridLeft>

          {/* ← ALTERE: tagline principal */}
          <LeftHeadline>
            Um novo jeito de{" "}
            <span style={{ color: BRAND }}>vender mais.</span>
          </LeftHeadline>

          {/* ← ALTERE: descrição curta */}
          <LeftDesc>
            Organize seus contatos, acompanhe leads, feche negócios e
            cresça todos os dias com o {APP_NAME}.
          </LeftDesc>

          <FeatureList>
            {FEATURES.map(({ Icon, title, sub, solid }, i) => (
              <FeatureItem key={i}>
                <FeatureIcon $solid={solid}>
                  <Icon size={18} style={{ color: solid ? "white" : BRAND }} />
                </FeatureIcon>
                <div>
                  <FeatureTitle>{title}</FeatureTitle>
                  <FeatureSub>{sub}</FeatureSub>
                </div>
              </FeatureItem>
            ))}
          </FeatureList>
        </div>

        {/* Copyright no rodapé da coluna */}
        <span style={{ fontSize: 12, color: "#94a3b8" }}>
          © {new Date().getFullYear()} {APP_NAME}. Todos os direitos reservados.
        </span>
      </LeftColumn>

      {/* ══ CARD + FOOTER — centralizados na tela ══════════════════════════ */}
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", position: "relative", zIndex: 10,
      }}>

        {/* ── FLIP CARD ──────────────────────────────────────────────────── */}
        <CardScene>
          <CardFlipper $flipped={flipped}>

            {/* ── FRENTE: formulário de login ───────────────────────────── */}
            <FrontFace $flipped={flipped}>

              {/* Logo dentro do card */}
              <div style={{ marginBottom: 16 }}>
                <AppLogo size={24} />
              </div>

              {/* Título com Typewriter em loop */}
              <CardTitle>
                <Typewriter
                  words={TYPEWRITER_PHRASES}
                  loop={0}
                  cursor
                  cursorStyle="|"
                  typeSpeed={55}
                  deleteSpeed={30}
                  delaySpeed={2200}
                />
              </CardTitle>

              {/* ← ALTERE: subtítulo */}
              <CardSubtitle>
                Faça login para continuar e impulsionar seus resultados.
              </CardSubtitle>

              <CardForm onSubmit={handleSubmit}>

                {/* Campo E-mail */}
                <div>
                  <FieldLabel>E-mail</FieldLabel>
                  <InputWrapper
                    $focused={emailFocused} $error={!!emailError}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setEmailFocused(false); }}
                  >
                    {/* Ícone envelope À ESQUERDA dentro do input */}
                    <Mail size={15} className="field-icon" />
                    <StyledInput
                      type="email" value={email} placeholder="seu@email.com"
                      disabled={isLoading} aria-invalid={!!emailError}
                      onChange={e => { setEmail(e.target.value); if (emailError) setEmailError(null); }}
                    />
                  </InputWrapper>
                  {emailError && <FieldError role="alert">{emailError}</FieldError>}
                </div>

                {/* Campo Senha */}
                <div>
                  <FieldLabel>Senha</FieldLabel>
                  <InputWrapper
                    $focused={passwordFocused} $error={!!passwordError}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setPasswordFocused(false); }}
                  >
                    {/* Ícone cadeado À ESQUERDA dentro do input */}
                    <Lock size={15} className="field-icon" />
                    <StyledInput
                      type={showPass ? "text" : "password"}
                      value={password} placeholder="••••••••"
                      disabled={isLoading} aria-invalid={!!passwordError}
                      onChange={e => { setPassword(e.target.value); if (passwordError) setPasswordError(null); }}
                    />
                    {/* Botão olho À DIREITA dentro do input */}
                    <EyeBtn
                      type="button" tabIndex={-1}
                      aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                      onClick={() => setShowPass(v => !v)}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </EyeBtn>
                  </InputWrapper>
                  {passwordError && <FieldError role="alert">{passwordError}</FieldError>}
                </div>

                {submitError && status === "error" && (
                  <FieldError role="alert" style={{ textAlign: "center" }}>{submitError}</FieldError>
                )}

                {/* Botão Entrar — muda cor/ícone conforme estado */}
                <SubmitBtn type="submit" disabled={isLoading} $status={status} aria-live="polite">
                  {btnMap[status].icon}
                  {btnMap[status].label}
                </SubmitBtn>

              </CardForm>

              {/* Link que abre o verso do card (flip 3D) */}
              <ForgotBtn type="button" tabIndex={flipped ? -1 : 0} onClick={() => setFlipped(true)}>
                Esqueci minha senha
              </ForgotBtn>

            </FrontFace>

            {/* ── VERSO: recuperação de senha ───────────────────────────── */}
            <BackFace $flipped={flipped} style={{ gap: "1rem" }}>

              <RecoveryIconBadge>
                <KeyRound size={28} strokeWidth={1.8} style={{ color: BRAND }} />
              </RecoveryIconBadge>

              <RecoveryTitle>Recuperar acesso</RecoveryTitle>

              {/* ← ALTERE: adapte o texto de recuperação */}
              <RecoveryText>
                Por questões de segurança, a redefinição de senha é feita pelo{" "}
                <strong>administrador da sua conta</strong> ou pelo{" "}
                <strong>nosso suporte</strong>.
              </RecoveryText>

              <RecoveryHighlight>
                <ShieldCheck size={20} strokeWidth={1.8} style={{ color: BRAND, flexShrink: 0, marginTop: 1 }} />
                <p>O administrador consegue redefinir sua senha em poucos segundos pelo painel de configurações.</p>
              </RecoveryHighlight>

              {/* ← ALTERE: WHATSAPP_URL no topo deste arquivo */}
              <WhatsAppLink href={WHATSAPP_URL} target="_blank" rel="noreferrer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                Falar com o suporte
              </WhatsAppLink>

              <BackBtn type="button" onClick={() => setFlipped(false)}>
                <ArrowLeft size={16} />
                Voltar para o login
              </BackBtn>

            </BackFace>

          </CardFlipper>
        </CardScene>

        {/* ── FOOTER (abaixo do card) ────────────────────────────────────── */}
        <CardFooter>
          {/* ← ALTERE: APP_VERSION no topo deste arquivo */}
          <FooterVersion>
            Desenvolvimento @ {new Date().getFullYear()} — {APP_VERSION}
          </FooterVersion>

          <SocialRow>
            {/* ← ALTERE: WHATSAPP_URL no topo deste arquivo */}
            <SocialBtn href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
              $bg="#f0fdf4" $border="#bbf7d0" aria-label="WhatsApp">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </SocialBtn>

            {/* ← ALTERE: INSTAGRAM_URL no topo deste arquivo */}
            <SocialBtn href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"
              $bg="#fdf2f8" $border="#fbcfe8" aria-label="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="url(#ig-grad2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <defs>
                  <linearGradient id="ig-grad2" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f09433" />
                    <stop offset="50%" stopColor="#dc2743" />
                    <stop offset="100%" stopColor="#bc1888" />
                  </linearGradient>
                </defs>
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </SocialBtn>
          </SocialRow>
        </CardFooter>

      </div>


    </Page>
  );
};

export default Auth;
