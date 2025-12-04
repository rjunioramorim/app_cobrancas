import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/layout/app-shell";
import { CobrancaForm } from "@/components/cobrancas/cobranca-form";

export default async function NewCobrancaPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <AppShell
      title="Nova cobrança"
      description="Cadastre uma nova cobrança para um cliente."
    >
      <CobrancaForm mode="create" />
    </AppShell>
  );
}

