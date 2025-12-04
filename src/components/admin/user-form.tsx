'use client';

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Role } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type UserFormProps = {
  onSuccessRedirectTo?: string;
};

export function UserForm({ onSuccessRedirectTo = "/admin/users" }: UserFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(Role.USER);
  const [isActive, setIsActive] = useState(true);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    const payload = {
      nome: (formData.get("nome") as string)?.trim(),
      email: (formData.get("email") as string)?.trim(),
      password: formData.get("password") as string,
      role,
      isActive,
    };

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          body?.message || "Não foi possível criar o usuário. Tente novamente.";
        throw new Error(message);
      }

      toast.success("Usuário criado com sucesso!");
      router.push(onSuccessRedirectTo);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro inesperado ao criar usuário. Tente novamente.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-2xl space-y-6 rounded-2xl border bg-card p-6 shadow-sm"
    >
      <div className="grid gap-2">
        <Label htmlFor="nome">Nome completo</Label>
        <Input
          id="nome"
          name="nome"
          required
          placeholder="Ex.: João da Silva"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder="usuario@exemplo.com"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password">Senha inicial</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="Defina uma senha segura"
        />
        <p className="text-xs text-muted-foreground">
          A senha pode ser alterada posteriormente pelo próprio usuário (via fluxo que você definir).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="role">Perfil</Label>
          <select
            id="role"
            name="role"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={role}
            onChange={(event) => setRole(event.target.value as Role)}
          >
            <option value={Role.USER}>Usuário</option>
            <option value={Role.ADMIN}>Administrador</option>
          </select>
          <p className="text-xs text-muted-foreground">
            Apenas administradores podem acessar a área /admin.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Estado</Label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            Usuário ativo
          </label>
          <p className="text-xs text-muted-foreground">
            Usuários inativos não conseguem fazer login nem utilizar tokens de API.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Cadastrar usuário"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}


