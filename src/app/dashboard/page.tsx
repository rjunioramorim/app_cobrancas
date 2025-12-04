import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Users, Receipt, Shield } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";
import { DashboardService } from "@/server/services/dashboard.service";

const shortcuts = [
  {
    title: "Cadastrar cliente",
    description: "Comece criando o cadastro e anexando informações chave.",
    href: "/clients/new",
  },
  {
    title: "Registrar cobrança",
    description: "Controle valores, vencimentos e notificações automáticas.",
    href: "/cobrancas/new",
  },
];

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const stats = await DashboardService.getStats(session.user.id);

  const cards = [
    {
      title: "Clientes ativos",
      value: stats.activeClients,
      change: `${stats.totalClients} no total`,
      icon: Users,
    },
    {
      title: "Recebível pendente",
      value: DashboardService.formatCurrency(stats.pendingAmount),
      change: `${stats.overdueCount} cobranças em atraso`,
      icon: Receipt,
    },
    {
      title: "Recebido no mês",
      value: DashboardService.formatCurrency(stats.paidThisMonth),
      change: `Atraso: ${DashboardService.formatCurrency(
        stats.overdueAmount
      )}`,
      icon: Shield,
    },
  ];

  const actionItems = [
    {
      title: "Clientes sem cobrança",
      value: stats.clientsWithoutCharges,
      description: "Cadastros aguardam a primeira cobrança.",
    },
    {
      title: "Cobranças vencendo (7 dias)",
      value: stats.chargesDueSoon,
      description: "Envie lembretes antes do vencimento.",
    },
    {
      title: "Cobranças atrasadas",
      value: stats.overdueCount,
      description: "Priorize renegociação ou contato.",
    },
  ];

  return (
    <AppShell
      title="Visão geral"
      description={`Acompanhe rapidamente os dados mais importantes${session.user?.name ? `, ${session.user.name}` : ""
        }.`}
      actions={
        <Button asChild>
          <Link href="/cobrancas/new">
            Nova cobrança
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      }
    >
      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="rounded-xl border bg-card p-4 shadow-sm"
            >
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{stat.title}</span>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-3 text-2xl font-semibold">{stat.value}</div>
              <p className="text-sm text-muted-foreground">{stat.change}</p>
            </div>
          );
        })}
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-card/70 p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Próximas ações</h2>
          <p className="text-sm text-muted-foreground">
            Foque no que precisa de atenção imediata.
          </p>
          <ul className="mt-6 space-y-4 text-sm">
            {actionItems.map((item) => (
              <li
                key={item.title}
                className="flex items-center justify-between rounded-lg bg-muted/40 p-3"
              >
                <div>
                  <p className="font-medium">{item.title}</p>
                  <span className="text-muted-foreground">{item.description}</span>
                </div>
                <span className="text-lg font-semibold">{item.value}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border bg-card/70 p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Atalhos rápidos</h2>
          <div className="mt-4 space-y-3">
            {shortcuts.map((shortcut) => (
              <Link
                key={shortcut.href}
                href={shortcut.href}
                className="block rounded-xl border border-transparent bg-muted/40 p-4 transition-colors hover:border-primary/40"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{shortcut.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {shortcut.description}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
