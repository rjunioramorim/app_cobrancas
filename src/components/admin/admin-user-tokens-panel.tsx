'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type AdminUser = {
  id: string;
  nome: string;
  email: string;
};

type TokenRecord = {
  id: string;
  name: string;
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
};

type Props = {
  user: AdminUser & { tokens: number };
  onClose: () => void;
  onTokenCreated: (userId: string) => void;
  onTokenRevoked: (userId: string) => void;
};

export function AdminUserTokensPanel({
  user,
  onClose,
  onTokenCreated,
  onTokenRevoked,
}: Props) {
  const [tokens, setTokens] = useState<TokenRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTokenName, setNewTokenName] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  const loadTokens = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/tokens`, {
        cache: "no-store",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || "Falha ao carregar tokens");
      }
      const body = await response.json();
      setTokens(
        (body.data as any[]).map((token) => ({
          ...token,
          createdAt: token.createdAt,
          expiresAt: token.expiresAt,
          lastUsedAt: token.lastUsedAt,
        }))
      );
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadTokens();
  }, [loadTokens]);

  const handleCreateToken = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!newTokenName.trim()) {
        toast.error("Informe um nome para o token.");
        return;
      }
      setCreating(true);
      try {
        const response = await fetch(`/api/admin/users/${user.id}/tokens`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newTokenName.trim(),
            expiresAt: expiresAt || null,
          }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.message || "Não foi possível gerar o token");
        }

        const body = await response.json();
        setGeneratedToken(body.data.token);
        setNewTokenName("");
        setExpiresAt("");
        onTokenCreated(user.id);
        await loadTokens();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Erro inesperado ao criar token"
        );
      } finally {
        setCreating(false);
      }
    },
    [expiresAt, loadTokens, newTokenName, onTokenCreated, user.id]
  );

  const handleRevoke = useCallback(
    async (tokenId: string) => {
      if (!confirm("Deseja revogar este token? Essa ação é irreversível.")) {
        return;
      }
      try {
        const response = await fetch(
          `/api/admin/users/${user.id}/tokens/${tokenId}`,
          {
            method: "DELETE",
          }
        );
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.message || "Falha ao revogar token");
        }
        toast.success("Token revogado com sucesso.");
        onTokenRevoked(user.id);
        await loadTokens();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Erro inesperado ao revogar token"
        );
      }
    },
    [loadTokens, onTokenRevoked, user.id]
  );

  const copyGeneratedToken = useCallback(() => {
    if (!generatedToken) return;
    navigator.clipboard
      .writeText(generatedToken)
      .then(() => toast.success("Token copiado"))
      .catch(() => toast.error("Não foi possível copiar."));
  }, [generatedToken]);

  const maskToken = (id: string) =>
    `${id.slice(0, 4)}••••${id.slice(-4)}`;

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{user.nome}</h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <Button variant="ghost" onClick={onClose}>
          Fechar
        </Button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <form onSubmit={handleCreateToken} className="space-y-3">
          <div>
            <Label htmlFor="token-name">Nome do token</Label>
            <Input
              id="token-name"
              value={newTokenName}
              onChange={(event) => setNewTokenName(event.target.value)}
              placeholder="Ex.: Integração n8n"
            />
          </div>
          <div>
            <Label htmlFor="token-expiration">Expira em (opcional)</Label>
            <Input
              id="token-expiration"
              type="date"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
            />
          </div>
          <Button type="submit" disabled={creating}>
            {creating ? "Gerando..." : "Gerar token"}
          </Button>
          {generatedToken ? (
            <div className="rounded-md border border-dashed border-primary/40 bg-muted/40 p-4 text-sm">
              <p className="font-medium">Token recém-gerado</p>
              <p className="mt-2 break-all text-xs text-muted-foreground">
                {generatedToken}
              </p>
              <p className="mt-2 text-xs text-orange-600">
                Copie e salve com segurança. Esse valor não será mostrado
                novamente.
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={copyGeneratedToken}
              >
                Copiar token
              </Button>
            </div>
          ) : null}
        </form>

        <div className="rounded-xl border bg-card/60 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Tokens existentes</h3>
            <span className="text-sm text-muted-foreground">
              {tokens.length} cadastrados
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">
                Carregando tokens...
              </p>
            ) : tokens.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum token registrado para este usuário.
              </p>
            ) : (
              tokens.map((token) => (
                <div
                  key={token.id}
                  className="rounded-lg border border-muted/60 p-3 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{token.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Criado em {new Date(token.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ID: {maskToken(token.id)}
                      </p>
                      {token.expiresAt ? (
                        <p className="text-xs text-orange-600">
                          Expira em {new Date(token.expiresAt).toLocaleDateString("pt-BR")}
                        </p>
                      ) : null}
                      {token.lastUsedAt ? (
                        <p className="text-xs text-muted-foreground">
                          Último uso em{" "}
                          {new Date(token.lastUsedAt).toLocaleDateString("pt-BR")}
                        </p>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevoke(token.id)}
                    >
                      Revogar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

