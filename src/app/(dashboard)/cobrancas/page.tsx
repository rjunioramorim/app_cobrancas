import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { CobrancaService } from "@/server/services/cobranca.service";
import { MonthFilter } from "@/components/cobrancas/month-filter";
import { StatusFilter } from "@/components/cobrancas/status-filter";
import { ClientNameFilter } from "@/components/cobrancas/client-name-filter";
import { MarkAsPaidButton } from "@/components/cobrancas/mark-as-paid-button";
import { Plus, Receipt } from "lucide-react";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const statusLabels: Record<string, string> = {
  PENDENTE: "Pendente",
  ATRASADO: "Atrasado",
  PAGO: "Pago",
  CANCELADO: "Cancelado",
};

const statusColors: Record<string, string> = {
  PENDENTE: "bg-yellow-100 text-yellow-800",
  ATRASADO: "bg-orange-100 text-orange-800",
  PAGO: "bg-emerald-100 text-emerald-800",
  CANCELADO: "bg-gray-100 text-gray-800",
};

type CobrancasPageProps = {
  searchParams: Promise<{ month?: string; status?: string; clientName?: string }>;
};

export default async function CobrancasPage({
  searchParams,
}: CobrancasPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = await searchParams;
  const month = params.month;
  const status = params.status;
  const clientName = params.clientName;

  let filters: { startDate?: Date; endDate?: Date; status?: string; clientName?: string } = {};

  if (month) {
    const [year, monthNum] = month.split("-").map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    // Último dia do mês: new Date(year, monthNum, 0) retorna o último dia do mês monthNum-1
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);
    filters.startDate = startDate;
    filters.endDate = endDate;
  } else {
    // Padrão: do início do mês até hoje
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    filters.startDate = startDate;
    filters.endDate = endDate;
  }

  if (status && status !== "todos") {
    filters.status = status;
  }

  if (clientName && clientName.trim()) {
    filters.clientName = clientName.trim();
  }

  const cobrancas = await CobrancaService.list(session.user.id, filters);

  const totalPendente = cobrancas
    .filter((c) => c.status === "PENDENTE" || c.status === "ATRASADO")
    .reduce((acc, c) => acc + c.valorDivida, 0);

  const totalPago = cobrancas
    .filter((c) => c.status === "PAGO")
    .reduce((acc, c) => acc + (c.valorPago || c.valorDivida), 0);

  return (
    <AppShell
      title="Cobranças"
      description="Gerencie todas as cobranças e acompanhe os pagamentos."
      actions={
        <Button asChild>
          <Link href="/cobrancas/new">
            <Plus className="mr-2 h-4 w-4" />
            Nova cobrança
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <MonthFilter />
            <StatusFilter />
            <ClientNameFilter />
          </div>
        </div>

        {cobrancas.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-muted/30 p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Receipt className="h-5 w-5 text-muted-foreground" />
            </div>
            <h2 className="mt-4 text-xl font-semibold">
              {month ? "Nenhuma cobrança neste período" : "Nenhuma cobrança ainda"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {month
                ? "Tente selecionar outro mês ou cadastre uma nova cobrança."
                : "Cadastre sua primeira cobrança para começar a controlar os pagamentos."}
            </p>
            <Button asChild className="mt-6">
              <Link href="/cobrancas/new">Cadastrar cobrança</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <p className="text-sm text-muted-foreground">Total pendente</p>
              <p className="mt-2 text-2xl font-semibold">
                {currencyFormatter.format(totalPendente)}
              </p>
            </div>
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <p className="text-sm text-muted-foreground">Total pago</p>
              <p className="mt-2 text-2xl font-semibold">
                {currencyFormatter.format(totalPago)}
              </p>
            </div>
            <div className="rounded-2xl border bg-card p-4 shadow-sm sm:col-span-2 lg:col-span-1">
              <p className="text-sm text-muted-foreground">Total de cobranças</p>
              <p className="mt-2 text-2xl font-semibold">{cobrancas.length}</p>
            </div>
          </div>

          {/* Desktop: Tabela */}
          <div className="hidden overflow-hidden rounded-2xl border bg-card shadow-sm md:block">
            <table className="min-w-full divide-y text-sm">
              <thead className="bg-muted/40 text-left font-medium text-muted-foreground">
                <tr>
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Valor</th>
                  <th className="px-6 py-3">Vencimento</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {cobrancas.map((cobranca) => (
                  <tr key={cobranca.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <div className="font-medium">{cobranca.client.nome}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold">
                        {currencyFormatter.format(cobranca.valorDivida)}
                      </div>
                      {cobranca.valorPago !== null && (
                        <div className="text-xs text-emerald-600 mt-1">
                          Pago: {currencyFormatter.format(cobranca.valorPago)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {dateFormatter.format(new Date(cobranca.dataVencimento))}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[cobranca.status] || statusColors.PENDENTE}`}
                      >
                        {statusLabels[cobranca.status] || cobranca.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {cobranca.status !== "PAGO" && cobranca.status !== "CANCELADO" && (
                          <MarkAsPaidButton
                            cobrancaId={cobranca.id}
                            currentStatus={cobranca.status}
                            valorCobranca={cobranca.valorDivida}
                            size="sm"
                            variant="default"
                          />
                        )}
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/cobrancas/${cobranca.id}`}>Detalhes</Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: Cards */}
          <div className="grid gap-4 md:hidden">
            {cobrancas.map((cobranca) => (
              <div
                key={cobranca.id}
                className="rounded-2xl border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{cobranca.client.nome}</h3>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Valor da dívida</span>
                        <span className="font-semibold">
                          {currencyFormatter.format(cobranca.valorDivida)}
                        </span>
                      </div>
                      {cobranca.valorPago !== null && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Valor pago</span>
                          <span className="font-semibold text-emerald-600">
                            {currencyFormatter.format(cobranca.valorPago)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Vencimento</span>
                        <span className="font-medium">
                          {dateFormatter.format(new Date(cobranca.dataVencimento))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[cobranca.status] || statusColors.PENDENTE}`}
                        >
                          {statusLabels[cobranca.status] || cobranca.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  {cobranca.status !== "PAGO" && cobranca.status !== "CANCELADO" && (
                    <MarkAsPaidButton
                      cobrancaId={cobranca.id}
                      currentStatus={cobranca.status}
                      valorCobranca={cobranca.valorDivida}
                      size="sm"
                      variant="default"
                    />
                  )}
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={`/cobrancas/${cobranca.id}`}>Ver detalhes</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

