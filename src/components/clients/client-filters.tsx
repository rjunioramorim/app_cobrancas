'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ClientFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get("search") || "";
  const currentStatus = searchParams.get("status") || "todos";

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    
    if (search) {
      params.set("search", search);
    } else {
      params.delete("search");
    }
    
    router.push(`/clients?${params.toString()}`);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    
    if (status && status !== "todos") {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    
    router.push(`/clients?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/clients");
  };

  const hasActiveFilters = currentSearch || (currentStatus && currentStatus !== "todos");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label htmlFor="search">Buscar por nome</Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              name="search"
              type="text"
              placeholder="Digite o nome do cliente..."
              value={currentSearch}
              onChange={handleSearchChange}
              className="pl-9"
            />
          </div>
        </div>
        <div className="sm:w-48">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            value={currentStatus}
            onChange={handleStatusChange}
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="todos">Todos</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
          </select>
        </div>
        {hasActiveFilters && (
          <Button
            type="button"
            variant="outline"
            onClick={clearFilters}
            className="sm:w-auto"
          >
            <X className="mr-2 h-4 w-4" />
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
}

