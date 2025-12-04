import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/layout/app-shell";
import { ClientForm } from "@/components/clients/client-form";

export default async function NewClientPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <AppShell
      title="Novo cliente"
      description="Cadastre um cliente para começar a lançar cobranças."
    >
      <ClientForm mode="create" />
    </AppShell>
  );
}

