import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Typewriter } from "react-simple-typewriter";


const authSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  fullName: z.string().optional(),
});

const slogans = [
  "Nunca foi tão fácil vender imóvel",
  "Nunca foi tão fácil ser corretor",
];

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) navigate("/dashboard");
    };
    checkSession();
  }, [navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % slogans.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const validation = authSchema.safeParse({
      email: email.trim(),
      password,
      fullName: fullName.trim(),
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        toast.success("Login realizado com sucesso!");
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() },
          },
        });

        if (error) throw error;

        toast.success("Cadastro realizado com sucesso!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* LADO INSTITUCIONAL */}
      <div className="hidden lg:flex flex-col justify-center px-16 bg-gradient-to-br from-primary to-primary/80 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top,_white,_transparent_60%)]" />

        <Building2 className="h-12 w-12 mb-6" />
        <h1 className="text-4xl font-bold leading-tight">
          <Typewriter
            words={[
              "Nunca foi tão fácil vender imóvel!",
              "Nunca foi tão fácil ser corretor!",
            ]}
            loop={0} // 0 = infinito
            cursor
            cursorStyle="|"
            typeSpeed={60}
            deleteSpeed={40}
            delaySpeed={2000}
          />
        </h1>

        <p className="mt-6 text-lg text-white/80 max-w-md">
          Um CRM moderno para imobiliárias que querem mais organização, mais
          vendas e uma experiência profissional para seus corretores.
        </p>
      </div>

      {/* LADO AUTENTICAÇÃO */}
      <div className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 p-4 rounded-full">
                <Building2 className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h2
              className="
    text-left
    font-semibold
    tracking-tight
    text-slate-800
    leading-tight
    text-[clamp(1.6rem,3.2vw,2.6rem)]
  "
            >
              É ótimo ter você de <br />
              <span className="font-bold text-green-600">volta!</span>
            </h2>

            <p className="text-muted-foreground">
              {isLogin ? "Entre na sua conta" : "Crie sua conta"}
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={loading}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label>Senha</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <Button className="w-full" disabled={loading}>
                {loading ? "Aguarde..." : isLogin ? "Entrar" : "Criar conta"}
              </Button>
            </form>

            {/* BOTÃO WHATSAPP – MANTIDO */}
            <button
              onClick={() =>
                window.open(
                  "https://wa.me/5564992957973?text=Ol%C3%A1%2C%20quero%20me%20cadastrar%20no%20CRM%20Im%C3%B3veis",
                  "_blank"
                )
              }
              disabled={loading}
              className="
                mt-6
                w-full
                py-2
                text-sm
                font-medium
                rounded-lg
                bg-green-600
                text-white
                hover:bg-green-700
                transition
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
            >
              Não tem uma conta? Cadastre-se
            </button>

            <div className="mt-4 text-center">

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
