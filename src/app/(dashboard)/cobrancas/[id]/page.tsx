import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { CobrancaService } from "@/server/services/cobranca.service";
import { AppError } from "@/server/utils/errors";
import { MarkAsPaidButton } from "@/components/cobrancas/mark-as-paid-button";
import { Pencil, ArrowLeft } from "lucide-react";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
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

type CobrancaDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CobrancaDetailsPage({
  params,
}: CobrancaDetailsPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  let cobranca;

  try {
    cobranca = await CobrancaService.findById(session.user.id, id);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <AppShell
      title={`Cobrança - ${cobranca.client.nome}`}
      description={`Valor: ${currencyFormatter.format(cobranca.valor)}`}
      actions={
        <>
          <Button variant="outline" asChild>
            <Link href="/cobrancas">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
          {cobranca.status !== "PAGO" && cobranca.status !== "CANCELADO" && (
            <MarkAsPaidButton
              cobrancaId={cobranca.id}
              currentStatus={cobranca.status}
              valorCobranca={cobranca.valorDivida}
            />
          )}
          <Button asChild>
            <Link href={`/cobrancas/${cobranca.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </>
      }
    >
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6 shadow-sm md:col-span-2">
          <h2 className="text-lg font-semibold">Informações</h2>
          <dl className="mt-4 grid gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Cliente</dt>
              <dd className="text-base font-medium">{cobranca.client.nome}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Valor da dívida</dt>
              <dd className="text-base font-medium">
                {currencyFormatter.format(cobranca.valorDivida)}
              </dd>
            </div>
            {cobranca.valorPago !== null && (
              <div>
                <dt className="text-muted-foreground">Valor pago</dt>
                <dd className="text-base font-medium text-emerald-600">
                  {currencyFormatter.format(cobranca.valorPago)}
                </dd>
              </div>
            )}
            {cobranca.valorPago !== null && cobranca.valorPago !== cobranca.valorDivida && (
              <div>
                <dt className="text-muted-foreground">Diferença</dt>
                <dd className={`text-base font-medium ${
                  cobranca.valorPago < cobranca.valorDivida 
                    ? 'text-orange-600' 
                    : 'text-emerald-600'
                }`}>
                  {currencyFormatter.format(cobranca.valorPago - cobranca.valorDivida)}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground">Data de vencimento</dt>
              <dd className="text-base font-medium">
                {dateFormatter.format(new Date(cobranca.dataVencimento))}
              </dd>
            </div>
            {cobranca.dataPagamento ? (
              <div>
                <dt className="text-muted-foreground">Data de pagamento</dt>
                <dd className="text-base font-medium">
                  {dateFormatter.format(new Date(cobranca.dataPagamento))}
                </dd>
              </div>
            ) : null}
            {cobranca.observacoes ? (
              <div>
                <dt className="text-muted-foreground">Observações</dt>
                <dd className="text-base">{cobranca.observacoes}</dd>
              </div>
            ) : null}
          </dl>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Status</h2>
          <p
            className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusColors[cobranca.status] || statusColors.PENDENTE}`}
          >
            {statusLabels[cobranca.status] || cobranca.status}
          </p>
          {cobranca.status !== "PAGO" && cobranca.status !== "CANCELADO" && (
            <div className="mt-6">
              <MarkAsPaidButton
                cobrancaId={cobranca.id}
                currentStatus={cobranca.status}
                valorCobranca={cobranca.valorDivida}
                variant="default"
              />
            </div>
          )}
          <p className="mt-6 text-sm text-muted-foreground">
            Cobrança criada em{" "}
            {dateFormatter.format(new Date(cobranca.createdAt))}
          </p>
          <p className="text-sm text-muted-foreground">
            Última atualização em{" "}
            {dateFormatter.format(new Date(cobranca.updatedAt))}
          </p>
        </div>
      </div>
    </AppShell>
  );
}

