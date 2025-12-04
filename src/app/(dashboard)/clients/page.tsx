import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { ClientService } from "@/server/services/client.service";
import { ClientFilters } from "@/components/clients/client-filters";
import { ClientStatusToggle } from "@/components/clients/client-status-toggle";
import { Plus, Users } from "lucide-react";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
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

type ClientsPageProps = {
  searchParams: Promise<{ search?: string; status?: string }>;
};

export default async function ClientsPage({
  searchParams,
}: ClientsPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = await searchParams;
  const search = params.search;
  const status = (params.status as "ativo" | "inativo" | "todos") || "todos";

  const filters = {
    search,
    status,
  };

  const clients = await ClientService.list(session.user.id, filters);

  return (
    <AppShell
      title="Clientes"
      description="Gerencie a base de clientes e acompanhe seus contratos."
      actions={
        <Button asChild>
          <Link href="/clients/new">
            <Plus className="mr-2 h-4 w-4" />
            Novo cliente
          </Link>
        </Button>
      }
    >
      {clients.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/30 p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-xl font-semibold">Nenhum cliente ainda</h2>
          <p className="text-sm text-muted-foreground">
            Cadastre seu primeiro cliente para começar a registrar cobranças.
          </p>
          <Button asChild className="mt-6">
            <Link href="/clients/new">Cadastrar cliente</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <ClientFilters />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <p className="text-sm text-muted-foreground">Total de clientes</p>
              <p className="mt-2 text-2xl font-semibold">{clients.length}</p>
            </div>
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <p className="text-sm text-muted-foreground">Ticket médio</p>
              <p className="mt-2 text-2xl font-semibold">
                {currencyFormatter.format(
                  clients.reduce((acc, client) => acc + client.valor, 0) /
                    clients.length
                )}
              </p>
            </div>
            <div className="rounded-2xl border bg-card p-4 shadow-sm sm:col-span-2 lg:col-span-1">
              <p className="text-sm text-muted-foreground">Ativos</p>
              <p className="mt-2 text-2xl font-semibold">
                {
                  clients.filter((client) => client.ativo).length
                }{" "}
                ativos
              </p>
            </div>
          </div>

          {/* Desktop: Tabela */}
          <div className="hidden overflow-hidden rounded-2xl border bg-card shadow-sm md:block">
            <table className="min-w-full divide-y text-sm">
              <thead className="bg-muted/40 text-left font-medium text-muted-foreground">
                <tr>
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Telefone</th>
                  <th className="px-6 py-3">Valor</th>
                  <th className="px-6 py-3">Vencimento</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <div className="font-medium">{client.nome}</div>
                    </td>
                    <td className="px-6 py-4">{formatPhone(client.fone)}</td>
                    <td className="px-6 py-4">
                      {currencyFormatter.format(client.valor)}
                    </td>
                    <td className="px-6 py-4">Dia {client.vencimento}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <ClientStatusToggle
                          clientId={client.id}
                          clientName={client.nome}
                          currentStatus={client.ativo}
                        />
                        <span className="text-xs text-muted-foreground">
                          {client.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/clients/${client.id}`}>Detalhes</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: Cards */}
          <div className="grid gap-4 md:hidden">
            {clients.map((client) => (
              <div
                key={client.id}
                className="rounded-2xl border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{client.nome}</h3>
                    </div>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Telefone</span>
                        <span className="font-medium">
                          {formatPhone(client.fone)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Valor</span>
                        <span className="font-semibold">
                          {currencyFormatter.format(client.valor)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Vencimento</span>
                        <span className="font-medium">Dia {client.vencimento}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <div className="flex items-center gap-2">
                          <ClientStatusToggle
                            clientId={client.id}
                            clientName={client.nome}
                            currentStatus={client.ativo}
                          />
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              client.ativo
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {client.ativo ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={`/clients/${client.id}`}>Ver detalhes</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}

