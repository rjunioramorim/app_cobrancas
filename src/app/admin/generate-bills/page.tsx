"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Calendar, CheckCircle2, XCircle, AlertCircle, Users } from "lucide-react";

type User = {
  id: string;
  nome: string;
  email: string;
};

export default function GenerateBillsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [result, setResult] = useState<{
    total: number;
    created: number;
    duplicates: number;
    errors: number;
    errorDetails: Array<{ clientId: string; clientName: string; error: string }>;
    targetMonth: number;
    targetYear: number;
    user?: { id: string; nome: string; email: string };
  } | null>(null);

  // Calcula o próximo mês como padrão
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const defaultMonth = String(nextMonth.getMonth() + 1).padStart(2, "0");
  const defaultYear = String(nextMonth.getFullYear());

  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);

  // Carrega lista de usuários
  useEffect(() => {
    async function loadUsers() {
      try {
        const response = await fetch("/api/admin/users?limit=100");
        if (response.ok) {
          const data = await response.json();
          setUsers(data.data || []);
        }
      } catch (error) {
        toast.error("Erro ao carregar usuários");
      } finally {
        setLoadingUsers(false);
      }
    }
    loadUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const endpoint = selectedUserId
        ? `/api/admin/generate-bills/${selectedUserId}`
        : "/api/admin/generate-bills";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          month: Number(month),
          year: Number(year),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Erro ao gerar cobranças");
        setLoading(false);
        return;
      }

      toast.success(data.message || "Cobranças geradas com sucesso!");
      setResult({
        ...data.result,
        user: data.user,
      });
      router.refresh();
    } catch (error) {
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      title="Gerar Cobranças Mensais"
      description="Gere cobranças automaticamente para todos os clientes ativos baseado no dia de vencimento."
    >
      <div className="space-y-6">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId">Usuário (opcional)</Label>
              <select
                id="userId"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                disabled={loading || loadingUsers}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Todos os usuários</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.nome} ({user.email})
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                {selectedUserId
                  ? "Gera cobranças apenas para os clientes do usuário selecionado"
                  : "Gera cobranças para todos os clientes ativos de todos os usuários"}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="month">Mês</Label>
                <Input
                  id="month"
                  type="number"
                  min="1"
                  max="12"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Ex: 12"
                />
                <p className="text-xs text-muted-foreground">
                  Mês alvo para gerar as cobranças (1-12)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Ano</Label>
                <Input
                  id="year"
                  type="number"
                  min="2000"
                  max="2100"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Ex: 2025"
                />
                <p className="text-xs text-muted-foreground">
                  Ano alvo para gerar as cobranças
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-dashed bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1 space-y-1 text-sm">
                  <p className="font-medium">Como funciona:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>
                      {selectedUserId
                        ? "Gera cobranças apenas para os clientes ativos do usuário selecionado"
                        : "Gera cobranças para todos os clientes ativos de todos os usuários"}
                    </li>
                    <li>Usa o dia de vencimento configurado em cada cliente</li>
                    <li>Trata casos especiais (ex: dia 31 em fevereiro → último dia do mês)</li>
                    <li>Evita duplicidade verificando se já existe cobrança com a mesma data</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando cobranças...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Gerar Cobranças
                </>
              )}
            </Button>
          </form>
        </div>

        {result && (
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Resultado da Geração</h3>
            <div className="space-y-4">
              {result.user && (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Usuário
                  </div>
                  <p className="mt-2 text-lg font-semibold">
                    {result.user.nome} ({result.user.email})
                  </p>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Período
                  </div>
                  <p className="mt-2 text-2xl font-semibold">
                    {String(result.targetMonth).padStart(2, "0")}/{result.targetYear}
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Criadas
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-emerald-600">
                    {result.created}
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <XCircle className="h-4 w-4 text-yellow-600" />
                    Duplicadas
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-yellow-600">
                    {result.duplicates}
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    Erros
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-red-600">
                    {result.errors}
                  </p>
                </div>
              </div>

              {result.errorDetails.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-4">
                  <p className="font-medium text-sm text-red-900 dark:text-red-100 mb-2">
                    Detalhes dos erros:
                  </p>
                  <ul className="space-y-1 text-xs text-red-800 dark:text-red-200">
                    {result.errorDetails.map((error, index) => (
                      <li key={index}>
                        <strong>{error.clientName}</strong>: {error.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

