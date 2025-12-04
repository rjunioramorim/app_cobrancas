"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const { update } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Erro ao fazer login");
        setLoading(false);
        return;
      }

      // Atualizar a sessão no cliente
      await update();
      
      // Aguardar um pouco para garantir que a sessão foi atualizada
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Buscar a sessão para obter o role do usuário
      const sessionResponse = await fetch("/api/auth/session");
      const session = await sessionResponse.json();

      // Se desejar, poderíamos usar mustChangePassword futuramente aqui
      // para forçar um redirecionamento para /account/change-password.

      // Redirecionar baseado no role usando window.location para garantir reload completo
      if (session?.user?.role === "ADMIN") {
        window.location.href = "/admin/dashboard";
      } else {
        window.location.href = "/dashboard";
      }

      toast(
        "Dica de segurança",
        {
          description:
            "Recomendada a troca periódica da sua senha. Acesse a tela de alteração em Configurações.",
        }
      );
    } catch (err) {
      setError("Erro ao conectar com o servidor");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-md space-y-8 rounded-lg border bg-white p-8 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
            Login
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Entre com suas credenciais
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive dark:bg-destructive/20">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}

