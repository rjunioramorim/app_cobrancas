'use client';

import { useCallback, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AdminUserTokensPanel } from "./admin-user-tokens-panel";
import { toast } from "sonner";
import { Calendar, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type AdminUser = {
  id: string;
  nome: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  tokens: number;
};

type Pagination = {
  limit: number;
  nextCursor: string | null;
  hasNextPage: boolean;
};

type Props = {
  initialUsers: AdminUser[];
  initialPagination: Pagination;
};

export function AdminUsersTable({
  initialUsers,
  initialPagination,
}: Props) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [pagination, setPagination] =
    useState<Pagination>(initialPagination);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [generatingForUserId, setGeneratingForUserId] = useState<string | null>(null);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateMonth, setGenerateMonth] = useState("");
  const [generateYear, setGenerateYear] = useState("");

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [users, selectedUserId]
  );

  const fetchUsers = useCallback(
    async (params?: { cursor?: string | null; search?: string }) => {
      setLoading(true);
      try {
        const searchParams = new URLSearchParams();
        if (params?.cursor) {
          searchParams.set("cursor", params.cursor);
        }
        if (params?.search) {
          searchParams.set("search", params.search);
        }
        const response = await fetch(
          `/api/admin/users?${searchParams.toString()}`,
          {
            cache: "no-store",
          }
        );
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.message || "Falha ao carregar usuários");
        }
        const body = await response.json();
        return body as {
          data: AdminUser[];
          pagination: Pagination;
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleSearch = useCallback(
    async (value: string) => {
      setSearch(value);
      const result = await fetchUsers({
        search: value || undefined,
      });
      setUsers(result.data);
      setPagination(result.pagination);
      setSelectedUserId(null);
    },
    [fetchUsers]
  );

  const handleLoadMore = useCallback(async () => {
    if (!pagination.hasNextPage || !pagination.nextCursor) return;
    const result = await fetchUsers({
      cursor: pagination.nextCursor,
      search: search || undefined,
    });
    setUsers((prev) => [...prev, ...result.data]);
    setPagination(result.pagination);
  }, [fetchUsers, pagination, search]);

  const handleTokenCreated = useCallback(
    (userId: string) => {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? { ...user, tokens: user.tokens + 1 }
            : user
        )
      );
    },
    []
  );

  const handleTokenRevoked = useCallback((userId: string) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId && user.tokens > 0
          ? { ...user, tokens: user.tokens - 1 }
          : user
      )
    );
  }, []);

  const handleGenerateBills = useCallback((userId: string) => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    setGenerateMonth(String(nextMonth.getMonth() + 1).padStart(2, "0"));
    setGenerateYear(String(nextMonth.getFullYear()));
    setGeneratingForUserId(userId);
    setGenerateDialogOpen(true);
  }, []);

  const handleConfirmGenerate = useCallback(async () => {
    if (!generatingForUserId) return;

    setGenerateLoading(true);
    try {
      const response = await fetch(
        `/api/admin/generate-bills/${generatingForUserId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            month: Number(generateMonth),
            year: Number(generateYear),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Erro ao gerar cobranças");
        return;
      }

      toast.success(data.message || "Cobranças geradas com sucesso!");
      setGenerateDialogOpen(false);
      setGeneratingForUserId(null);
    } catch (error) {
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setGenerateLoading(false);
    }
  }, [generatingForUserId, generateMonth, generateYear]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">
            Busque por nome ou email para localizar usuários e gerar API keys.
          </p>
        </div>
        <Input
          placeholder="Buscar usuários..."
          value={search}
          onChange={(event) => handleSearch(event.target.value)}
          className="sm:w-64"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <table className="min-w-full divide-y text-sm">
          <thead className="bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="px-6 py-3 font-medium">Usuário</th>
              <th className="px-6 py-3 font-medium">Email</th>
              <th className="px-6 py-3 font-medium">Tokens ativos</th>
              <th className="px-6 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-muted/30">
                <td className="px-6 py-3">
                  <div className="font-medium">{user.nome}</div>
                  <p className="text-xs text-muted-foreground">
                    {user.role} · {user.isActive ? "Ativo" : "Inativo"}
                  </p>
                </td>
                <td className="px-6 py-3">{user.email}</td>
                <td className="px-6 py-3">{user.tokens}</td>
                <td className="px-6 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateBills(user.id)}
                      title="Gerar cobranças para este usuário"
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Gerar cobranças
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSelectedUserId((prev) =>
                          prev === user.id ? null : user.id
                        )
                      }
                    >
                      {selectedUserId === user.id
                        ? "Fechar"
                        : "Gerenciar tokens"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pagination.hasNextPage ? (
          <div className="border-t px-6 py-3 text-right">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLoadMore}
              disabled={loading}
            >
              {loading ? "Carregando..." : "Carregar mais"}
            </Button>
          </div>
        ) : null}
      </div>

      {selectedUser ? (
        <AdminUserTokensPanel
          key={selectedUser.id}
          user={selectedUser}
          onClose={() => setSelectedUserId(null)}
          onTokenCreated={handleTokenCreated}
          onTokenRevoked={handleTokenRevoked}
        />
      ) : null}

      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar Cobranças</DialogTitle>
            <DialogClose onClose={() => setGenerateDialogOpen(false)} />
          </DialogHeader>
          <div className="space-y-4">
            {generatingForUserId && (
              <p className="text-sm text-muted-foreground">
                Gerar cobranças para:{" "}
                <strong>
                  {users.find((u) => u.id === generatingForUserId)?.nome}
                </strong>
              </p>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="generate-month">Mês</Label>
                <Input
                  id="generate-month"
                  type="number"
                  min="1"
                  max="12"
                  value={generateMonth}
                  onChange={(e) => setGenerateMonth(e.target.value)}
                  required
                  disabled={generateLoading}
                  placeholder="Ex: 12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="generate-year">Ano</Label>
                <Input
                  id="generate-year"
                  type="number"
                  min="2000"
                  max="2100"
                  value={generateYear}
                  onChange={(e) => setGenerateYear(e.target.value)}
                  required
                  disabled={generateLoading}
                  placeholder="Ex: 2025"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setGenerateDialogOpen(false)}
                disabled={generateLoading}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleConfirmGenerate}
                disabled={generateLoading}
              >
                {generateLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    Gerar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

