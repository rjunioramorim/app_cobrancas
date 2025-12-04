'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { signOut, useSession } from "next-auth/react";
import { navItems } from "./nav-items";

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = session?.user?.role as "ADMIN" | "USER" | undefined;

  return (
    <aside className="hidden w-64 flex-col border-r border-sidebar-border bg-sidebar p-6 text-sidebar-foreground md:flex">
      <div className="mb-8">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
          Cobrancas App
        </Link>
        <p className="text-sm text-muted-foreground">
          Gestão de clientes e cobranças
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-2">
        {navItems
          .filter((item) => {
            // Se o item não tem roles definidos, mostra para todos
            if (!item.roles) {
              return true;
            }
            // Se o item tem roles, só mostra se o usuário tem role e está na lista
            if (role && item.roles.includes(role as "ADMIN" | "USER")) {
              return true;
            }
            return false;
          })
          .map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        <form
          className="mt-auto rounded-lg border border-dashed border-sidebar-border p-4 text-sm text-muted-foreground"
          action={async () => {
            await signOut({
              redirectTo: "/login",
            });
          }}
        >
          <p className="mb-3">Precisa sair?</p>
          <button
            type="submit"
            className="w-full rounded-md bg-sidebar-primary px-3 py-2 text-sm font-medium text-sidebar-primary-foreground transition hover:opacity-90"
          >
            Logout
          </button>
        </form>
      </nav>
    </aside>
  );
}

