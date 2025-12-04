'use client';

import { FormEvent, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ClientFormProps = {
  mode: "create" | "edit";
  clientId?: string;
  defaultValues?: {
    nome?: string;
    fone?: string;
    vencimento?: number;
    valor?: number;
    observacoes?: string | null;
    ativo?: boolean;
  };
};

export function ClientForm({
  mode,
  clientId,
  defaultValues,
}: ClientFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneValue, setPhoneValue] = useState(() =>
    formatPhone(defaultValues?.fone ?? "")
  );
  const [moneyValue, setMoneyValue] = useState(() =>
    formatCurrency(defaultValues?.valor ?? 0)
  );

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 10) {
      return digits
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }

  function formatCurrency(value: number | string) {
    const digits =
      typeof value === "number"
        ? Math.round(value * 100)
        : Number(value.replace(/\D/g, "")) || 0;
    return (digits / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  const parseCurrencyToNumber = useCallback((value: string) => {
    const normalized = value
      .replace(/\./g, "")
      .replace(",", ".")
      .replace(/[^\d.]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : NaN;
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    const vencimento = Number(formData.get("vencimento"));
    const valor = parseCurrencyToNumber(moneyValue);
    const phoneDigits = phoneValue.replace(/\D/g, "");

    if (!Number.isFinite(vencimento) || !Number.isFinite(valor)) {
      setError("Preencha campos numéricos válidos.");
      setIsSubmitting(false);
      return;
    }

    if (phoneDigits.length < 10) {
      setError("Informe um telefone válido.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      nome: (formData.get("nome") as string).trim(),
      fone: phoneDigits,
      vencimento,
      valor,
      observacoes: (formData.get("observacoes") as string)?.trim() || null,
      ativo: formData.get("ativo") === "on",
    };

    const endpoint =
      mode === "create" ? "/api/clients" : `/api/clients/${clientId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || "Não foi possível salvar os dados.");
      }

      toast.success(
        mode === "create"
          ? "Cliente cadastrado com sucesso!"
          : "Cliente atualizado com sucesso!"
      );

      const redirectPath =
        mode === "create" ? "/clients" : `/clients/${clientId}`;
      router.push(redirectPath);
      router.refresh();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro inesperado. Tente novamente.";
      setError(errorMessage);
      toast.error(errorMessage);
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
          defaultValue={defaultValues?.nome}
          required
          placeholder="Ex.: João da Silva"
        />
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="fone">Telefone</Label>
          <Input
            id="fone"
            name="fone"
            value={phoneValue}
            onChange={(event) =>
              setPhoneValue(formatPhone(event.target.value))
            }
            required
            placeholder="11999990000"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="valor">Valor mensal</Label>
          <Input
            id="valor"
            name="valor"
            inputMode="decimal"
            value={moneyValue}
            onChange={(event) =>
              setMoneyValue(formatCurrency(event.target.value))
            }
            required
          />
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="vencimento">Dia de vencimento</Label>
          <Input
            id="vencimento"
            name="vencimento"
            type="number"
            min={1}
            max={31}
            defaultValue={defaultValues?.vencimento ?? 1}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="observacoes">Observações</Label>
          <textarea
            id="observacoes"
            name="observacoes"
            defaultValue={defaultValues?.observacoes || ""}
            className="min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          name="ativo"
          defaultChecked={defaultValues?.ativo ?? true}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
        />
        Cliente ativo
      </label>

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Salvando..."
            : mode === "create"
              ? "Cadastrar cliente"
              : "Salvar alterações"}
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

