"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type ClientStatusToggleProps = {
  clientId: string;
  clientName: string;
  currentStatus: boolean;
};

export function ClientStatusToggle({
  clientId,
  clientName,
  currentStatus,
}: ClientStatusToggleProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleToggle = () => {
    setDialogOpen(true);
    setLoading(false); // Reset loading state when opening dialog
  };

  const handleDialogClose = (open: boolean) => {
    if (!loading) {
      setDialogOpen(open);
      if (!open) {
        setLoading(false); // Reset loading when closing
      }
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/clients/${clientId}/toggle-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ativo: !currentStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Erro ao atualizar status do cliente");
        setLoading(false);
        return;
      }

      toast.success(data.message || "Status atualizado com sucesso");
      setDialogOpen(false);
      setLoading(false);
      router.refresh();
    } catch (error) {
      toast.error("Erro ao conectar com o servidor");
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
          currentStatus
            ? "bg-emerald-500"
            : "bg-gray-300 dark:bg-gray-600"
        }`}
        aria-label={currentStatus ? "Desativar cliente" : "Ativar cliente"}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            currentStatus ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>

      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentStatus ? "Desativar cliente?" : "Ativar cliente?"}
            </DialogTitle>
            <DialogClose onClose={() => handleDialogClose(false)} />
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {currentStatus
                ? `Tem certeza que deseja desativar o cliente "${clientName}"? Clientes desativados não aparecerão nas cobranças automáticas.`
                : `Tem certeza que deseja ativar o cliente "${clientName}"? O cliente voltará a receber cobranças automáticas.`}
            </p>
            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogClose(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                variant={currentStatus ? "destructive" : "default"}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : currentStatus ? (
                  "Desativar"
                ) : (
                  "Ativar"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

