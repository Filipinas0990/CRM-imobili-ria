import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { orgService } from "@/services/org.service";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";
import { Building2, Loader2, CheckCircle2, LogIn } from "lucide-react";

const AceitarConvite = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";
  const { user, accessToken, setAccessToken } = useAuthStore();

  const [orgName, setOrgName] = useState<string | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Token de convite inválido.");
      setLoadingInvite(false);
      return;
    }

    orgService.getInviteByToken(token)
      .then((inv) => setOrgName(inv.org_name))
      .catch(() => setError("Convite inválido ou expirado."))
      .finally(() => setLoadingInvite(false));
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const { access_token } = await orgService.acceptInvite(token);
      setAccessToken(access_token);
      toast.success("Convite aceito! Você agora faz parte da imobiliária.");
      navigate("/dashboard");
    } catch {
      toast.error("Erro ao aceitar convite. Tente novamente.");
    } finally {
      setAccepting(false);
    }
  };

  const handleLogin = () => {
    localStorage.setItem("convite_token", token);
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f8fc] p-6">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-1.5">
            <span style={{ fontWeight: 900, letterSpacing: "-0.04em", color: "#1653cc" }} className="text-2xl leading-none">
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
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8 text-center">
          {loadingInvite ? (
            <div className="py-8 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              <p className="text-slate-500 text-sm">Verificando convite...</p>
            </div>
          ) : error ? (
            <div className="py-8">
              <p className="text-red-500 font-medium">{error}</p>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Building2 className="w-7 h-7 text-blue-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 mb-2">Você foi convidado!</h1>
              <p className="text-slate-500 text-sm mb-6">
                <span className="font-semibold text-slate-700">{orgName}</span> convidou você para fazer parte da equipe de corretores.
              </p>

              {accessToken && user ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 justify-center text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Logado como <span className="font-medium">{user.name}</span>
                  </div>
                  <button
                    onClick={handleAccept}
                    disabled={accepting}
                    className="w-full h-11 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-60"
                    style={{ background: "#1653cc" }}
                  >
                    {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Aceitar convite
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-slate-500 text-sm">Faça login para aceitar o convite.</p>
                  <button
                    onClick={handleLogin}
                    className="w-full h-11 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
                    style={{ background: "#1653cc" }}
                  >
                    <LogIn className="h-4 w-4" />
                    Fazer login
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AceitarConvite;
