'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";

const statusOptions = [
  { value: "todos", label: "Todos os status" },
  { value: "PENDENTE", label: "Pendente" },
  { value: "ATRASADO", label: "Atrasado" },
  { value: "PAGO", label: "Pago" },
  { value: "CANCELADO", label: "Cancelado" },
];

export function StatusFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") || "todos";

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    
    if (value && value !== "todos") {
      params.set("status", value);
    } else {
      params.delete("status");
    }
    
    router.push(`/cobrancas?${params.toString()}`);
  };

  return (
    <div className="flex-1">
      <Label htmlFor="status">Filtrar por status</Label>
      <select
        id="status"
        name="status"
        value={currentStatus}
        onChange={handleStatusChange}
        className="mt-1 flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

