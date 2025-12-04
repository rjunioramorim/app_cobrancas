import { PropsWithChildren, ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";

type AppShellProps = PropsWithChildren<{
  title?: string;
  description?: string;
  actions?: ReactNode;
}>;

export function AppShell({
  title = "Dashboard",
  description = "Visão geral do sistema",
  actions,
  children,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-muted/20">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b bg-background/80 px-6 py-4 backdrop-blur">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            {actions ? (
              <div className="flex items-center gap-2">{actions}</div>
            ) : null}
          </div>
        </header>
        <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:pb-8">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}

