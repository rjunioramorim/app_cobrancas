'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MonthFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentMonth = searchParams.get("month") || "";

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const month = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    
    if (month) {
      params.set("month", month);
    } else {
      params.delete("month");
    }
    
    router.push(`/cobrancas?${params.toString()}`);
  };

  const getCurrentMonthDefault = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Label htmlFor="month">Filtrar por mês</Label>
        <Input
          id="month"
          name="month"
          type="month"
          defaultValue={currentMonth || getCurrentMonthDefault()}
          onChange={handleMonthChange}
          className="mt-1"
        />
      </div>
    </div>
  );
}

