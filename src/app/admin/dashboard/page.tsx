import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";

const adminShortcuts = [
  {
    title: "Gerenciar usuários",
    description: "Ative/inative contas e gere tokens de integração.",
    href: "/admin/users",
  },
  {
    title: "Integração n8n",
    description: "Consulte as rotas de cobrança utilizadas pelo n8n.",
    href: "/api/integrations/cobrancas",
  },
];

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <AppShell
      title="Dashboard Administrativo"
      description={`Bem-vindo, ${session.user.name ?? "admin"}. Acompanhe integrações e usuários.`}
    >
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Integrações</h2>
          <p className="text-sm text-muted-foreground">
            Monitore envios automáticos e tokens ativos.
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Tokens registrados</dt>
              <dd className="font-semibold">via tela de usuários</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Tentativas por cobrança</dt>
              <dd className="font-semibold">Até 3 envios</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Checklist rápido</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li>✓ Revise tokens antigos e revogue os não usados</li>
            <li>✓ Garanta que o n8n está consumindo o endpoint paginado</li>
            <li>✓ Compartilhe novos tokens apenas via canal seguro</li>
          </ul>
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold">Atalhos administrativos</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {adminShortcuts.map((shortcut) => (
            <Link
              key={shortcut.href}
              href={shortcut.href}
              className="rounded-2xl border bg-card/70 p-5 transition hover:border-primary/30"
            >
              <p className="font-medium">{shortcut.title}</p>
              <p className="text-sm text-muted-foreground">
                {shortcut.description}
              </p>
              <Button variant="link" className="mt-2 px-0" asChild>
                <span>Acessar</span>
              </Button>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

