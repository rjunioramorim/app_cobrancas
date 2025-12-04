'use client';

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

type PaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cobrancaId: string;
  valorCobranca: number;
  onSuccess: () => void;
};

const formatCurrency = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  // Converte para centavos e depois para reais
  const cents = parseInt(numbers) || 0;
  const reais = cents / 100;
  // Formata como moeda brasileira
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(reais);
};

const parseCurrency = (value: string): number => {
  const numbers = value.replace(/\D/g, '');
  return parseFloat(numbers) / 100 || 0;
};

export function PaymentDialog({
  open,
  onOpenChange,
  cobrancaId,
  valorCobranca,
  onSuccess,
}: PaymentDialogProps) {
  const [valorPagamento, setValorPagamento] = useState('');
  const [dataPagamento, setDataPagamento] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Preencher valores padrão quando o dialog abrir
  useEffect(() => {
    if (open) {
      // Valor padrão: valor da cobrança (formata como moeda para input)
      // Converte para centavos e depois formata
      const valorEmCentavos = Math.round(valorCobranca * 100);
      const valorFormatado = formatCurrency(String(valorEmCentavos));
      setValorPagamento(valorFormatado);

      // Data padrão: hoje
      const hoje = new Date();
      const dataFormatada = hoje.toISOString().split('T')[0];
      setDataPagamento(dataFormatada);

      setError('');
    }
  }, [open, valorCobranca]);

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setValorPagamento(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const valor = parseCurrency(valorPagamento);
      
      if (valor <= 0) {
        setError('O valor do pagamento deve ser maior que zero');
        setLoading(false);
        return;
      }

      if (!dataPagamento) {
        setError('A data de pagamento é obrigatória');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/cobrancas/${cobrancaId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valor: valor,
          dataPagamento: dataPagamento,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao efetivar pagamento');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Erro ao efetivar pagamento. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Efetivar Pagamento</DialogTitle>
          <DialogClose onClose={() => onOpenChange(false)} />
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="valor">Valor do pagamento *</Label>
            <Input
              id="valor"
              type="text"
              value={valorPagamento}
              onChange={handleValorChange}
              placeholder="0,00"
              disabled={loading}
              className="text-lg font-semibold"
            />
            <p className="text-xs text-muted-foreground">
              Valor padrão: {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(valorCobranca)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataPagamento">Data do pagamento *</Label>
            <Input
              id="dataPagamento"
              type="date"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar pagamento'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

