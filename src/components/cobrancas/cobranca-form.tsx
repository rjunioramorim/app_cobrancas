'use client';

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Client = {
  id: string;
  nome: string;
};

type CobrancaFormProps = {
  mode: "create" | "edit";
  cobrancaId?: string;
  defaultValues?: {
    clientId?: string;
    valor?: number;
    dataVencimento?: string;
    dataPagamento?: string | null;
    status?: string;
    observacoes?: string | null;
  };
};

export function CobrancaForm({
  mode,
  cobrancaId,
  defaultValues,
}: CobrancaFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [moneyValue, setMoneyValue] = useState(() =>
    formatCurrency(defaultValues?.valor ?? 0)
  );

  useEffect(() => {
    async function loadClients() {
      try {
        const response = await fetch("/api/clients");
        if (response.ok) {
          const data = await response.json();
          setClients(data);
        }
      } catch (err) {
        toast.error("Erro ao carregar clientes");
      } finally {
        setLoadingClients(false);
      }
    }
    loadClients();
  }, []);

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

    const clientId = formData.get("clientId") as string;
    const valor = parseCurrencyToNumber(moneyValue);
    const dataVencimento = formData.get("dataVencimento") as string;
    const dataPagamento = formData.get("dataPagamento") as string;
    const status = formData.get("status") as string;

    if (!clientId) {
      setError("Selecione um cliente.");
      setIsSubmitting(false);
      return;
    }

    if (!Number.isFinite(valor) || valor <= 0) {
      setError("Informe um valor válido.");
      setIsSubmitting(false);
      return;
    }

    if (!dataVencimento) {
      setError("Informe a data de vencimento.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      clientId,
      valor,
      dataVencimento: new Date(dataVencimento).toISOString(),
      dataPagamento: dataPagamento ? new Date(dataPagamento).toISOString() : null,
      status: status || "PENDENTE",
      observacoes: (formData.get("observacoes") as string)?.trim() || null,
    };

    const endpoint =
      mode === "create" ? "/api/cobrancas" : `/api/cobrancas/${cobrancaId}`;
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
          ? "Cobrança cadastrada com sucesso!"
          : "Cobrança atualizada com sucesso!"
      );

      const redirectPath =
        mode === "create" ? "/cobrancas" : `/cobrancas/${cobrancaId}`;
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

  const formatDateForInput = (date?: string | null) => {
    if (!date) return "";
    try {
      return new Date(date).toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-2xl space-y-6 rounded-2xl border bg-card p-6 shadow-sm"
    >
      <div className="grid gap-2">
        <Label htmlFor="clientId">Cliente *</Label>
        <select
          id="clientId"
          name="clientId"
          required
          disabled={loadingClients || mode === "edit"}
          defaultValue={defaultValues?.clientId}
          className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Selecione um cliente</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="valor">Valor *</Label>
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
        <div className="flex flex-col gap-2">
          <Label htmlFor="dataVencimento">Data de vencimento *</Label>
          <Input
            id="dataVencimento"
            name="dataVencimento"
            type="date"
            defaultValue={formatDateForInput(defaultValues?.dataVencimento)}
            required
          />
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="dataPagamento">Data de pagamento</Label>
          <Input
            id="dataPagamento"
            name="dataPagamento"
            type="date"
            defaultValue={formatDateForInput(defaultValues?.dataPagamento)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={defaultValues?.status || "PENDENTE"}
            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="PENDENTE">Pendente</option>
            <option value="ATRASADO">Atrasado</option>
            <option value="PAGO">Pago</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="observacoes">Observações</Label>
        <textarea
          id="observacoes"
          name="observacoes"
          defaultValue={defaultValues?.observacoes || ""}
          className="min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

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
            ? "Cadastrar cobrança"
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

