import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/layout/app-shell";
import { ChangePasswordForm } from "@/components/account/change-password-form";

export default async function ChangePasswordPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <AppShell
      title="Definir nova senha"
      description="Altere sua senha de acesso com segurança."
    >
      <ChangePasswordForm />
    </AppShell>
  );
}


