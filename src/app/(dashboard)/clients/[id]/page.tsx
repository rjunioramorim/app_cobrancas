import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { ClientService } from "@/server/services/client.service";
import { AppError } from "@/server/utils/errors";
import { Receipt, Pencil, ArrowLeft } from "lucide-react";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
};

type ClientDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ClientDetailsPage({
  params,
}: ClientDetailsPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  let client;

  try {
    client = await ClientService.findById(session.user.id, id);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <AppShell
      title={client.nome}
      description={`Cliente ${client.ativo ? "ativo" : "inativo"} · Dia ${
        client.vencimento
      }`}
      actions={
        <>
          <Button variant="outline" asChild>
            <Link href="/clients">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/clients/${client.id}/edit`}>
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
              <dt className="text-muted-foreground">Telefone</dt>
              <dd className="text-base font-medium">
                {formatPhone(client.fone)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Valor mensal</dt>
              <dd className="text-base font-medium">
                {currencyFormatter.format(client.valor)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Vencimento</dt>
              <dd className="text-base font-medium">Dia {client.vencimento}</dd>
            </div>
            {client.observacoes ? (
              <div>
                <dt className="text-muted-foreground">Observações</dt>
                <dd className="text-base">{client.observacoes}</dd>
              </div>
            ) : null}
          </dl>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Status</h2>
          <p
            className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-medium ${
              client.ativo
                ? "bg-emerald-100 text-emerald-800"
                : "bg-rose-100 text-rose-800"
            }`}
          >
            {client.ativo ? "Ativo" : "Inativo"}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Contrato criado em{" "}
            {dateFormatter.format(new Date(client.createdAt))}
          </p>
          <p className="text-sm text-muted-foreground">
            Última atualização em{" "}
            {dateFormatter.format(new Date(client.updatedAt))}
          </p>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Cobranças recentes</h2>
            <p className="text-sm text-muted-foreground">
              Últimas movimentações vinculadas a este cliente.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/cobrancas/new">
              <Receipt className="mr-2 h-4 w-4" />
              Nova cobrança
            </Link>
          </Button>
        </div>
        {client.cobrancas.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Nenhuma cobrança cadastrada para este cliente ainda.
          </p>
        ) : (
          <div className="mt-6 overflow-hidden rounded-xl border">
            <table className="min-w-full divide-y text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left">Valor</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Vencimento</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {client.cobrancas.map((cobranca) => (
                  <tr key={cobranca.id}>
                    <td className="px-4 py-3 font-semibold">
                      {currencyFormatter.format(cobranca.valor)}
                    </td>
                    <td className="px-4 py-3 capitalize">{cobranca.status.toLowerCase()}</td>
                    <td className="px-4 py-3">
                      {dateFormatter.format(new Date(cobranca.dataVencimento))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}

