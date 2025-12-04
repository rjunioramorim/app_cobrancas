'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useSession } from "next-auth/react";
import { navItems } from "./nav-items";

export function BottomNav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = session?.user?.role as "ADMIN" | "USER" | undefined;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t bg-card/95 py-2 backdrop-blur md:hidden">
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
                "flex flex-col items-center gap-1 text-xs font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
    </nav>
  );
}

