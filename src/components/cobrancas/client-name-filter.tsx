'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

export function ClientNameFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get("clientName") || "";

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    
    if (search.trim()) {
      params.set("clientName", search.trim());
    } else {
      params.delete("clientName");
    }
    
    router.push(`/cobrancas?${params.toString()}`);
  };

  return (
    <div className="flex-1">
      <Label htmlFor="clientName">Buscar por cliente</Label>
      <div className="relative mt-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="clientName"
          name="clientName"
          type="text"
          placeholder="Digite o nome do cliente..."
          value={currentSearch}
          onChange={handleSearchChange}
          className="pl-9"
        />
      </div>
    </div>
  );
}

