import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/layout/app-shell";
import { ClientForm } from "@/components/clients/client-form";
import { ClientService } from "@/server/services/client.service";
import { AppError } from "@/server/utils/errors";

type EditClientPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditClientPage({ params }: EditClientPageProps) {
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
      title={`Editar ${client.nome}`}
      description="Atualize dados cadastrais e condições do contrato."
    >
      <ClientForm
        mode="edit"
        clientId={client.id}
        defaultValues={{
          nome: client.nome,
          fone: client.fone,
          vencimento: client.vencimento,
          valor: client.valor,
          observacoes: client.observacoes,
          ativo: client.ativo,
        }}
      />
    </AppShell>
  );
}

