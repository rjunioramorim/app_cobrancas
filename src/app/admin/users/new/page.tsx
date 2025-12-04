import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/layout/app-shell";
import { UserForm } from "@/components/admin/user-form";

export default async function AdminNewUserPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <AppShell
      title="Novo usuário"
      description="Cadastre um novo usuário do sistema. Apenas administradores podem acessar esta página."
    >
      <UserForm />
    </AppShell>
  );
}


