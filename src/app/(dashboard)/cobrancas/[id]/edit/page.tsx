import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/layout/app-shell";
import { CobrancaForm } from "@/components/cobrancas/cobranca-form";
import { CobrancaService } from "@/server/services/cobranca.service";
import { AppError } from "@/server/utils/errors";

type EditCobrancaPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCobrancaPage({
  params,
}: EditCobrancaPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  let cobranca;

  try {
    cobranca = await CobrancaService.findById(session.user.id, id);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <AppShell
      title={`Editar cobrança - ${cobranca.client.nome}`}
      description="Atualize os dados da cobrança."
    >
      <CobrancaForm
        mode="edit"
        cobrancaId={cobranca.id}
        defaultValues={{
          clientId: cobranca.clientId,
          valor: cobranca.valor,
          dataVencimento: cobranca.dataVencimento.toISOString().split("T")[0],
          dataPagamento: cobranca.dataPagamento
            ? cobranca.dataPagamento.toISOString().split("T")[0]
            : null,
          status: cobranca.status,
          observacoes: cobranca.observacoes,
        }}
      />
    </AppShell>
  );
}

