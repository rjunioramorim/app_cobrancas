'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { PaymentDialog } from "./payment-dialog";

type MarkAsPaidButtonProps = {
  cobrancaId: string;
  currentStatus: string;
  valorCobranca: number;
  disabled?: boolean;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "outline" | "secondary";
};

export function MarkAsPaidButton({
  cobrancaId,
  currentStatus,
  valorCobranca,
  disabled = false,
  size = "default",
  variant = "default",
}: MarkAsPaidButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  const isPaid = currentStatus === "PAGO";
  const isCanceled = currentStatus === "CANCELADO";

  const handleSuccess = async () => {
    toast.success("Pagamento efetivado com sucesso!");
    // Fecha o dialog primeiro
    setDialogOpen(false);
    // Força atualização completa da página para refletir mudanças no status e valor
    router.refresh();
  };

  if (isPaid) {
    return (
      <Button
        variant="outline"
        size={size}
        disabled
        className="text-emerald-600 border-emerald-200"
      >
        <CheckCircle2 className="mr-2 h-4 w-4" />
        Já pago
      </Button>
    );
  }

  if (isCanceled) {
    return (
      <Button variant="outline" size={size} disabled>
        Cancelado
      </Button>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setDialogOpen(true)}
        disabled={disabled}
      >
        <CheckCircle2 className="mr-2 h-4 w-4" />
        Efetivar pagamento
      </Button>
      <PaymentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        cobrancaId={cobrancaId}
        valorCobranca={valorCobranca}
        onSuccess={handleSuccess}
      />
    </>
  );
}

