import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ApiTokenController } from "@/server/controllers/api-token.controller";
import { AppShell } from "@/components/layout/app-shell";
import { AdminUsersTable } from "@/components/admin/admin-users-table";
import { Button } from "@/components/ui/button";

const DEFAULT_LIMIT = 20;

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const initial = await ApiTokenController.listUsers({
    limit: DEFAULT_LIMIT,
  });

  const initialUsers = initial.users.map((user) => ({
    id: user.id,
    nome: user.nome,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    tokens: user.tokens,
  }));

  return (
    <AppShell
      title="Usuários e API Keys"
      description="Gerencie tokens de acesso utilizados em integrações externas."
      actions={
        <Button asChild>
          <Link href="/admin/users/new">Novo usuário</Link>
        </Button>
      }
    >
      <AdminUsersTable
        initialUsers={initialUsers}
        initialPagination={{
          limit: DEFAULT_LIMIT,
          nextCursor: initial.nextCursor,
          hasNextPage: initial.hasNextPage,
        }}
      />
    </AppShell>
  );
}

